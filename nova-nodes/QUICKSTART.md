# Nova Nodes - Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will help you set up the Nova Nodes development environment and run your first tests.

---

## Prerequisites

Before you begin, make sure you have:
- ✅ Node.js v18 or higher ([Download](https://nodejs.org/))
- ✅ npm or yarn package manager
- ✅ Git ([Download](https://git-scm.com/))
- ✅ A code editor (VS Code recommended)

---

## Step 1: Navigate to Project

The project is already set up in your workspace:

```bash
cd c:\dev\orb\nova-nodes
```

---

## Step 2: Install Dependencies

All dependencies are already installed! But if you need to reinstall:

```bash
npm install
```

This installs:
- Hardhat (Ethereum development environment)
- OpenZeppelin Contracts (secure, audited smart contract library)
- Chainlink Contracts (oracle integration)
- Testing libraries (Chai, Mocha)

---

## Step 3: Compile Contracts

Compile all Solidity smart contracts:

```bash
npm run compile
```

Expected output:
```
Compiled 52 Solidity files successfully
```

This creates:
- `artifacts/` - Compiled contract ABIs and bytecode
- `cache/` - Compilation cache for faster rebuilds

---

## Step 4: Run Tests

Run the test suite to verify everything works:

```bash
npm test
```

Expected output:
```
  NovaToken
    Deployment
      ✓ Should mint total supply to deployer
      ✓ Should have correct name and symbol
    Initial Distribution
      ✓ Should distribute tokens correctly
      ✓ Should only allow distribution once
      ✓ Should reject zero addresses
    Burning
      ✓ Should allow token burning
    Governance
      ✓ Should support delegation

  7 passing (2s)
```

---

## Step 5: Deploy Locally (Optional)

### Start a local Hardhat node:

```bash
npm run node
```

This starts a local Ethereum-compatible blockchain on `http://localhost:8545`

### In a new terminal, deploy contracts:

```bash
npm run deploy:local
```

You'll see:
```
🚀 Deploying Nova Nodes Protocol to localhost
================================================

1️⃣  Deploying NovaToken...
✅ NovaToken deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3

2️⃣  Deploying LiquidRestakingToken...
✅ LiquidRestakingToken deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

... (and so on)
```

---

## 📁 Project Structure

```
nova-nodes/
├── contracts/           # Solidity smart contracts
│   ├── core/           # Core protocol contracts
│   ├── staking/        # Staking logic
│   └── integrations/   # External protocol interfaces
├── test/               # Test files
│   ├── unit/          # Unit tests
│   └── integration/   # Integration tests (to be added)
├── scripts/            # Deployment and utility scripts
│   └── deploy/        # Deployment scripts
├── artifacts/          # Compiled contracts (generated)
├── cache/             # Build cache (generated)
└── deployments/       # Deployment addresses (generated)
```

---

## 🧪 Testing Commands

```bash
# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run with gas reporting
npm run test:gas

# Generate coverage report
npm run test:coverage

# Clean build artifacts
npm run clean
```

---

## 🌐 Network Deployment

### Fuji Testnet (Avalanche)

1. **Get testnet AVAX**: Visit [Avalanche Faucet](https://faucet.avax.network/)

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env`** with your private key:
   ```
   PRIVATE_KEY=your_private_key_here
   SNOWTRACE_API_KEY=your_snowtrace_api_key
   ```

4. **Deploy to Fuji**:
   ```bash
   npm run deploy:fuji
   ```

5. **Verify contracts**:
   ```bash
   npx hardhat verify --network fuji <CONTRACT_ADDRESS>
   ```

### Mainnet (⚠️ NOT RECOMMENDED YET)

**DO NOT deploy to mainnet without:**
- ✅ Complete test coverage (>95%)
- ✅ Professional security audit
- ✅ Bug bounty program
- ✅ Multisig setup for admin functions
- ✅ Community testing on testnet

---

## 📖 Key Contracts Overview

### 1. NovaToken.sol
**Purpose**: Governance token ($NOVA)
- Total supply: 100,000,000 tokens
- Burnable for deflationary mechanics
- Voting power for governance
- Revenue share for stakers

### 2. LiquidRestakingToken.sol
**Purpose**: Liquid restaking token (lrAVAX)
- Represents staked LST positions
- Exchange rate increases with yields
- Transferable and composable
- Used as collateral in DeFi

### 3. NodeNFT.sol
**Purpose**: Gamified staking NFTs
- 5 rarity levels (Common to Legendary)
- Yield multipliers (1.0x to 2.0x)
- Merge mechanics to upgrade rarity
- On-chain metadata

### 4. StakingVault.sol
**Purpose**: Main user interface
- Stake LSTs (sAVAX, ggAVAX)
- Mint lrAVAX + Node NFT
- Unstake (instant or cooldown)
- Emergency withdraw

---

## 🎮 Usage Examples

### Staking LSTs

```javascript
// In your test or script
const { ethers } = require("hardhat");

// Get contracts
const stakingVault = await ethers.getContractAt("StakingVault", VAULT_ADDRESS);
const sAVAX = await ethers.getContractAt("IERC20", SAVAX_ADDRESS);

// Approve LST
await sAVAX.approve(stakingVault.address, ethers.parseEther("100"));

// Stake to get lrAVAX + Node NFT
const tx = await stakingVault.stake(sAVAX.address, ethers.parseEther("100"));
const receipt = await tx.wait();

// Get node ID from event
const event = receipt.events.find(e => e.event === 'Staked');
console.log("Node ID:", event.args.nodeId);
console.log("lrAVAX minted:", event.args.lrAVAXMinted);
```

### Merging Nodes

```javascript
// Merge two Common nodes → Uncommon
const nodeNFT = await ethers.getContractAt("NodeNFT", NFT_ADDRESS);

const tx = await nodeNFT.mergeNodes(nodeId1, nodeId2);
const receipt = await tx.wait();

const event = receipt.events.find(e => e.event === 'NodesMerged');
console.log("New node ID:", event.args.newTokenId);
console.log("New rarity:", event.args.newRarity); // 1 = Uncommon
```

### Unstaking

```javascript
// Option 1: Instant unstake (5% penalty)
await stakingVault.instantUnstake(nodeId);

// Option 2: Request cooldown unstake (no penalty)
await stakingVault.requestUnstake(nodeId);
// Wait 7 days...
await stakingVault.processUnstake(requestIndex);
```

---

## 🔧 Troubleshooting

### "Cannot find module 'hardhat'"
```bash
npm install
```

### "Insufficient funds for gas"
Get testnet AVAX from [faucet](https://faucet.avax.network/)

### "Contract not deployed"
Make sure you've run `npm run deploy:local` or deployed to the network you're testing on

### Compilation errors
```bash
npm run clean
npm run compile
```

---

## 📚 Additional Resources

- **Full Documentation**: See `README.md`
- **Implementation Plan**: `.agent/artifacts/nova-nodes-implementation-plan.md`
- **Project Summary**: `.agent/artifacts/nova-nodes-summary.md`
- **Architecture Diagram**: See generated image artifact

### External Links
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Avalanche Documentation](https://docs.avax.network/)
- [Solidity Documentation](https://docs.soliditylang.org/)

---

## 🎯 Next Steps

1. ✅ **Explore the code**: Open contracts in your editor
2. ✅ **Run tests**: `npm test`
3. ✅ **Read the docs**: Check `README.md` for detailed info
4. 📝 **Write more tests**: Add integration tests
5. 🚀 **Deploy to testnet**: Test on Fuji
6. 🔒 **Security audit**: Before mainnet

---

## 💬 Need Help?

- Check the README.md for detailed documentation
- Review test files for usage examples
- Read inline code comments in contracts
- Consult Hardhat documentation for framework questions

---

**Happy Building! 🚀**

*Nova Nodes - Sustainable Gamified Node Yield Farming on Avalanche*
