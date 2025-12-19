// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IRWAVault
 * @notice Interface for Real World Asset vaults (Sierra, OpenTrade, Grove)
 * @dev Simplified interface for RWA yield generation
 */
interface IRWAVault {
    /**
     * @notice Deposit stablecoins into RWA vault
     * @param amount Amount to deposit
     * @return shares Amount of vault shares received
     */
    function deposit(uint256 amount) external returns (uint256 shares);

    /**
     * @notice Withdraw from RWA vault
     * @param shares Amount of shares to withdraw
     * @return amount Amount of stablecoins withdrawn
     */
    function withdraw(uint256 shares) external returns (uint256 amount);

    /**
     * @notice Claim accrued yield
     * @return yield Amount of yield claimed
     */
    function claimYield() external returns (uint256 yield);

    /**
     * @notice Get current APY
     * @return apy Annual percentage yield in basis points
     */
    function getCurrentAPY() external view returns (uint256 apy);

    /**
     * @notice Get total value locked
     * @return Total assets in vault
     */
    function totalValueLocked() external view returns (uint256);

    /**
     * @notice Get user's share balance
     * @param user User address
     * @return User's shares
     */
    function balanceOf(address user) external view returns (uint256);

    /**
     * @notice Get underlying stablecoin address
     * @return Stablecoin token address
     */
    function underlyingToken() external view returns (address);
}
