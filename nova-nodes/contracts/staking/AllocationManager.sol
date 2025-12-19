// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../integrations/ISuzaku.sol";
import "../integrations/IRWAVault.sol";
import "./IRewardDistributor.sol";

/**
 * @title AllocationManager
 * @notice Manages yield strategies, caps, and emergency rerouting.
 * @dev Diversifies assets between Suzaku (restaking) and RWA vaults.
 */
contract AllocationManager is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant STRATEGIST_ROLE = keccak256("STRATEGIST_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    struct Strategy {
        address strategyAddress;
        uint256 weight; // Weight in basis points (10000 = 100%)
        uint256 depositCap; // Maximum amount of assets allowed in this strategy
        uint256 currentAssets;
        bool isActive;
        bool isRWA; // True if it's an IRWAVault, False if ISuzaku
    }

    Strategy[] public strategies;
    uint256 public totalWeight;
    uint256 public globalDepositCap;
    uint256 public totalAssetsManaged;

    address public immutable assetToken; // e.g., sAVAX or USDC/USDT underlying
    address public emergencyRerouteTaget; // Address to send funds in case of total failure
    
    // Safety Limits
    uint256 public maxRewardPerSecond; // Max reward tokens distributed per second
    uint256 public lastHarvestTime;
    
    // Yield Split (Basis Points)
    uint256 public splitNFTHolders = 7000; // 70%
    uint256 public splitTreasury = 2000;   // 20%
    uint256 public splitBuybackBurn = 1000; // 10%
    uint256 public constant BASIS_POINTS = 10000;

    address public rewardDistributor;
    address public treasury;
    address public burnAddress = 0x000000000000000000000000000000000000dEaD;

    event StrategyAdded(uint256 indexed id, address strategy, bool isRWA);
    event StrategyUpdated(uint256 indexed id, uint256 weight, uint256 cap);
    event AllocationRerouted(uint256 indexed fromId, address to);
    event EmergencyRerouteSet(address target);
    event AssetsRebalanced(uint256 totalAssets);
    event YieldHarvested(uint256 totalYield, uint256 nftYield, uint256 treasuryYield, uint256 burnYield);
    event SplitUpdated(uint256 nft, uint256 treasury, uint256 burn);

    constructor(address _assetToken, address _admin) {
        assetToken = _assetToken;
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(STRATEGIST_ROLE, _admin);
        _grantRole(EMERGENCY_ROLE, _admin);
    }

    /**
     * @notice Adds a new yield strategy.
     */
    function addStrategy(
        address _strategy,
        uint256 _weight,
        uint256 _cap,
        bool _isRWA
    ) external onlyRole(STRATEGIST_ROLE) {
        require(_strategy != address(0), "Invalid address");
        require(totalWeight + _weight <= 10000, "Weight exceeds 100%");

        strategies.push(Strategy({
            strategyAddress: _strategy,
            weight: _weight,
            depositCap: _cap,
            currentAssets: 0,
            isActive: true,
            isRWA: _isRWA
        }));

        totalWeight += _weight;
        emit StrategyAdded(strategies.length - 1, _strategy, _isRWA);
    }

    /**
     * @notice Updates existing strategy parameters.
     */
    function updateStrategy(
        uint256 _id,
        uint256 _weight,
        uint256 _cap,
        bool _isActive
    ) external onlyRole(STRATEGIST_ROLE) {
        require(_id < strategies.length, "Invalid ID");
        
        totalWeight = totalWeight - strategies[_id].weight + _weight;
        require(totalWeight <= 10000, "Total weight > 100%");

        strategies[_id].weight = _weight;
        strategies[_id].depositCap = _cap;
        strategies[_id].isActive = _isActive;

        emit StrategyUpdated(_id, _weight, _cap);
    }

    /**
     * @notice Set global deposit cap for the entire manager.
     */
    function setGlobalDepositCap(uint256 _cap) external onlyRole(STRATEGIST_ROLE) {
        globalDepositCap = _cap;
    }

    /**
     * @notice Emergency reroute funds from a failing strategy.
     */
    function rerouteStrategy(uint256 _id, address _target) external onlyRole(EMERGENCY_ROLE) {
        require(_id < strategies.length, "Invalid ID");
        Strategy storage strat = strategies[_id];
        
        uint256 balanceBefore = IERC20(assetToken).balanceOf(address(this));
        
        if (strat.isRWA) {
            IRWAVault(strat.strategyAddress).withdraw(IRWAVault(strat.strategyAddress).balanceOf(address(this)));
        } else {
            ISuzaku(strat.strategyAddress).withdraw(ISuzaku(strat.strategyAddress).balanceOf(address(this)));
        }

        uint256 withdrawn = IERC20(assetToken).balanceOf(address(this)) - balanceBefore;
        IERC20(assetToken).safeTransfer(_target, withdrawn);
        
        strat.isActive = false;
        strat.weight = 0;
        strat.currentAssets = 0;

        emit AllocationRerouted(_id, _target);
    }

    /**
     * @notice Deposit assets into strategies based on weights.
     */
    function deposit(uint256 _amount) external nonReentrant whenNotPaused {
        require(totalAssetsManaged + _amount <= globalDepositCap || globalDepositCap == 0, "Global cap reached");
        IERC20(assetToken).safeTransferFrom(msg.sender, address(this), _amount);

        for (uint256 i = 0; i < strategies.length; i++) {
            Strategy storage strat = strategies[i];
            if (!strat.isActive || strat.weight == 0) continue;

            uint256 allocation = (_amount * strat.weight) / totalWeight;
            if (strat.currentAssets + allocation > strat.depositCap && strat.depositCap > 0) {
                allocation = strat.depositCap - strat.currentAssets;
            }

            if (allocation > 0) {
                IERC20(assetToken).safeIncreaseAllowance(strat.strategyAddress, allocation);
                if (strat.isRWA) {
                    IRWAVault(strat.strategyAddress).deposit(allocation);
                } else {
                    ISuzaku(strat.strategyAddress).deposit(allocation);
                }
                strat.currentAssets += allocation;
                totalAssetsManaged += allocation;
            }
        }
    }

    /**
     * @notice Set emergency vault target.
     */
    function setEmergencyTarget(address _target) external onlyRole(DEFAULT_ADMIN_ROLE) {
        emergencyRerouteTaget = _target;
        emit EmergencyRerouteSet(_target);
    }

    function pause() external onlyRole(EMERGENCY_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Harvest yield from all active strategies and distribute according to splits.
     */
    function harvestAll() external onlyRole(STRATEGIST_ROLE) nonReentrant {
        uint256 totalYield = 0;
        
        for (uint256 i = 0; i < strategies.length; i++) {
            Strategy storage strat = strategies[i];
            if (!strat.isActive) continue;

            uint256 balanceBefore = IERC20(assetToken).balanceOf(address(this));
            
            if (strat.isRWA) {
                uint256 stratBalance = IRWAVault(strat.strategyAddress).balanceOf(address(this));
                if (stratBalance > strat.currentAssets) {
                    IRWAVault(strat.strategyAddress).withdraw(stratBalance - strat.currentAssets);
                }
            } else {
                uint256 stratBalance = ISuzaku(strat.strategyAddress).balanceOf(address(this));
                if (stratBalance > strat.currentAssets) {
                    ISuzaku(strat.strategyAddress).withdraw(stratBalance - strat.currentAssets);
                }
            }
            
            uint256 withdrawn = IERC20(assetToken).balanceOf(address(this)) - balanceBefore;
            totalYield += withdrawn;
        }

        if (totalYield > 0) {
            _distributeYield(totalYield);
        }
    }

    /**
     * @notice Internal function to distribute yield with APY throttling.
     */
    function _distributeYield(uint256 _amount) internal {
        uint256 amountToDistribute = _amount;
        
        // APY Throttling
        if (maxRewardPerSecond > 0 && lastHarvestTime > 0) {
            uint256 timePassed = block.timestamp - lastHarvestTime;
            uint256 maxAllowed = timePassed * maxRewardPerSecond;
            if (amountToDistribute > maxAllowed) {
                amountToDistribute = maxAllowed;
            }
        }
        lastHarvestTime = block.timestamp;

        uint256 nftYield = (amountToDistribute * splitNFTHolders) / BASIS_POINTS;
        uint256 treasuryYield = (amountToDistribute * splitTreasury) / BASIS_POINTS;
        uint256 burnYield = amountToDistribute - nftYield - treasuryYield;

        if (nftYield > 0 && rewardDistributor != address(0)) {
            IERC20(assetToken).safeIncreaseAllowance(rewardDistributor, nftYield);
            IRewardDistributor(rewardDistributor).notifyRewardAmount(nftYield);
        }

        if (treasuryYield > 0 && treasury != address(0)) {
            IERC20(assetToken).safeTransfer(treasury, treasuryYield);
        }

        if (burnYield > 0) {
            IERC20(assetToken).safeTransfer(burnAddress, burnYield);
        }

        // Any excess yield stays in AllocationManager for next harvest or as reserve
        emit YieldHarvested(amountToDistribute, nftYield, treasuryYield, burnYield);
    }

    /**
     * @notice Set max reward per second (APY throttle).
     */
    function setMaxRewardPerSecond(uint256 _max) external onlyRole(STRATEGIST_ROLE) {
        maxRewardPerSecond = _max;
    }

    /**
     * @notice Set yield split parameters.
     */
    function setSplit(uint256 _nft, uint256 _treasury, uint256 _burn) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_nft + _treasury + _burn == BASIS_POINTS, "Invalid split sum");
        splitNFTHolders = _nft;
        splitTreasury = _treasury;
        splitBuybackBurn = _burn;
        emit SplitUpdated(_nft, _treasury, _burn);
    }

    /**
     * @notice Set reward distributor and treasury addresses.
     */
    function setAddresses(address _distributor, address _treasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        rewardDistributor = _distributor;
        treasury = _treasury;
    }
}
