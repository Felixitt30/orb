const hre = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("🚀 Deploying COMPLETE Nova Nodes Protocol to", hre.network.name);
    console.log("================================================\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "\n");

    // Configuration
    const config = {
        treasury: deployer.address,
        // For local/testnet, we'll use a mock sAVAX or the deployer as a proxy
        underlyingAsset: "0x0000000000000000000000000000000000000000", // Will update if mock needed
        distribution: {
            community: deployer.address,
            treasury: deployer.address,
            team: deployer.address,
            liquidity: deployer.address,
            grants: deployer.address,
        }
    };

    // 1. Deploy Mock LST (if on local/hardhat)
    let assetAddress = config.underlyingAsset;
    if (hre.network.name === "hardhat" || hre.network.name === "localhost") {
        console.log("0️⃣  Deploying MockLST (sAVAX)...");
        const MockLST = await hre.ethers.getContractFactory("MockLST");
        const mockLST = await MockLST.deploy("Staked AVAX", "sAVAX");
        await mockLST.waitForDeployment();
        assetAddress = await mockLST.getAddress();
        console.log("✅ MockLST deployed to:", assetAddress, "\n");
    }

    // 2. Deploy NovaToken
    console.log("1️⃣  Deploying NovaToken...");
    const NovaToken = await hre.ethers.getContractFactory("NovaToken");
    const novaToken = await NovaToken.deploy();
    await novaToken.waitForDeployment();
    const novaTokenAddress = await novaToken.getAddress();
    console.log("✅ NovaToken deployed to:", novaTokenAddress, "\n");

    // 3. Deploy LiquidRestakingToken (lrAVAX)
    console.log("2️⃣  Deploying LiquidRestakingToken...");
    const LiquidRestakingToken = await hre.ethers.getContractFactory("LiquidRestakingToken");
    const lrAVAX = await LiquidRestakingToken.deploy();
    await lrAVAX.waitForDeployment();
    const lrAVAXAddress = await lrAVAX.getAddress();
    console.log("✅ LiquidRestakingToken deployed to:", lrAVAXAddress, "\n");

    // 4. Deploy NodeNFT
    console.log("3️⃣  Deploying NodeNFT...");
    const NodeNFT = await hre.ethers.getContractFactory("NodeNFT");
    const nodeNFT = await NodeNFT.deploy();
    await nodeNFT.waitForDeployment();
    const nodeNFTAddress = await nodeNFT.getAddress();
    console.log("✅ NodeNFT deployed to:", nodeNFTAddress, "\n");

    // 5. Deploy StakingVault
    console.log("4️⃣  Deploying StakingVault...");
    const StakingVault = await hre.ethers.getContractFactory("StakingVault");
    const stakingVault = await StakingVault.deploy(
        lrAVAXAddress,
        nodeNFTAddress,
        config.treasury,
        [assetAddress]
    );
    await stakingVault.waitForDeployment();
    const stakingVaultAddress = await stakingVault.getAddress();
    console.log("✅ StakingVault deployed to:", stakingVaultAddress, "\n");

    // 6. Deploy AllocationManager
    console.log("5️⃣  Deploying AllocationManager...");
    const AllocationManager = await hre.ethers.getContractFactory("AllocationManager");
    const allocManager = await AllocationManager.deploy(assetAddress, deployer.address);
    await allocManager.waitForDeployment();
    const allocManagerAddress = await allocManager.getAddress();
    console.log("✅ AllocationManager deployed to:", allocManagerAddress, "\n");

    // 7. Deploy RewardDistributor
    console.log("6️⃣  Deploying RewardDistributor...");
    const RewardDistributor = await hre.ethers.getContractFactory("RewardDistributor");
    const rewardDistributor = await RewardDistributor.deploy(nodeNFTAddress, assetAddress);
    await rewardDistributor.waitForDeployment();
    const rewardDistributorAddress = await rewardDistributor.getAddress();
    console.log("✅ RewardDistributor deployed to:", rewardDistributorAddress, "\n");

    // 8. Deploy veNOVA
    console.log("7️⃣  Deploying veNOVA...");
    const veNOVA = await hre.ethers.getContractFactory("veNOVA");
    const veNova = await veNOVA.deploy(novaTokenAddress);
    await veNova.waitForDeployment();
    const veNovaAddress = await veNova.getAddress();
    console.log("✅ veNOVA deployed to:", veNovaAddress, "\n");

    // 9. Setup roles and connections
    console.log("8️⃣  Configuring protocol connections...");

    // LRT Minter -> Vault
    await lrAVAX.grantRole(await lrAVAX.MINTER_ROLE(), stakingVaultAddress);
    console.log("   - lrAVAX MINTER_ROLE -> StakingVault");

    // NodeNFT Minter -> Vault
    await nodeNFT.grantRole(await nodeNFT.MINTER_ROLE(), stakingVaultAddress);
    console.log("   - NodeNFT MINTER_ROLE -> StakingVault");

    // NodeNFT RewardDistributor -> RewardDistributor
    await nodeNFT.setRewardDistributor(rewardDistributorAddress);
    console.log("   - NodeNFT RewardDistributor set");

    // RewardDistributor -> NodeNFT (Updater)
    await rewardDistributor.grantRole(await rewardDistributor.UPDATER_ROLE(), nodeNFTAddress);
    console.log("   - RewardDistributor UPDATER_ROLE -> NodeNFT");

    // RewardDistributor -> AllocationManager (Distributor)
    await rewardDistributor.grantRole(await rewardDistributor.DISTRIBUTOR_ROLE(), allocManagerAddress);
    console.log("   - RewardDistributor DISTRIBUTOR_ROLE -> AllocationManager");

    // AllocationManager -> Addresses
    await allocManager.setAddresses(rewardDistributorAddress, config.treasury);
    console.log("   - AllocationManager addresses set");

    // Vault -> AllocationManager
    await stakingVault.setAllocationManager(allocManagerAddress);
    console.log("   - StakingVault AllocationManager set\n");

    // Summary
    console.log("================================================");
    console.log("📋 COMPLETE Deployment Summary");
    console.log("================================================");
    console.log("NovaToken:             ", novaTokenAddress);
    console.log("LiquidRestakingToken:  ", lrAVAXAddress);
    console.log("NodeNFT:               ", nodeNFTAddress);
    console.log("StakingVault:          ", stakingVaultAddress);
    console.log("AllocationManager:     ", allocManagerAddress);
    console.log("RewardDistributor:     ", rewardDistributorAddress);
    console.log("veNOVA:                ", veNovaAddress);
    console.log("================================================\n");

    // Save deployment addresses
    const deploymentInfo = {
        network: hre.network.name,
        timestamp: new Date().toISOString(),
        contracts: {
            NovaToken: novaTokenAddress,
            LiquidRestakingToken: lrAVAXAddress,
            NodeNFT: nodeNFTAddress,
            StakingVault: stakingVaultAddress,
            AllocationManager: allocManagerAddress,
            RewardDistributor: rewardDistributorAddress,
            veNOVA: veNovaAddress,
            UnderlyingAsset: assetAddress
        }
    };

    const deploymentsDir = "./deployments";
    if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir);
    fs.writeFileSync(`${deploymentsDir}/${hre.network.name}.json`, JSON.stringify(deploymentInfo, null, 2));

    console.log("✅ Deployment info saved to deployments/" + hre.network.name + ".json\n");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
