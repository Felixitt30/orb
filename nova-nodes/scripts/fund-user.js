const hre = require("hardhat");

async function main() {
    const userAddress = "0x230e7e9C497204161Af47Dd6e61662220B488a74";
    const [admin] = await hre.ethers.getSigners();

    console.log("Funding user:", userAddress);

    // 1. Send Native ETH (Gas)
    const amountEth = hre.ethers.parseEther("100");
    const tx = await admin.sendTransaction({
        to: userAddress,
        value: amountEth
    });
    await tx.wait();
    console.log("✅ Sent 100 ETH (Gas) to user");

    // 2. Mint Mock Token (sAVAX)
    // We know the address from previous context: 0x5FbDB2315678afecb367f032d93F642f64180aa3
    const mockTokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const MockLST = await hre.ethers.getContractFactory("MockLST");
    const mockToken = MockLST.attach(mockTokenAddress);

    const amountTokens = hre.ethers.parseEther("1000");
    const mintTx = await mockToken.mint(userAddress, amountTokens);
    await mintTx.wait();
    console.log("✅ Minted 1000 sAVAX to user");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
