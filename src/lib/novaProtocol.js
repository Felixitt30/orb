export const NOVA_ADDRESSES = {
    NovaToken: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    LiquidRestakingToken: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    NodeNFT: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    StakingVault: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    AllocationManager: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
    RewardDistributor: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
    veNOVA: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
    UnderlyingAsset: "0x5FbDB2315678afecb367f032d93F642f64180aa3"
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
        "function nodes(uint256 tokenId) external view returns (uint256 stakedAmount, uint256 rarity, uint256 lastClaimTime)",
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
