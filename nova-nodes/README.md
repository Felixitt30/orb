# Nova Nodes 🌟

**Sustainable Gamified Node Yield Farming on Avalanche**

Nova Nodes is a next-generation DeFi protocol that combines liquid staking, restaking, and real-world asset (RWA) yield generation with gamified NFT mechanics. Unlike legacy node protocols, Nova Nodes generates **real revenue-backed yields** through Suzaku restaking and RWA treasury vaults.

## 🎯 Key Features

- **Liquid Staking Integration**: Stake sAVAX (Benqi) or ggAVAX (GoGoPool) to mint lrAVAX
- **Gamified Node NFTs**: ERC-721 NFTs with rarity levels and yield multipliers
- **Merge Mechanics**: Combine two nodes of the same rarity to upgrade to higher rarity
- **Real Yield**: 8-15% APR from Suzaku restaking + RWA vaults (no Ponzi tokenomics)
- **Risk Management**:
  - **Diversified Yield**: Spread assets across multiple restaking and RWA strategies.
  - **Deposit Caps**: Global and strategy-level caps to manage protocol exposure.
  - **Withdrawal Throttles**: Limits on instant withdrawals (10% of TVL per day) to ensure stability.
  - **Emergency Rerouting**: One-click fund recovery from compromised strategies.

## 📊 Architecture

```
User Stakes LST (sAVAX/ggAVAX)
         ↓
   StakingVault
    ↓         ↓
  lrAVAX   NodeNFT (with rarity & multiplier)
    ↓
AllocationManager
    ↓         ↓
 Suzaku    RWA Vaults
(60-70%)   (30-40%)
    ↓
RewardDistributor
    ↓
Auto-compound + Protocol Fees → $NOVA Buyback/Burn
```

## 🏗️ Smart Contracts

### Core Contracts

- **NovaToken.sol**: ERC-20 governance token (100M fixed supply)
- **LiquidRestakingToken.sol**: lrAVAX with dynamic exchange rate
- **NodeNFT.sol**: ERC-721 with rarity, multipliers, and merge logic
- **StakingVault.sol**: Main staking interface
- **AllocationManager.sol**: Yield strategy router
- **RewardDistributor.sol**: Yield distribution and compounding

### Rarity System

| Rarity    | Probability | Yield Multiplier |
|-----------|-------------|------------------|
| Common    | 50%         | 1.0x             |
| Uncommon  | 30%         | 1.1x             |
| Rare      | 15%         | 1.25x            |
| Epic      | 4%          | 1.5x             |
| Legendary | 1%          | 2.0x             |

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- npm or yarn
- Avalanche wallet (Core, MetaMask, etc.)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/nova-nodes.git
cd nova-nodes

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your private key and API keys
```

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage

# Run with gas reporting
npm run test:gas
```

### Deploy

```bash
# Deploy to local Hardhat network
npm run node  # In one terminal
npm run deploy:local  # In another terminal

# Deploy to Fuji testnet
npm run deploy:fuji

# Deploy to Avalanche mainnet
npm run deploy:avalanche
```

### Verify Contracts

After deployment, verify on Snowtrace:

```bash
npx hardhat verify --network fuji <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## 📝 Usage Example

### Staking

```javascript
// Approve LST
await sAVAX.approve(stakingVault.address, amount);

// Stake to mint lrAVAX + Node NFT
const tx = await stakingVault.stake(sAVAX.address, amount);
const receipt = await tx.wait();

// Get node ID from event
const event = receipt.events.find(e => e.event === 'Staked');
const nodeId = event.args.nodeId;
```

### Merging Nodes

```javascript
// Merge two Common nodes → Uncommon
await nodeNFT.mergeNodes(nodeId1, nodeId2);
```

### Unstaking

```javascript
// Option 1: Instant unstake (5% penalty)
await stakingVault.instantUnstake(nodeId);

// Option 2: Request unstake (7-day cooldown, no penalty)
await stakingVault.requestUnstake(nodeId);
// Wait 7 days...
await stakingVault.processUnstake(requestIndex);
```

## 🔒 Security

- **Audits**: Pre-mainnet audit by [Firm Name] (scheduled)
- **Bug Bounty**: $50k-$500k on Immunefi (post-launch)
- **Access Control**: Role-based permissions with multisig
- **Emergency Functions**: Pausable contracts with emergency withdraw

### Security Best Practices

- All contracts use OpenZeppelin libraries
- ReentrancyGuard on all state-changing functions
- Pausable for emergency stops
- Comprehensive test coverage (target >95%)

## 🛣️ Roadmap

- [x] Phase 1: Core contracts development
- [x] Phase 2: Unit tests
- [ ] Phase 3: Integration tests
- [ ] Phase 4: Fuji testnet deployment
- [ ] Phase 5: Security audit
- [ ] Phase 6: Frontend dApp
- [ ] Phase 7: Mainnet launch

## 💰 Tokenomics

### $NOVA Distribution

- 40% - Community rewards (4-year vest)
- 25% - Treasury
- 20% - Team (2-year cliff, 4-year vest)
- 10% - Initial liquidity
- 5% - Ecosystem grants

### Revenue Model

- **Income**: Suzaku restaking (6-12% APR) + RWA vaults (4-6% APR)
- **Protocol Fee**: 10-20% of yields
- **Fee Distribution**:
  - 50% → $NOVA buyback & burn
  - 30% → veNOVA staker rewards
  - 20% → Operational treasury

## 🧪 Testing

```bash
# Run all tests
npm test

# Test specific contract
npx hardhat test test/unit/NovaToken.test.js

# Run with gas reporting
REPORT_GAS=true npm test

# Generate coverage
npm run test:coverage
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## 📞 Contact

- Website: [https://novanodes.fi](https://novanodes.fi)
- Twitter: [@NovaNodes](https://twitter.com/NovaNodes)
- Discord: [discord.gg/novanodes](https://discord.gg/novanodes)
- Docs: [docs.novanodes.fi](https://docs.novanodes.fi)

## ⚠️ Disclaimer

This software is provided "as is" without warranty. Use at your own risk. DeFi protocols involve financial risk. Always do your own research.

---

**Built with ❤️ on Avalanche**
