const hre = require("hardhat");

async function main() {
    console.log("💰 Funding first 10 accounts...");

    // Get the deployed mock token
    const mockTokenAddress = "0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E"; // From deployment
    const MockLST = await hre.ethers.getContractFactory("MockLST");
    const mockToken = MockLST.attach(mockTokenAddress);

    // Get signers (accounts)
    const signers = await hre.ethers.getSigners();

    const amount = hre.ethers.parseEther("1000");

    for (let i = 0; i < 10; i++) {
        const signer = signers[i];
        try {
            console.log(`Funding ${signer.address}...`);
            const tx = await mockToken.mint(signer.address, amount);
            await tx.wait();
            console.log(`  ✅ Minted 1000 sAVAX`);
        } catch (e) {
            console.log(`  ❌ Failed: ${e.message}`);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
