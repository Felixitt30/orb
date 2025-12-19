const hre = require("hardhat");

async function main() {
    console.log("🔍 Scanning ALL NodeNFTs...");

    // Get deployments from file if possible, or hardcode
    const nodeNFTAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
    const NodeNFT = await hre.ethers.getContractFactory("NodeNFT");
    const nodeNFT = NodeNFT.attach(nodeNFTAddress);

    try {
        const totalSupply = await nodeNFT.totalSupply();
        console.log(`\n📊 Total Supply: ${totalSupply.toString()}`);

        if (totalSupply == 0) {
            console.log("⚠️ No nodes exist on this chain. Did the user stake?");
            return;
        }

        for (let i = 0; i < Number(totalSupply); i++) {
            const tokenId = await nodeNFT.tokenByIndex(i);
            const owner = await nodeNFT.ownerOf(tokenId);
            const nodeDetails = await nodeNFT.nodes(tokenId);

            console.log(`\n🔹 Token #${tokenId}`);
            console.log(`   Owner: ${owner}`);
            console.log(`   Staked: ${hre.ethers.formatEther(nodeDetails.stakedAmount)} sAVAX`);
            console.log(`   Rarity: ${nodeDetails.rarity}`);
        }

    } catch (e) {
        console.error("❌ Error connecting to contract:", e.message);
        console.log("Check if Hardhat Node is running at localhost:8545");
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
