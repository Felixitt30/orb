# Nova Nodes - Implementation Plan
## Sustainable Gamified Node Yield Farming on Avalanche

---

## Executive Summary

**Nova Nodes** is a next-generation DeFi protocol built on Avalanche C-Chain that combines liquid staking, restaking, and real-world asset (RWA) yield generation with gamified NFT mechanics. Unlike legacy node protocols that relied on unsustainable Ponzi tokenomics, Nova Nodes generates **real revenue-backed yields** through:

1. **Restaking via Suzaku Protocol** - Securing Avalanche L1s/subnets for validator rewards
2. **RWA Treasury Vaults** - Stable 4-6% yields from tokenized real-world assets
3. **Protocol Fee Revenue** - Sustainable treasury income for $NOVA buybacks/burns

**Target APR**: 8-15% (variable, based on real market conditions)  
**Core Innovation**: Upgradable ERC-721 Node NFTs with merge/fuse mechanics and yield multipliers  
**Governance**: veNOVA token locking for allocation voting and revenue sharing

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     NOVA NODES PROTOCOL                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │   User LSTs  │─────▶│ StakingVault │─────▶│  lrAVAX   │ │
│  │ (sAVAX/ggAVAX)│      │              │      │  (ERC20)  │ │
│  └──────────────┘      └──────┬───────┘      └───────────┘ │
│                               │                              │
│                               │ Mints                        │
│                               ▼                              │
│                        ┌──────────────┐                      │
│                        │   NodeNFT    │                      │
│                        │   (ERC721)   │                      │
│                        │ - Rarity     │                      │
│                        │ - Multiplier │                      │
│                        │ - Merge Logic│                      │
│                        └──────┬───────┘                      │
│                               │                              │
│                               ▼                              │
│                    ┌─────────────────────┐                   │
│                    │ AllocationManager   │                   │
│                    │                     │                   │
│                    │ ┌─────────────────┐ │                   │
│                    │ │ Suzaku Restaking│ │ ◀── 60-70%       │
│                    │ └─────────────────┘ │                   │
│                    │ ┌─────────────────┐ │                   │
│                    │ │  RWA Vaults     │ │ ◀── 30-40%       │
│                    │ │ (Sierra/Grove)  │ │                   │
│                    │ └─────────────────┘ │                   │
│                    └──────────┬──────────┘                   │
│                               │                              │
│                               ▼                              │
│                    ┌─────────────────────┐                   │
│                    │ RewardDistributor   │                   │
│                    │ - Claim rewards     │                   │
│                    │ - Auto-compound     │                   │
│                    │ - Fee collection    │                   │
│                    └──────────┬──────────┘                   │
│                               │                              │
│                               ▼                              │
│                    ┌─────────────────────┐                   │
│                    │   NovaToken ($NOVA) │                   │
│                    │   - Governance      │                   │
│                    │   - veNOVA locking  │                   │
│                    │   - Buyback/Burn    │                   │
│                    └─────────────────────┘                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Specifications

### Smart Contracts

#### 1. **NovaToken.sol** (ERC-20 Governance Token)
- **Total Supply**: 100,000,000 $NOVA
- **Features**:
  - Standard ERC-20 with permit (EIP-2612)
  - Burnable for deflationary mechanics
  - Snapshot capability for governance
- **Distribution**:
  - 40% - Community rewards (vested over 4 years)
  - 25% - Treasury
  - 20% - Team (2-year cliff, 4-year vest)
  - 10% - Initial liquidity
  - 5% - Ecosystem grants

#### 2. **VeNOVA.sol** (Vote-Escrowed NOVA)
- **Lock Periods**: 1 week to 4 years
- **Voting Power**: Linear with lock duration (max 4x multiplier)
- **Features**:
  - Non-transferable (soul-bound)
  - Delegation support
  - Revenue share distribution
  - Allocation voting rights

#### 3. **StakingVault.sol** (Core Staking Logic)
- **Accepted Assets**: sAVAX (Benqi), ggAVAX (GoGoPool)
- **Mints**: lrAVAX (liquid restaking token) + Node NFT
- **Key Functions**:
  ```solidity
  function stake(address lstToken, uint256 amount) external returns (uint256 nodeId)
  function unstake(uint256 nodeId, bool instant) external
  function compound(uint256 nodeId) external
  ```
- **Unstaking Options**:
  - Instant: 5% penalty fee (goes to treasury)
  - Cooldown: 7-day wait, no penalty
- **Security**:
  - Pausable (emergency)
  - ReentrancyGuard
  - Access control (OPERATOR_ROLE)

#### 4. **NodeNFT.sol** (ERC-721 with Gamification)
- **Metadata**:
  ```solidity
  struct NodeData {
    uint256 stakedAmount;      // lrAVAX backing
    uint8 rarity;              // 1-5 (Common to Legendary)
    uint16 yieldMultiplier;    // Basis points (10000 = 1.0x)
    uint64 createdAt;
    uint64 lastClaimTime;
  }
  ```
- **Rarity Distribution** (on mint, using VRF-style RNG):
  - Common (1): 50% chance, 1.0x multiplier
  - Uncommon (2): 30% chance, 1.1x multiplier
  - Rare (3): 15% chance, 1.25x multiplier
  - Epic (4): 4% chance, 1.5x multiplier
  - Legendary (5): 1% chance, 2.0x multiplier

- **Merge/Fuse Mechanics**:
  ```solidity
  function mergeNodes(uint256 nodeId1, uint256 nodeId2) external returns (uint256 newNodeId)
  ```
  - Burns 2 nodes of same rarity → Mints 1 node of next rarity
  - Combines staked amounts
  - Guaranteed rarity upgrade (up to Legendary)
  - Emits `NodesMerged` event

- **On-Chain RNG**: Use Avalanche's fast finality + blockhash + user address entropy
  ```solidity
  uint256 randomness = uint256(keccak256(abi.encodePacked(
    block.timestamp,
    block.prevrandao, // EIP-4399
    msg.sender,
    nodeCounter
  )));
  ```

#### 5. **AllocationManager.sol** (Yield Strategy Risk Router)
- **Features**:
  - **Diversification**: Supports multiple strategies (restaking, RWAs) with weighted allocations.
  - **Caps**: Per-strategy and global deposit caps to limit exposure.
  - **Emergency Rerouting**: One-click functionality to pull funds from compromised protocols to a secure target.
- **Allocation Targets** (governance-adjustable):
  - 60-70% → Suzaku restaking
  - 30-40% → RWA vaults
- **Rebalancing**: Automated via keeper network (Chainlink Automation or Gelato)
- **Key Functions**:
  ```solidity
  function setAllocation(address strategy, uint256 bps) external onlyGovernance
  function rebalance() external onlyKeeper
  function harvest() external returns (uint256 totalYield)
  ```

#### 6. **RewardDistributor.sol** (Yield Distribution)
- **Revenue Streams**:
  1. Suzaku restaking rewards (AVAX)
  2. RWA vault interest (USDC/USDT)
  3. Protocol fees (10-20% of all yields)
- **Distribution Logic**:
  - 80-90% → Auto-compound into lrAVAX (user balances increase)
  - 10-20% → Treasury for $NOVA buyback/burn or veNOVA rewards
- **Claiming**:
  ```solidity
  function claimRewards(uint256 nodeId) external returns (uint256 lrAVAXMinted)
  function claimProtocolFees() external onlyTreasury returns (uint256 amount)
  ```
- **Yield Calculation**:
  ```solidity
  userYield = baseYield * nodeMultiplier * timeElapsed / 365 days
  ```

#### 7. **LiquidRestakingToken.sol** (lrAVAX - ERC-20)
- **Rebasing**: Non-rebasing (like stETH, not aToken)
- **Exchange Rate**: Increases over time as yields accrue
  ```solidity
  function getExchangeRate() public view returns (uint256) {
    return totalAssets() * 1e18 / totalSupply();
  }
  ```
- **Transferable**: Yes (enables DeFi composability)
- **Use Cases**: Collateral in lending, LP in DEXs

---

## Security Measures

### Smart Contract Security

1. **OpenZeppelin Contracts**:
   - `Ownable2Step` (safe ownership transfer)
   - `Pausable` (emergency stop)
   - `ReentrancyGuard` (prevent reentrancy)
   - `AccessControl` (role-based permissions)

2. **Emergency Functions**:
   ```solidity
   function pause() external onlyOwner
   function emergencyWithdraw(uint256 nodeId) external whenPaused
   function recoverERC20(address token) external onlyOwner
   ```

3. **Audit Requirements**:
   - Pre-mainnet audit by reputable firm (Quantstamp, OpenZeppelin, Halborn)
   - Bug bounty program (Immunefi) - $50k-$500k rewards
   - Formal verification for critical functions (merge logic, yield calc)

- **Withdrawal Throttles**: Limits instant withdrawals to 10% of TVL per 24 hours to prevent "bank runs" or liquidity shocks.
- **Deposit Caps**: Global and per-strategy caps in `AllocationManager` to manage scaling and risk exposure.
- **Emergency Yield Rerouting**: Ability to redirect all incoming yield or existing principal if a protocol integration exhibits abnormal behavior.

5. **Access Control**:
   - `DEFAULT_ADMIN_ROLE`: Multisig (3/5 Gnosis Safe)
   - `OPERATOR_ROLE`: Keeper bots (rebalancing, harvesting)
   - `PAUSER_ROLE`: Emergency response team

---

## Tokenomics & Sustainability

### Revenue Model (No Ponzi!)

**Income Sources**:
1. **Suzaku Restaking Fees**: ~6-12% APR (variable based on L1 demand)
2. **RWA Vault Yields**: ~4-6% APR (stable, treasury-backed)
3. **Protocol Performance Fee**: 10-20% of all yields → Treasury

**Fee Distribution**:
- 50% → $NOVA buyback & burn (deflationary)
- 30% → veNOVA staker rewards (revenue share)
- 20% → Operational treasury (development, audits, insurance)

### $NOVA Utility

1. **Governance**: Vote on allocation strategies, fee parameters
2. **Revenue Share**: Lock as veNOVA to earn protocol fees
3. **Boost Multipliers**: veNOVA holders get 1.1-1.5x yield boost
4. **NFT Minting Discounts**: Reduced fees for node creation

### Anti-Dump Mechanisms

- Team tokens: 2-year cliff, 4-year linear vest
- Treasury: Time-locked releases via governance
- No inflationary emissions (fixed 100M supply)

---

## Development Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [x] Scaffold Hardhat project
- [ ] Install dependencies (OpenZeppelin, Hardhat, Ethers v6)
- [ ] Configure Avalanche C-Chain networks (Fuji testnet, mainnet)
- [ ] Set up TypeScript, linting (Solhint), formatting (Prettier)

### Phase 2: Core Contracts (Weeks 3-5)
- [ ] Implement NovaToken.sol + VeNOVA.sol
- [ ] Implement LiquidRestakingToken.sol (lrAVAX)
- [ ] Implement NodeNFT.sol with merge mechanics
- [ ] Implement StakingVault.sol
- [ ] Write unit tests (>90% coverage)

### Phase 3: Yield Infrastructure (Weeks 6-7)
- [ ] Implement AllocationManager.sol
- [ ] Implement RewardDistributor.sol
- [ ] Mock Suzaku/RWA integrations for testing
- [ ] Integration tests with forked mainnet
- [ ] Gas optimization pass

### Phase 4: Deployment & Verification (Week 8)
- [ ] Deploy to Fuji testnet
- [ ] Verify contracts on Snowtrace
- [ ] Testnet beta with community
- [ ] Security audit (external firm)
- [ ] Fix audit findings

### Phase 5: Frontend (Weeks 9-10)
- [ ] React app with Vite
- [ ] Wagmi v2 + Web3Modal v3 integration
- [ ] Staking dashboard (stake LSTs, view nodes)
- [ ] Node inventory (display NFTs, merge UI)
- [ ] Yield tracker (APY, claimable rewards)
- [ ] Governance portal (veNOVA locking, voting)

### Phase 6: Mainnet Launch (Week 11)
- [ ] Mainnet deployment
- [ ] Liquidity bootstrapping ($NOVA/AVAX pool)
- [ ] Marketing campaign
- [ ] Bug bounty launch
- [ ] Monitoring & incident response setup

---

## Technical Stack

### Smart Contracts
- **Language**: Solidity ^0.8.20
- **Framework**: Hardhat
- **Libraries**: 
  - OpenZeppelin Contracts v5.0
  - Chainlink (price feeds, automation)
- **Testing**: Hardhat Chai Matchers, Waffle
- **Coverage**: solidity-coverage

### Frontend
- **Framework**: React 18 + Vite
- **Web3**: Wagmi v2, Viem, Web3Modal v3
- **UI**: TailwindCSS, Radix UI, Framer Motion
- **State**: Zustand or Jotai
- **Charts**: Recharts or Chart.js

### Infrastructure
- **RPC**: Avalanche public RPC (+ Infura/Alchemy backup)
- **Indexing**: The Graph (subgraph for events)
- **IPFS**: NFT metadata storage (Pinata or NFT.Storage)
- **Monitoring**: Tenderly, Defender (OpenZeppelin)

---

## File Structure

```
nova-nodes/
├── contracts/
│   ├── core/
│   │   ├── NovaToken.sol
│   │   ├── VeNOVA.sol
│   │   ├── LiquidRestakingToken.sol
│   │   └── NodeNFT.sol
│   ├── staking/
│   │   ├── StakingVault.sol
│   │   ├── AllocationManager.sol
│   │   └── RewardDistributor.sol
│   ├── integrations/
│   │   ├── ISuzaku.sol (interface)
│   │   ├── IRWAVault.sol (interface)
│   │   └── mocks/
│   │       ├── MockSuzaku.sol
│   │       └── MockRWAVault.sol
│   └── libraries/
│       ├── YieldMath.sol
│       └── RarityRNG.sol
├── test/
│   ├── unit/
│   │   ├── NovaToken.test.ts
│   │   ├── NodeNFT.test.ts
│   │   ├── StakingVault.test.ts
│   │   └── ...
│   ├── integration/
│   │   ├── StakingFlow.test.ts
│   │   ├── MergeNodes.test.ts
│   │   └── YieldDistribution.test.ts
│   └── fixtures/
│       └── deployments.ts
├── scripts/
│   ├── deploy/
│   │   ├── 01-deploy-tokens.ts
│   │   ├── 02-deploy-staking.ts
│   │   ├── 03-deploy-allocation.ts
│   │   └── 04-verify-all.ts
│   └── utils/
│       └── helpers.ts
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── StakingDashboard.tsx
│   │   │   ├── NodeInventory.tsx
│   │   │   ├── MergeModal.tsx
│   │   │   └── GovernancePanel.tsx
│   │   ├── hooks/
│   │   │   ├── useStaking.ts
│   │   │   ├── useNodes.ts
│   │   │   └── useYield.ts
│   │   ├── wagmi.config.ts
│   │   └── App.tsx
│   └── public/
│       └── node-nft-assets/
├── hardhat.config.ts
├── package.json
└── README.md
```

---

## Key Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| **Smart contract exploits** | Multi-firm audits, bug bounty, formal verification |
| **Suzaku/RWA protocol failure** | Diversified allocations, circuit breakers, insurance fund |
| **Low liquidity for lrAVAX** | Incentivized DEX pools, protocol-owned liquidity |
| **Regulatory uncertainty (RWAs)** | Legal review, geographic restrictions, compliance monitoring |
| **Oracle manipulation** | Chainlink price feeds, TWAP fallbacks, sanity checks |
| **Governance attacks** | veNOVA time-locks, quorum requirements, multisig veto |

---

## Success Metrics (6 Months Post-Launch)

- **TVL**: $10M+ in staked LSTs
- **Nodes Minted**: 5,000+ NFTs
- **APY Stability**: Maintain 8-15% range with <20% volatility
- **$NOVA Market Cap**: $5M+ (fully diluted)
- **Community**: 10k+ Discord members, 50+ governance proposals
- **Security**: Zero critical exploits, <$100k in bug bounties paid

---

## Next Steps

1. **Review & Approve Plan**: Stakeholder sign-off on architecture
2. **Set Up Repository**: Initialize Hardhat project with CI/CD
3. **Begin Development**: Start with NovaToken.sol and tests
4. **Weekly Standups**: Track progress against roadmap
5. **Community Engagement**: Publish whitepaper, open Discord

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-17  
**Status**: Ready for Implementation

