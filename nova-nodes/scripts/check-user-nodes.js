const hre = require("hardhat");

async function main() {
    const userAddress = "0x230e7e9C497204161Af47Dd6e61662220B488a74"; // User's address

    // Contract Addresses (from localhost.json)
    const nodeNFTAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
    const assetAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

    console.log("🔍 Checking Blockchain State for:", userAddress);

    // 1. Check NodeNFT Balance
    const NodeNFT = await hre.ethers.getContractFactory("NodeNFT");
    const nodeNFT = NodeNFT.attach(nodeNFTAddress);
    const balance = await nodeNFT.balanceOf(userAddress);
    console.log(`\n🏰 Node NFT Balance: ${balance.toString()}`);

    if (Number(balance) > 0) {
        console.log("   User owns nodes! Fetching details...");
        for (let i = 0; i < Number(balance); i++) {
            const tokenId = await nodeNFT.tokenOfOwnerByIndex(userAddress, i);
            const nodeDetails = await nodeNFT.nodes(tokenId);
            console.log(`   - Node #${tokenId}:`);
            console.log(`     - Staked Amount: ${hre.ethers.formatEther(nodeDetails.stakedAmount)} sAVAX`);
            console.log(`     - Rarity: ${nodeDetails.rarity} (0=Common, 1=Uncommon, 2=Rare, 3=Legendary)`);
        }
    } else {
        console.log("   User owns 0 nodes.");
    }

    // 2. Check sAVAX Balance
    const IERC20 = await hre.ethers.getContractAt("IERC20", assetAddress);
    const assetBalance = await IERC20.balanceOf(userAddress);
    console.log(`\n💰 sAVAX Balance: ${hre.ethers.formatEther(assetBalance)}`);

    // 3. Check Native Balance
    const nativeBalance = await hre.ethers.provider.getBalance(userAddress);
    console.log(`💳 Native AVAX Balance: ${hre.ethers.formatEther(nativeBalance)}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
