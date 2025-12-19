const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Nova Nodes Protocol Integration", function () {
    let stakingVault, lrAVAX, nodeNFT, mockSAVAX, mockGGAVAX;
    let admin, user1, user2, treasury;
    const INITIAL_MINT = ethers.parseEther("10000");

    beforeEach(async function () {
        [admin, user1, user2, treasury] = await ethers.getSigners();

        // Deploy Mock LSTs
        const MockLST = await ethers.getContractFactory("MockLST");
        mockSAVAX = await MockLST.deploy("Staked AVAX", "sAVAX");
        mockGGAVAX = await MockLST.deploy("GoGo AVAX", "ggAVAX");

        // Deploy Core Contracts
        const LiquidRestakingToken = await ethers.getContractFactory("LiquidRestakingToken");
        lrAVAX = await LiquidRestakingToken.deploy();

        const NodeNFT = await ethers.getContractFactory("NodeNFT");
        nodeNFT = await NodeNFT.deploy();

        const StakingVault = await ethers.getContractFactory("StakingVault");
        stakingVault = await StakingVault.deploy(
            await lrAVAX.getAddress(),
            await nodeNFT.getAddress(),
            treasury.address,
            [await mockSAVAX.getAddress(), await mockGGAVAX.getAddress()]
        );

        // Setup Roles
        const MINTER_ROLE = await lrAVAX.MINTER_ROLE();
        await lrAVAX.grantRole(MINTER_ROLE, await stakingVault.getAddress());
        await nodeNFT.grantRole(MINTER_ROLE, await stakingVault.getAddress());

        // Mint Mock LSTs to users
        await mockSAVAX.mint(user1.address, INITIAL_MINT);
        await mockGGAVAX.mint(user1.address, INITIAL_MINT);
        await mockSAVAX.mint(user2.address, INITIAL_MINT);
    });

    describe("Staking and Minting", function () {
        it("Should allow a user to stake sAVAX and receive lrAVAX and a Node NFT", async function () {
            const stakeAmount = ethers.parseEther("100");

            // Approve StakingVault
            await mockSAVAX.connect(user1).approve(await stakingVault.getAddress(), stakeAmount);

            // Stake
            await expect(stakingVault.connect(user1).stake(await mockSAVAX.getAddress(), stakeAmount))
                .to.emit(stakingVault, "Staked")
                .withArgs(user1.address, await mockSAVAX.getAddress(), stakeAmount, stakeAmount, 0);

            // Verify Balances
            expect(await lrAVAX.balanceOf(user1.address)).to.equal(stakeAmount);
            expect(await nodeNFT.balanceOf(user1.address)).to.equal(1);
            expect(await mockSAVAX.balanceOf(await stakingVault.getAddress())).to.equal(stakeAmount);

            // Verify Node Data
            const node = await nodeNFT.getNode(0);
            expect(node.stakedAmount).to.equal(stakeAmount);
        });
    });

    describe("Merge Mechanics", function () {
        it("Should allow merging two nodes of the same rarity", async function () {
            const stakeAmount = ethers.parseEther("50");
            await mockSAVAX.connect(user1).approve(await stakingVault.getAddress(), stakeAmount * 20n);

            for (let i = 0; i < 10; i++) {
                await stakingVault.connect(user1).stake(await mockSAVAX.getAddress(), stakeAmount);
            }

            const userNodes = await nodeNFT.getNodesByOwner(user1.address);

            let node1Id, node2Id;
            for (let i = 0; i < userNodes.length; i++) {
                for (let j = i + 1; j < userNodes.length; j++) {
                    const n1 = await nodeNFT.getNode(userNodes[i]);
                    const n2 = await nodeNFT.getNode(userNodes[j]);
                    if (n1.rarity === n2.rarity && n1.rarity < 4) {
                        node1Id = userNodes[i];
                        node2Id = userNodes[j];
                        break;
                    }
                }
                if (node1Id !== undefined) break;
            }

            if (node1Id !== undefined) {
                await expect(nodeNFT.connect(user1).mergeNodes(node1Id, node2Id))
                    .to.emit(nodeNFT, "NodesMerged");
            }
        });
    });

    describe("Unstaking Paths", function () {
        const user1Stake = ethers.parseEther("100");
        const user2Stake = ethers.parseEther("2000"); // High TVL

        beforeEach(async function () {
            await mockSAVAX.connect(user2).approve(await stakingVault.getAddress(), user2Stake);
            await stakingVault.connect(user2).stake(await mockSAVAX.getAddress(), user2Stake);

            await mockSAVAX.connect(user1).approve(await stakingVault.getAddress(), user1Stake);
            await stakingVault.connect(user1).stake(await mockSAVAX.getAddress(), user1Stake);
        });

        it("Should handle instant unstake with 5% penalty", async function () {
            const initialUserBalance = await mockSAVAX.balanceOf(user1.address);
            const initialTreasuryBalance = await mockSAVAX.balanceOf(treasury.address);

            const penalty = (user1Stake * 500n) / 10000n;
            const expectedReturn = user1Stake - penalty;

            await expect(stakingVault.connect(user1).instantUnstake(1))
                .to.emit(stakingVault, "InstantUnstaked");

            expect(await mockSAVAX.balanceOf(user1.address)).to.equal(initialUserBalance + expectedReturn);
            expect(await mockSAVAX.balanceOf(treasury.address)).to.equal(initialTreasuryBalance + penalty);
        });

        it("Should handle cooldown unstake (7 days)", async function () {
            await expect(stakingVault.connect(user1).requestUnstake(1))
                .to.emit(stakingVault, "UnstakeRequested");

            await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine");

            const initialUserBalance = await mockSAVAX.balanceOf(user1.address);

            await expect(stakingVault.connect(user1).processUnstake(0))
                .to.emit(stakingVault, "UnstakeProcessed");

            expect(await mockSAVAX.balanceOf(user1.address)).to.equal(initialUserBalance + user1Stake);
        });

        it("Should allow emergency withdraw when paused", async function () {
            await stakingVault.pause();
            const initialUserBalance = await mockSAVAX.balanceOf(user1.address);
            await stakingVault.connect(user1).emergencyWithdraw(1);
            expect(await mockSAVAX.balanceOf(user1.address)).to.equal(initialUserBalance + user1Stake);
            expect(await nodeNFT.balanceOf(user1.address)).to.equal(0);
        });
    });
});
