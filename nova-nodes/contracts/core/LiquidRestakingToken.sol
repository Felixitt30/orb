// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title LiquidRestakingToken
 * @notice Liquid restaking token (lrAVAX) representing staked LST positions
 * @dev Non-rebasing token with increasing exchange rate (like stETH)
 *      Only StakingVault can mint/burn
 */
contract LiquidRestakingToken is ERC20, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @notice Total underlying LST assets backing this token
    uint256 public totalAssets;

    /// @notice Emitted when exchange rate is updated
    event ExchangeRateUpdated(uint256 newRate, uint256 totalSupply, uint256 totalAssets);

    /// @notice Emitted when assets are deposited
    event AssetsDeposited(uint256 amount, uint256 shares);

    /// @notice Emitted when assets are withdrawn
    event AssetsWithdrawn(uint256 amount, uint256 shares);

    constructor() ERC20("Liquid Restaking AVAX", "lrAVAX") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    /**
     * @notice Get current exchange rate (assets per token)
     * @return Exchange rate in 18 decimals (1e18 = 1:1)
     */
    function getExchangeRate() public view returns (uint256) {
        uint256 supply = totalSupply();
        if (supply == 0) return 1e18; // Initial rate 1:1
        return (totalAssets * 1e18) / supply;
    }

    /**
     * @notice Convert assets to shares based on current exchange rate
     * @param assets Amount of underlying assets
     * @return shares Amount of lrAVAX tokens
     */
    function convertToShares(uint256 assets) public view returns (uint256 shares) {
        uint256 supply = totalSupply();
        if (supply == 0) {
            return assets; // 1:1 for first deposit
        }
        return (assets * supply) / totalAssets;
    }

    /**
     * @notice Convert shares to assets based on current exchange rate
     * @param shares Amount of lrAVAX tokens
     * @return assets Amount of underlying assets
     */
    function convertToAssets(uint256 shares) public view returns (uint256 assets) {
        uint256 supply = totalSupply();
        if (supply == 0) {
            return shares;
        }
        return (shares * totalAssets) / supply;
    }

    /**
     * @notice Mint lrAVAX tokens (only callable by StakingVault)
     * @param to Recipient address
     * @param assets Amount of underlying assets being deposited
     * @return shares Amount of lrAVAX minted
     */
    function deposit(address to, uint256 assets) 
        external 
        onlyRole(MINTER_ROLE) 
        whenNotPaused 
        returns (uint256 shares) 
    {
        require(assets > 0, "Cannot deposit 0");
        
        shares = convertToShares(assets);
        totalAssets += assets;
        
        _mint(to, shares);
        
        emit AssetsDeposited(assets, shares);
        emit ExchangeRateUpdated(getExchangeRate(), totalSupply(), totalAssets);
    }

    /**
     * @notice Burn lrAVAX tokens (only callable by StakingVault)
     * @param from Address to burn from
     * @param shares Amount of lrAVAX to burn
     * @return assets Amount of underlying assets withdrawn
     */
    function withdraw(address from, uint256 shares) 
        external 
        onlyRole(MINTER_ROLE) 
        whenNotPaused 
        returns (uint256 assets) 
    {
        require(shares > 0, "Cannot withdraw 0");
        require(balanceOf(from) >= shares, "Insufficient balance");
        
        assets = convertToAssets(shares);
        totalAssets -= assets;
        
        _burn(from, shares);
        
        emit AssetsWithdrawn(assets, shares);
        emit ExchangeRateUpdated(getExchangeRate(), totalSupply(), totalAssets);
    }

    /**
     * @notice Increase total assets (called when yields are harvested)
     * @param amount Amount of assets to add
     */
    function addYield(uint256 amount) external onlyRole(MINTER_ROLE) {
        totalAssets += amount;
        emit ExchangeRateUpdated(getExchangeRate(), totalSupply(), totalAssets);
    }

    /**
     * @notice Pause token transfers (emergency)
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause token transfers
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @notice Override transfer to add pause functionality
     */
    function _update(address from, address to, uint256 value)
        internal
        override
        whenNotPaused
    {
        super._update(from, to, value);
    }
}
