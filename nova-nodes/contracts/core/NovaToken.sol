// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

/**
 * @title NovaToken
 * @notice Governance token for Nova Nodes protocol
 * @dev ERC20 token with:
 *      - Burnable (deflationary mechanics)
 *      - Permit (gasless approvals via EIP-2612)
 *      - Votes (snapshot-based governance)
 *      - Fixed supply of 100M tokens
 */
contract NovaToken is ERC20, ERC20Burnable, ERC20Permit, ERC20Votes, Ownable2Step {
    /// @notice Total supply: 100 million tokens
    uint256 public constant TOTAL_SUPPLY = 100_000_000 ether;

    /// @notice Emitted when tokens are minted to initial recipients
    event InitialDistribution(
        address indexed community,
        address indexed treasury,
        address indexed team,
        uint256 communityAmount,
        uint256 treasuryAmount,
        uint256 teamAmount
    );

    /**
     * @notice Constructor mints total supply to deployer
     * @dev Distribution should be done via separate function after deployment
     */
    constructor() ERC20("Nova Token", "NOVA") ERC20Permit("Nova Token") Ownable(msg.sender) {
        _mint(msg.sender, TOTAL_SUPPLY);
    }

    /**
     * @notice Distribute initial token allocation
     * @param community Community rewards address (40%)
     * @param treasury Treasury address (25%)
     * @param team Team address (20%)
     * @param liquidity Initial liquidity address (10%)
     * @param grants Ecosystem grants address (5%)
     */
    function distributeInitialSupply(
        address community,
        address treasury,
        address team,
        address liquidity,
        address grants
    ) external onlyOwner {
        require(balanceOf(msg.sender) == TOTAL_SUPPLY, "Already distributed");
        require(
            community != address(0) &&
            treasury != address(0) &&
            team != address(0) &&
            liquidity != address(0) &&
            grants != address(0),
            "Invalid addresses"
        );

        uint256 communityAmount = (TOTAL_SUPPLY * 40) / 100; // 40M
        uint256 treasuryAmount = (TOTAL_SUPPLY * 25) / 100;  // 25M
        uint256 teamAmount = (TOTAL_SUPPLY * 20) / 100;      // 20M
        uint256 liquidityAmount = (TOTAL_SUPPLY * 10) / 100; // 10M
        uint256 grantsAmount = (TOTAL_SUPPLY * 5) / 100;     // 5M

        _transfer(msg.sender, community, communityAmount);
        _transfer(msg.sender, treasury, treasuryAmount);
        _transfer(msg.sender, team, teamAmount);
        _transfer(msg.sender, liquidity, liquidityAmount);
        _transfer(msg.sender, grants, grantsAmount);

        emit InitialDistribution(community, treasury, team, communityAmount, treasuryAmount, teamAmount);
    }

    // The following functions are overrides required by Solidity.

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
