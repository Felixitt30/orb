const { ethers } = require("hardhat");

async function main() {
    console.log("--- STARTING ECONOMIC SIMULATION (12 MONTHS) ---");

    const [admin, treasury, user1, user2, user3] = await ethers.getSigners();
    const MONTH = 30 * 24 * 60 * 60;
    const INITIAL_STAKE = ethers.parseEther("1000");
    const YIELD_RATE = 0.05; // 5% monthly yield for simulation

    // 1. DEPLOYMENT
    console.log("Deploying contracts...");
    const MockLST = await ethers.getContractFactory("MockLST");
    const sAVAX = await MockLST.deploy("Staked AVAX", "sAVAX");

    const NovaToken = await ethers.getContractFactory("NovaToken");
    const nova = await NovaToken.deploy();

    const LRT = await ethers.getContractFactory("LiquidRestakingToken");
    const lrAVAX = await LRT.deploy();

    const NodeNFT = await ethers.getContractFactory("NodeNFT");
    const nodeNFT = await NodeNFT.deploy();

    const StakingVault = await ethers.getContractFactory("StakingVault");
    const vault = await StakingVault.deploy(await lrAVAX.getAddress(), await nodeNFT.getAddress(), treasury.address, [await sAVAX.getAddress()]);

    const AllocationManager = await ethers.getContractFactory("AllocationManager");
    const allocManager = await AllocationManager.deploy(await sAVAX.getAddress(), admin.address);

    const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
    const rewardDistributor = await RewardDistributor.deploy(await nodeNFT.getAddress(), await sAVAX.getAddress());

    // 2. SETUP
    console.log("Setting up protocol connections...");
    const MINTER_ROLE = await lrAVAX.MINTER_ROLE();
    const DISTRIBUTOR_ROLE = await rewardDistributor.DISTRIBUTOR_ROLE();
    const UPDATER_ROLE = await rewardDistributor.UPDATER_ROLE();

    await lrAVAX.grantRole(MINTER_ROLE, await vault.getAddress());
    await nodeNFT.grantRole(MINTER_ROLE, await vault.getAddress());
    await nodeNFT.setRewardDistributor(await rewardDistributor.getAddress());
    await rewardDistributor.grantRole(UPDATER_ROLE, await nodeNFT.getAddress());
    await rewardDistributor.grantRole(DISTRIBUTOR_ROLE, await allocManager.getAddress());
    await rewardDistributor.grantRole(DISTRIBUTOR_ROLE, admin.address);

    await vault.setAllocationManager(await allocManager.getAddress());
    await allocManager.setAddresses(await rewardDistributor.getAddress(), treasury.address);

    // Setup Mock Strategy
    // For simulation, we'll just send yield to AllocationManager manually

    // 3. INITIAL STAKING
    console.log("Initial staking (3 users, 1000 sAVAX each)...");
    const users = [user1, user2, user3];
    for (const u of users) {
        await sAVAX.mint(u.address, INITIAL_STAKE);
        await sAVAX.connect(u).approve(await vault.getAddress(), INITIAL_STAKE);
        await vault.connect(u).stake(await sAVAX.getAddress(), INITIAL_STAKE);
    }

    // 4. SIMULATION LOOP (12 MONTHS)
    let totalYieldNFT = 0n;
    let totalYieldTreasury = 0n;
    let totalBurned = 0n;

    for (let i = 1; i <= 12; i++) {
        console.log(`\n--- MONTH ${i} ---`);

        // Advance time
        await ethers.provider.send("evm_increaseTime", [MONTH]);
        await ethers.provider.send("evm_mine");

        // Simulate Yield Generation (Total TVL * Monthy Rate)
        const tvl = await sAVAX.balanceOf(await vault.getAddress());
        const monthlyYield = (tvl * BigInt(Math.floor(YIELD_RATE * 10000))) / 10000n;

        console.log(`Generating yield: ${ethers.formatEther(monthlyYield)} sAVAX`);

        // Send yield to AllocationManager and harvest
        await sAVAX.mint(await allocManager.getAddress(), monthlyYield);
        // We need to bypass the strategy check in harvestAll since we have no strategies deployed
        // Instead of harvestAll, we'll manually call distribute if it was public or just add a mock strategy.

        // Deploy a mock strategy to make harvestAll work
        if (i === 1) {
            const MockSuzaku = await ethers.getContractFactory("MockLST"); // Reuse MockLST as strategy
            const suzaku = await MockSuzaku.deploy("Mock Suzaku", "mSUZ");
            await allocManager.addStrategy(await suzaku.getAddress(), 10000, 0, false);
            // Move funds to strategy
            const vaultBalance = await sAVAX.balanceOf(await vault.getAddress());
            // In a real flow, StakingVault would push to AllocationManager, 
            // and AllocationManager would deposit to Strategy.
        }

        // For this sim, we simulate the internal distribution logic
        const nftCut = (monthlyYield * 7000n) / 10000n;
        const treasuryCut = (monthlyYield * 2000n) / 10000n;
        const burnCut = monthlyYield - nftCut - treasuryCut;

        await sAVAX.mint(user1.address, 0); // Poke provider

        // Distribute to RewardDistributor
        await sAVAX.mint(admin.address, nftCut);
        await sAVAX.connect(admin).approve(await rewardDistributor.getAddress(), nftCut);
        await rewardDistributor.notifyRewardAmount(nftCut);

        totalYieldNFT += nftCut;
        totalYieldTreasury += treasuryCut;
        totalBurned += burnCut;

        console.log(`  Rewards to NFT holders: ${ethers.formatEther(nftCut)}`);
        console.log(`  Rewards to Treasury: ${ethers.formatEther(treasuryCut)}`);
        console.log(`  Burned: ${ethers.formatEther(burnCut)}`);
    }

    console.log("\n--- FINAL RESULTS ---");
    console.log(`Total NFT Yield: ${ethers.formatEther(totalYieldNFT)}`);
    console.log(`Total Treasury Yield: ${ethers.formatEther(totalYieldTreasury)}`);
    console.log(`Total Burned: ${ethers.formatEther(totalBurned)}`);

    const u2earned = await rewardDistributor.earned(2);
    console.log(`User 2 pending rewards (accumulated 12 months): ${ethers.formatEther(u2earned)}`);

    // Check Treasury Health
    const treasuryBal = await sAVAX.balanceOf(treasury.address);
    console.log(`Treasury Balance: ${ethers.formatEther(treasuryBal)}`);

    console.log("\nSimulation finished successfully.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
