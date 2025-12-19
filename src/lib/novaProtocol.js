export const NOVA_ADDRESSES = {
    NovaToken: "0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690",
    LiquidRestakingToken: "0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB",
    NodeNFT: "0x9E545E3C0baAB3E08CdfD552C960A1050f373042",
    StakingVault: "0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9",
    AllocationManager: "0x1613beB3B2C4f22Ee086B2b38C1476A3cE7f78E8",
    RewardDistributor: "0x851356ae760d987E095750cCeb3bC6014560891C",
    veNOVA: "0xf5059a5D33d5853360D16C683c16e67980206f36",
    UnderlyingAsset: "0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E"
};
export const NOVA_ABIS = {
    StakingVault: [
        "function stake(address lst, uint256 amount) external",
        "function instantUnstake(uint256 tokenId) external",
        "function initiateUnstake(uint256 tokenId) external",
        "function completeUnstake(uint256 tokenId) external",
        "function cooldowns(uint256 tokenId) external view returns (uint256 endTimestamp, uint256 amount)",
        "function totalStaked() external view returns (uint256)"
    ],
    NodeNFT: [
        "function balanceOf(address owner) external view returns (uint256)",
        "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
        "function getNodesByOwner(address owner) external view returns (uint256[])",
        "function nodes(uint256 tokenId) external view returns (uint256 stakedAmount, uint8 rarity, uint16 yieldMultiplier, uint64 createdAt, uint64 lastClaimTime)",
        "function mergeNodes(uint256 tokenId1, uint256 tokenId2) external",
        "function totalSupply() external view returns (uint256)"
    ],
    RewardDistributor: [
        "function pendingRewards(uint256 tokenId) external view returns (uint256)",
        "function claimReward(uint256 tokenId) external",
        "function rewardPerShare() external view returns (uint256)"
    ],
    ERC20: [
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function allowance(address owner, address spender) external view returns (uint256)",
        "function balanceOf(address account) external view returns (uint256)"
    ]
};
