// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../core/NodeNFT.sol";

/**
 * @title RewardDistributor
 * @notice Distributes rewards to Node NFT holders based on their staked amount and rarity multipliers.
 * @dev Optimized with state-tracked totalWeight to avoid gas-intensive loops.
 */
contract RewardDistributor is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");

    NodeNFT public immutable nodeNFT;
    IERC20 public immutable rewardToken;

    uint256 public totalRewardsDistributed;
    uint256 public rewardPerShareStored;
    uint256 public totalWeight;

    mapping(uint256 => uint256) public userRewardPerSharePaid;
    mapping(uint256 => uint256) public rewards;

    event RewardAdded(uint256 reward);
    event RewardPaid(address indexed user, uint256 indexed nodeId, uint256 reward);
    event WeightUpdated(uint256 totalWeight);

    constructor(address _nodeNFT, address _rewardToken) {
        nodeNFT = NodeNFT(_nodeNFT);
        rewardToken = IERC20(_rewardToken);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Notify contract of new rewards (called by AllocationManager).
     * @param _amount Amount of reward tokens added.
     */
    function notifyRewardAmount(uint256 _amount) external onlyRole(DISTRIBUTOR_ROLE) {
        // Transfer not needed if AllocationManager already sent it, but good for safety if using transferFrom
        // rewardToken.handleTransferFrom(...) 

        if (totalWeight > 0) {
            rewardPerShareStored += (_amount * 1e18) / totalWeight;
        }
        
        totalRewardsDistributed += _amount;
        emit RewardAdded(_amount);
    }

    /**
     * @notice Earned rewards for a specific node.
     */
    function earned(uint256 _nodeId) public view returns (uint256) {
        NodeNFT.NodeData memory node = nodeNFT.getNode(_nodeId);
        uint256 weight = (node.stakedAmount * node.yieldMultiplier) / 10000;
        return (weight * (rewardPerShareStored - userRewardPerSharePaid[_nodeId])) / 1e18 + rewards[_nodeId];
    }

    /**
     * @notice Claim rewards for a specific node.
     */
    function claimReward(uint256 _nodeId) public nonReentrant whenNotPaused {
        require(nodeNFT.ownerOf(_nodeId) == msg.sender, "Not node owner");
        
        _updateReward(_nodeId);
        uint256 reward = rewards[_nodeId];
        if (reward > 0) {
            rewards[_nodeId] = 0;
            rewardToken.safeTransfer(msg.sender, reward);
            nodeNFT.updateLastClaimTime(_nodeId);
            emit RewardPaid(msg.sender, _nodeId, reward);
        }
    }

    /**
     * @notice Update weight for a node (called by NodeNFT during mint/burn/merge).
     */
    function onNodeUpdate(uint256 _nodeId, uint256 _oldWeight, uint256 _newWeight) external onlyRole(UPDATER_ROLE) {
        _updateReward(_nodeId);
        totalWeight = totalWeight - _oldWeight + _newWeight;
        emit WeightUpdated(totalWeight);
    }

    /**
     * @notice Update reward for a specific node.
     */
    function _updateReward(uint256 _nodeId) internal {
        if (_nodeId != 0 || nodeNFT.totalSupply() > 0) { // Safety check
            rewards[_nodeId] = earned(_nodeId);
        }
        userRewardPerSharePaid[_nodeId] = rewardPerShareStored;
    }
}
