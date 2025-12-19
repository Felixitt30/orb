// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ISuzaku
 * @notice Interface for Suzaku restaking protocol
 * @dev Simplified interface for restaking LSTs to secure Avalanche L1s/subnets
 */
interface ISuzaku {
    /**
     * @notice Deposit assets for restaking
     * @param amount Amount to deposit
     * @return shares Amount of shares received
     */
    function deposit(uint256 amount) external returns (uint256 shares);

    /**
     * @notice Withdraw assets from restaking
     * @param shares Amount of shares to withdraw
     * @return amount Amount of assets withdrawn
     */
    function withdraw(uint256 shares) external returns (uint256 amount);

    /**
     * @notice Claim restaking rewards
     * @return rewards Amount of rewards claimed
     */
    function claimRewards() external returns (uint256 rewards);

    /**
     * @notice Get current APR
     * @return apr Annual percentage rate in basis points
     */
    function getCurrentAPR() external view returns (uint256 apr);

    /**
     * @notice Get total assets deposited
     * @return Total assets
     */
    function totalAssets() external view returns (uint256);

    /**
     * @notice Get user's share balance
     * @param user User address
     * @return User's shares
     */
    function balanceOf(address user) external view returns (uint256);
}
