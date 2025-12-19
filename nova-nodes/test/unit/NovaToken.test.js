const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("NovaToken", function () {
    async function deployNovaTokenFixture() {
        const [owner, community, treasury, team, liquidity, grants, user1] = await ethers.getSigners();

        const NovaToken = await ethers.getContractFactory("NovaToken");
        const novaToken = await NovaToken.deploy();

        return { novaToken, owner, community, treasury, team, liquidity, grants, user1 };
    }

    describe("Deployment", function () {
        it("Should mint total supply to deployer", async function () {
            const { novaToken, owner } = await loadFixture(deployNovaTokenFixture);

            const totalSupply = await novaToken.TOTAL_SUPPLY();
            const ownerBalance = await novaToken.balanceOf(owner.address);

            expect(ownerBalance).to.equal(totalSupply);
            expect(totalSupply).to.equal(ethers.parseEther("100000000")); // 100M tokens
        });

        it("Should have correct name and symbol", async function () {
            const { novaToken } = await loadFixture(deployNovaTokenFixture);

            expect(await novaToken.name()).to.equal("Nova Token");
            expect(await novaToken.symbol()).to.equal("NOVA");
        });
    });

    describe("Initial Distribution", function () {
        it("Should distribute tokens correctly", async function () {
            const { novaToken, owner, community, treasury, team, liquidity, grants } =
                await loadFixture(deployNovaTokenFixture);

            await novaToken.distributeInitialSupply(
                community.address,
                treasury.address,
                team.address,
                liquidity.address,
                grants.address
            );

            const totalSupply = await novaToken.TOTAL_SUPPLY();

            // Check balances (40%, 25%, 20%, 10%, 5%)
            expect(await novaToken.balanceOf(community.address)).to.equal(totalSupply * 40n / 100n);
            expect(await novaToken.balanceOf(treasury.address)).to.equal(totalSupply * 25n / 100n);
            expect(await novaToken.balanceOf(team.address)).to.equal(totalSupply * 20n / 100n);
            expect(await novaToken.balanceOf(liquidity.address)).to.equal(totalSupply * 10n / 100n);
            expect(await novaToken.balanceOf(grants.address)).to.equal(totalSupply * 5n / 100n);

            // Owner should have 0 after distribution
            expect(await novaToken.balanceOf(owner.address)).to.equal(0);
        });

        it("Should only allow distribution once", async function () {
            const { novaToken, community, treasury, team, liquidity, grants } =
                await loadFixture(deployNovaTokenFixture);

            await novaToken.distributeInitialSupply(
                community.address,
                treasury.address,
                team.address,
                liquidity.address,
                grants.address
            );

            await expect(
                novaToken.distributeInitialSupply(
                    community.address,
                    treasury.address,
                    team.address,
                    liquidity.address,
                    grants.address
                )
            ).to.be.revertedWith("Already distributed");
        });

        it("Should reject zero addresses", async function () {
            const { novaToken, treasury, team, liquidity, grants } =
                await loadFixture(deployNovaTokenFixture);

            await expect(
                novaToken.distributeInitialSupply(
                    ethers.ZeroAddress,
                    treasury.address,
                    team.address,
                    liquidity.address,
                    grants.address
                )
            ).to.be.revertedWith("Invalid addresses");
        });
    });

    describe("Burning", function () {
        it("Should allow token burning", async function () {
            const { novaToken, owner } = await loadFixture(deployNovaTokenFixture);

            const initialBalance = await novaToken.balanceOf(owner.address);
            const burnAmount = ethers.parseEther("1000000");

            await novaToken.burn(burnAmount);

            expect(await novaToken.balanceOf(owner.address)).to.equal(initialBalance - burnAmount);
            expect(await novaToken.totalSupply()).to.equal(initialBalance - burnAmount);
        });
    });

    describe("Governance", function () {
        it("Should support delegation", async function () {
            const { novaToken, owner, user1 } = await loadFixture(deployNovaTokenFixture);

            await novaToken.delegate(user1.address);

            const votes = await novaToken.getVotes(user1.address);
            expect(votes).to.equal(await novaToken.balanceOf(owner.address));
        });
    });
});
