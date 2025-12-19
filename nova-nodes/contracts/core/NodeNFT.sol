// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../staking/IRewardDistributor.sol";

/**
 * @title NodeNFT
 * @notice ERC-721 NFT representing staking nodes with rarity and yield multipliers
 * @dev Supports merge/fuse mechanics to upgrade rarity
 */
contract NodeNFT is ERC721, ERC721Enumerable, AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /// @notice Rarity levels
    enum Rarity {
        Common,      // 1.0x multiplier
        Uncommon,    // 1.1x multiplier
        Rare,        // 1.25x multiplier
        Epic,        // 1.5x multiplier
        Legendary    // 2.0x multiplier
    }

    /// @notice Node metadata
    struct NodeData {
        uint256 stakedAmount;      // lrAVAX backing this node
        Rarity rarity;             // Rarity level
        uint16 yieldMultiplier;    // Basis points (10000 = 1.0x)
        uint64 createdAt;          // Timestamp of creation
        uint64 lastClaimTime;      // Last reward claim timestamp
    }

    /// @notice Mapping from token ID to node data
    mapping(uint256 => NodeData) public nodes;

    /// @notice Reward distributor contract
    address public rewardDistributor;

    /// @notice Counter for token IDs
    uint256 private _nextTokenId;

    /// @notice Rarity probabilities (out of 100)
    uint8 public constant COMMON_CHANCE = 50;
    uint8 public constant UNCOMMON_CHANCE = 30;
    uint8 public constant RARE_CHANCE = 15;
    uint8 public constant EPIC_CHANCE = 4;
    uint8 public constant LEGENDARY_CHANCE = 1;

    /// @notice Yield multipliers in basis points
    uint16 public constant COMMON_MULTIPLIER = 10000;      // 1.0x
    uint16 public constant UNCOMMON_MULTIPLIER = 11000;    // 1.1x
    uint16 public constant RARE_MULTIPLIER = 12500;        // 1.25x
    uint16 public constant EPIC_MULTIPLIER = 15000;        // 1.5x
    uint16 public constant LEGENDARY_MULTIPLIER = 20000;   // 2.0x

    /// @notice Events
    event NodeMinted(
        uint256 indexed tokenId,
        address indexed owner,
        uint256 stakedAmount,
        Rarity rarity,
        uint16 multiplier
    );

    event NodesMerged(
        uint256 indexed tokenId1,
        uint256 indexed tokenId2,
        uint256 indexed newTokenId,
        Rarity newRarity,
        uint256 combinedAmount
    );

    event NodeUpdated(uint256 indexed tokenId, uint256 newStakedAmount);

    event RewardsClaimed(uint256 indexed tokenId, uint64 timestamp);

    constructor() ERC721("Nova Node", "NNODE") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Mint a new node NFT
     * @param to Recipient address
     * @param stakedAmount Amount of lrAVAX backing this node
     * @return tokenId The minted token ID
     */
    function mint(address to, uint256 stakedAmount) 
        external 
        onlyRole(MINTER_ROLE) 
        whenNotPaused 
        returns (uint256 tokenId) 
    {
        require(stakedAmount > 0, "Invalid staked amount");
        
        tokenId = _nextTokenId++;
        _safeMint(to, tokenId);

        // Determine rarity using on-chain RNG
        Rarity rarity = _determineRarity(tokenId, to);
        uint16 multiplier = _getMultiplier(rarity);

        nodes[tokenId] = NodeData({
            stakedAmount: stakedAmount,
            rarity: rarity,
            yieldMultiplier: multiplier,
            createdAt: uint64(block.timestamp),
            lastClaimTime: uint64(block.timestamp)
        });

        emit NodeMinted(tokenId, to, stakedAmount, rarity, multiplier);

        if (rewardDistributor != address(0)) {
            uint256 weight = (stakedAmount * multiplier) / 10000;
            IRewardDistributor(rewardDistributor).onNodeUpdate(tokenId, 0, weight);
        }
    }

    /**
     * @notice Merge two nodes of the same rarity into one higher rarity node
     * @param tokenId1 First node to merge
     * @param tokenId2 Second node to merge
     * @return newTokenId The newly minted merged node
     */
    function mergeNodes(uint256 tokenId1, uint256 tokenId2) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256 newTokenId) 
    {
        require(ownerOf(tokenId1) == msg.sender, "Not owner of token 1");
        require(ownerOf(tokenId2) == msg.sender, "Not owner of token 2");
        require(tokenId1 != tokenId2, "Cannot merge same token");

        NodeData memory node1 = nodes[tokenId1];
        NodeData memory node2 = nodes[tokenId2];

        require(node1.rarity == node2.rarity, "Rarity mismatch");
        require(node1.rarity != Rarity.Legendary, "Cannot merge Legendary");

        // Burn both nodes
        _burn(tokenId1);
        _burn(tokenId2);
        delete nodes[tokenId1];
        delete nodes[tokenId2];

        // Mint new node with upgraded rarity
        newTokenId = _nextTokenId++;
        Rarity newRarity = Rarity(uint8(node1.rarity) + 1);
        uint16 newMultiplier = _getMultiplier(newRarity);
        uint256 combinedAmount = node1.stakedAmount + node2.stakedAmount;

        _safeMint(msg.sender, newTokenId);

        nodes[newTokenId] = NodeData({
            stakedAmount: combinedAmount,
            rarity: newRarity,
            yieldMultiplier: newMultiplier,
            createdAt: uint64(block.timestamp),
            lastClaimTime: uint64(block.timestamp)
        });

        emit NodesMerged(tokenId1, tokenId2, newTokenId, newRarity, combinedAmount);

        if (rewardDistributor != address(0)) {
            uint256 weight1 = (node1.stakedAmount * node1.yieldMultiplier) / 10000;
            uint256 weight2 = (node2.stakedAmount * node2.yieldMultiplier) / 10000;
            uint256 newWeight = (combinedAmount * newMultiplier) / 10000;
            // First notify of removal of old nodes (old weights to 0)
            IRewardDistributor(rewardDistributor).onNodeUpdate(tokenId1, weight1, 0);
            IRewardDistributor(rewardDistributor).onNodeUpdate(tokenId2, weight2, 0);
            // Then notify of new node
            IRewardDistributor(rewardDistributor).onNodeUpdate(newTokenId, 0, newWeight);
        }
    }

    /**
     * @notice Update node's staked amount (called when compounding)
     * @param tokenId Token ID to update
     * @param newAmount New staked amount
     */
    function updateStakedAmount(uint256 tokenId, uint256 newAmount) 
        external 
        onlyRole(OPERATOR_ROLE) 
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        NodeData memory node = nodes[tokenId];
        uint256 oldWeight = (node.stakedAmount * node.yieldMultiplier) / 10000;
        uint256 newWeight = (newAmount * node.yieldMultiplier) / 10000;

        nodes[tokenId].stakedAmount = newAmount;
        emit NodeUpdated(tokenId, newAmount);

        if (rewardDistributor != address(0)) {
            IRewardDistributor(rewardDistributor).onNodeUpdate(tokenId, oldWeight, newWeight);
        }
    }

    /**
     * @notice Update last claim time (called when rewards are claimed)
     * @param tokenId Token ID to update
     */
    function updateLastClaimTime(uint256 tokenId) 
        external 
        onlyRole(OPERATOR_ROLE) 
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        nodes[tokenId].lastClaimTime = uint64(block.timestamp);
        emit RewardsClaimed(tokenId, uint64(block.timestamp));
    }

    /**
     * @notice Burn a node (called when unstaking)
     * @param tokenId Token ID to burn
     */
    function burn(uint256 tokenId) external onlyRole(MINTER_ROLE) {
        NodeData memory node = nodes[tokenId];
        uint256 oldWeight = (node.stakedAmount * node.yieldMultiplier) / 10000;

        _burn(tokenId);
        delete nodes[tokenId];

        if (rewardDistributor != address(0)) {
            IRewardDistributor(rewardDistributor).onNodeUpdate(tokenId, oldWeight, 0);
        }
    }

    /**
     * @notice Get node data
     * @param tokenId Token ID
     * @return Node data struct
     */
    function getNode(uint256 tokenId) external view returns (NodeData memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return nodes[tokenId];
    }

    /**
     * @notice Get all nodes owned by an address
     * @param owner Address to query
     * @return tokenIds Array of token IDs
     */
    function getNodesByOwner(address owner) external view returns (uint256[] memory tokenIds) {
        uint256 balance = balanceOf(owner);
        tokenIds = new uint256[](balance);
        for (uint256 i = 0; i < balance; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }
    }

    /**
     * @notice Determine rarity using on-chain RNG
     * @param tokenId Token ID for entropy
     * @param minter Minter address for entropy
     * @return Rarity level
     */
    function _determineRarity(uint256 tokenId, address minter) private view returns (Rarity) {
        // Use Avalanche's fast finality + blockhash + user address for entropy
        uint256 randomness = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao, // EIP-4399 (replaces difficulty)
            minter,
            tokenId,
            blockhash(block.number - 1)
        )));

        uint8 roll = uint8(randomness % 100);

        if (roll < LEGENDARY_CHANCE) return Rarity.Legendary;
        if (roll < LEGENDARY_CHANCE + EPIC_CHANCE) return Rarity.Epic;
        if (roll < LEGENDARY_CHANCE + EPIC_CHANCE + RARE_CHANCE) return Rarity.Rare;
        if (roll < LEGENDARY_CHANCE + EPIC_CHANCE + RARE_CHANCE + UNCOMMON_CHANCE) return Rarity.Uncommon;
        return Rarity.Common;
    }

    /**
     * @notice Get multiplier for a given rarity
     * @param rarity Rarity level
     * @return Multiplier in basis points
     */
    function _getMultiplier(Rarity rarity) private pure returns (uint16) {
        if (rarity == Rarity.Legendary) return LEGENDARY_MULTIPLIER;
        if (rarity == Rarity.Epic) return EPIC_MULTIPLIER;
        if (rarity == Rarity.Rare) return RARE_MULTIPLIER;
        if (rarity == Rarity.Uncommon) return UNCOMMON_MULTIPLIER;
        return COMMON_MULTIPLIER;
    }

    /**
     * @notice Pause contract
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Set reward distributor address
     */
    function setRewardDistributor(address _distributor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        rewardDistributor = _distributor;
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // Required overrides

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
