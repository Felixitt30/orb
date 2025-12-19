// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../core/LiquidRestakingToken.sol";
import "../core/NodeNFT.sol";

/**
 * @title StakingVault
 * @notice Core staking contract for Nova Nodes protocol
 * @dev Accepts LSTs (sAVAX, ggAVAX), mints lrAVAX + Node NFT
 */
contract StakingVault is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /// @notice Liquid restaking token
    LiquidRestakingToken public immutable lrAVAX;

    /// @notice Node NFT contract
    NodeNFT public immutable nodeNFT;

    /// @notice Allocation Manager for yield strategies
    address public allocationManager;

    /// @notice Withdrawal throttle parameters
    uint256 public constant MAX_WITHDRAWAL_BPS = 1000; // 10% of TVL per 24h
    uint256 public lastWithdrawalTimestamp;
    uint256 public totalWithdrawnToday;

    /// @notice Emergency yield rerouting target
    address public emergencyRerouteTarget;

    /// @notice Accepted LST tokens
    mapping(address => bool) public acceptedLSTs;
    address[] public lstList;

    /// @notice Unstaking cooldown period (7 days)
    uint256 public constant COOLDOWN_PERIOD = 7 days;

    /// @notice Instant unstake penalty (5%)
    uint256 public constant INSTANT_UNSTAKE_PENALTY = 500; // 5% in basis points

    /// @notice Basis points denominator
    uint256 public constant BASIS_POINTS = 10000;

    /// @notice Treasury address for fees
    address public treasury;

    /// @notice Unstake requests
    struct UnstakeRequest {
        uint256 nodeId;
        uint256 lrAVAXAmount;
        uint256 lstAmount;
        address lstToken;
        uint64 requestTime;
        bool processed;
    }

    /// @notice Mapping from user to unstake requests
    mapping(address => UnstakeRequest[]) public unstakeRequests;

    /// @notice Total LST assets held
    mapping(address => uint256) public totalLSTHeld;

    /// @notice Events
    event Staked(
        address indexed user,
        address indexed lstToken,
        uint256 lstAmount,
        uint256 lrAVAXMinted,
        uint256 nodeId
    );

    event UnstakeRequested(
        address indexed user,
        uint256 indexed nodeId,
        uint256 lrAVAXAmount,
        uint256 lstAmount,
        uint256 requestIndex,
        uint64 availableAt
    );

    event InstantUnstaked(
        address indexed user,
        uint256 indexed nodeId,
        uint256 lrAVAXBurned,
        uint256 lstReturned,
        uint256 penalty
    );

    event UnstakeProcessed(
        address indexed user,
        uint256 requestIndex,
        uint256 lstAmount
    );

    event LSTAdded(address indexed lstToken);
    event LSTRemoved(address indexed lstToken);
    event TreasuryUpdated(address indexed newTreasury);

    constructor(
        address _lrAVAX,
        address _nodeNFT,
        address _treasury,
        address[] memory _initialLSTs
    ) {
        require(_lrAVAX != address(0), "Invalid lrAVAX");
        require(_nodeNFT != address(0), "Invalid NodeNFT");
        require(_treasury != address(0), "Invalid treasury");

        lrAVAX = LiquidRestakingToken(_lrAVAX);
        nodeNFT = NodeNFT(_nodeNFT);
        treasury = _treasury;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);

        // Add initial LSTs
        for (uint256 i = 0; i < _initialLSTs.length; i++) {
            acceptedLSTs[_initialLSTs[i]] = true;
            lstList.push(_initialLSTs[i]);
            emit LSTAdded(_initialLSTs[i]);
        }
    }

    /**
     * @notice Stake LST tokens to mint lrAVAX and Node NFT
     * @param lstToken LST token address (sAVAX or ggAVAX)
     * @param amount Amount of LST to stake
     * @return nodeId The minted Node NFT ID
     */
    function stake(address lstToken, uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256 nodeId) 
    {
        require(acceptedLSTs[lstToken], "LST not accepted");
        require(amount > 0, "Cannot stake 0");

        // Transfer LST from user
        IERC20(lstToken).safeTransferFrom(msg.sender, address(this), amount);
        totalLSTHeld[lstToken] += amount;

        // Mint lrAVAX (1:1 with LST initially, exchange rate increases over time)
        uint256 lrAVAXMinted = lrAVAX.deposit(msg.sender, amount);

        // Mint Node NFT
        nodeId = nodeNFT.mint(msg.sender, lrAVAXMinted);

        // Push assets to AllocationManager if set
        if (allocationManager != address(0)) {
            IERC20(lstToken).safeIncreaseAllowance(allocationManager, amount);
            // Assuming AllocationManager can handle multiple LSTs or has a wrapper
            // For now, we record it and notify
        }

        emit Staked(msg.sender, lstToken, amount, lrAVAXMinted, nodeId);
    }

    /**
     * @notice Request unstake with 7-day cooldown (no penalty)
     * @param nodeId Node NFT ID to unstake
     */
    function requestUnstake(uint256 nodeId) external nonReentrant whenNotPaused {
        require(nodeNFT.ownerOf(nodeId) == msg.sender, "Not node owner");

        NodeNFT.NodeData memory node = nodeNFT.getNode(nodeId);
        uint256 lrAVAXAmount = node.stakedAmount;

        // Convert lrAVAX to LST at current exchange rate
        uint256 lstAmount = lrAVAX.convertToAssets(lrAVAXAmount);

        // Determine which LST to return (use first available with sufficient balance)
        address lstToken = _selectLSTForWithdrawal(lstAmount);
        require(lstToken != address(0), "Insufficient LST liquidity");

        // Create unstake request
        unstakeRequests[msg.sender].push(UnstakeRequest({
            nodeId: nodeId,
            lrAVAXAmount: lrAVAXAmount,
            lstAmount: lstAmount,
            lstToken: lstToken,
            requestTime: uint64(block.timestamp),
            processed: false
        }));

        uint256 requestIndex = unstakeRequests[msg.sender].length - 1;
        uint64 availableAt = uint64(block.timestamp + COOLDOWN_PERIOD);

        emit UnstakeRequested(msg.sender, nodeId, lrAVAXAmount, lstAmount, requestIndex, availableAt);
    }

    /**
     * @notice Process unstake request after cooldown
     * @param requestIndex Index of the unstake request
     */
    function processUnstake(uint256 requestIndex) external nonReentrant {
        UnstakeRequest storage request = unstakeRequests[msg.sender][requestIndex];
        require(!request.processed, "Already processed");
        require(block.timestamp >= request.requestTime + COOLDOWN_PERIOD, "Cooldown not finished");

        request.processed = true;

        // Burn Node NFT
        nodeNFT.burn(request.nodeId);

        // Burn lrAVAX
        lrAVAX.withdraw(msg.sender, request.lrAVAXAmount);

        // Return LST
        totalLSTHeld[request.lstToken] -= request.lstAmount;
        IERC20(request.lstToken).safeTransfer(msg.sender, request.lstAmount);

        emit UnstakeProcessed(msg.sender, requestIndex, request.lstAmount);
    }

    /**
     * @notice Instant unstake with 5% penalty
     * @param nodeId Node NFT ID to unstake
     */
    function instantUnstake(uint256 nodeId) external nonReentrant whenNotPaused {
        require(nodeNFT.ownerOf(nodeId) == msg.sender, "Not node owner");

        NodeNFT.NodeData memory node = nodeNFT.getNode(nodeId);
        uint256 lrAVAXAmount = node.stakedAmount;

        // Convert lrAVAX to LST at current exchange rate
        uint256 lstAmount = lrAVAX.convertToAssets(lrAVAXAmount);

        // Apply 5% penalty
        uint256 penalty = (lstAmount * INSTANT_UNSTAKE_PENALTY) / BASIS_POINTS;
        uint256 lstReturned = lstAmount - penalty;

        // Determine which LST to return
        address lstToken = _selectLSTForWithdrawal(lstAmount);
        require(lstToken != address(0), "Insufficient LST liquidity");

        // Check withdrawal throttle
        _checkWithdrawalThrottle(lstAmount);

        // Burn Node NFT
        nodeNFT.burn(nodeId);

        // Burn lrAVAX
        lrAVAX.withdraw(msg.sender, lrAVAXAmount);

        // Return LST (minus penalty)
        totalLSTHeld[lstToken] -= lstAmount;
        IERC20(lstToken).safeTransfer(msg.sender, lstReturned);

        // Send penalty to treasury
        IERC20(lstToken).safeTransfer(treasury, penalty);

        emit InstantUnstaked(msg.sender, nodeId, lrAVAXAmount, lstReturned, penalty);
    }

    /**
     * @notice Compound rewards into a node (increases staked amount)
     * @param nodeId Node NFT ID
     * @param additionalLrAVAX Additional lrAVAX to add
     */
    function compound(uint256 nodeId, uint256 additionalLrAVAX) 
        external 
        onlyRole(OPERATOR_ROLE) 
    {
        require(nodeNFT.ownerOf(nodeId) != address(0), "Node does not exist");
        
        NodeNFT.NodeData memory node = nodeNFT.getNode(nodeId);
        uint256 newAmount = node.stakedAmount + additionalLrAVAX;
        
        nodeNFT.updateStakedAmount(nodeId, newAmount);
    }

    /**
     * @notice Add accepted LST token
     * @param lstToken LST token address
     */
    function addLST(address lstToken) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(lstToken != address(0), "Invalid address");
        require(!acceptedLSTs[lstToken], "Already accepted");
        
        acceptedLSTs[lstToken] = true;
        lstList.push(lstToken);
        emit LSTAdded(lstToken);
    }

    /**
     * @notice Remove accepted LST token
     * @param lstToken LST token address
     */
    function removeLST(address lstToken) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(acceptedLSTs[lstToken], "Not accepted");
        
        acceptedLSTs[lstToken] = false;
        
        // Remove from lstList
        for (uint256 i = 0; i < lstList.length; i++) {
            if (lstList[i] == lstToken) {
                lstList[i] = lstList[lstList.length - 1];
                lstList.pop();
                break;
            }
        }
        
        emit LSTRemoved(lstToken);
    }

    /**
     * @notice Update treasury address
     * @param newTreasury New treasury address
     */
    function setTreasury(address newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newTreasury != address(0), "Invalid address");
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }

    /**
     * @notice Get all unstake requests for a user
     * @param user User address
     * @return Array of unstake requests
     */
    function getUnstakeRequests(address user) external view returns (UnstakeRequest[] memory) {
        return unstakeRequests[user];
    }

    /**
     * @notice Select LST token for withdrawal
     * @param amount Amount needed
     * @return LST token address or address(0) if insufficient
     */
    function _selectLSTForWithdrawal(uint256 amount) private view returns (address) {
        // Simple strategy: return first LST with sufficient balance
        for (uint256 i = 0; i < lstList.length; i++) {
            if (acceptedLSTs[lstList[i]] && totalLSTHeld[lstList[i]] >= amount) {
                return lstList[i];
            }
        }

        return address(0);
    }

    /**
     * @notice Emergency withdraw (only when paused)
     * @param nodeId Node NFT ID
     */
    function emergencyWithdraw(uint256 nodeId) external nonReentrant whenPaused {
        require(nodeNFT.ownerOf(nodeId) == msg.sender, "Not node owner");

        NodeNFT.NodeData memory node = nodeNFT.getNode(nodeId);
        uint256 lrAVAXAmount = node.stakedAmount;
        uint256 lstAmount = lrAVAX.convertToAssets(lrAVAXAmount);

        address lstToken = _selectLSTForWithdrawal(lstAmount);
        require(lstToken != address(0), "Insufficient LST liquidity");

        // Burn Node NFT
        nodeNFT.burn(nodeId);

        // Burn lrAVAX
        lrAVAX.withdraw(msg.sender, lrAVAXAmount);

        // Return LST
        totalLSTHeld[lstToken] -= lstAmount;
        IERC20(lstToken).safeTransfer(msg.sender, lstAmount);
    }

    /**
     * @notice Pause contract
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Set AllocationManager address
     */
    function setAllocationManager(address _manager) external onlyRole(DEFAULT_ADMIN_ROLE) {
        allocationManager = _manager;
    }

    /**
     * @notice Internal check for withdrawal throttle (10% of TVL per 24h)
     */
    function _checkWithdrawalThrottle(uint256 amount) internal {
        if (block.timestamp >= lastWithdrawalTimestamp + 1 days) {
            lastWithdrawalTimestamp = block.timestamp;
            totalWithdrawnToday = 0;
        }

        uint256 totalTVL = lrAVAX.totalAssets();
        uint256 maxWithdrawal = (totalTVL * MAX_WITHDRAWAL_BPS) / BASIS_POINTS;
        
        require(totalWithdrawnToday + amount <= maxWithdrawal, "Withdrawal throttle reached");
        totalWithdrawnToday += amount;
    }

    /**
     * @notice Set emergency yield reroute target
     */
    function setEmergencyRerouteTarget(address _target) external onlyRole(DEFAULT_ADMIN_ROLE) {
        emergencyRerouteTarget = _target;
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
