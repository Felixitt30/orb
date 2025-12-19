# Nova Nodes - Audit Prep & Security Overview

## 🔐 Protocol Invariants
1. **lrAVAX Exchange Rate**: The exchange rate of `lrAVAX` should only increase or stay the same (non-rebasing). `totalAssets` can only be increased by `addYield` or `deposit`.
2. **Total Supply Sync**: `LiquidRestakingToken.totalSupply()` should always represent the shares of the underlying `totalAssets`.
3. **Reward Distribution**: The sum of all `earned()` rewards + rewards already paid + treasury balance + burned tokens should equal the total yield generated.
4. **Weighted Fairness**: Users with higher rarity Node NFTs or larger stakes must receive a proportionally larger share of the rewards.
5. **Withdrawal Safety**: `StakingVault.instantUnstake` must enforce the 10% daily TVL throttle to prevent bank runs.

## 🛠️ Upgrade Paths & Governance
- **Timelock**: All parameter changes (weights, caps, APY limits) must go through a 48-hour timelock (to be added to `AllocationManager`).
- **veNOVA Control**: Voting power in `veNOVA` should be the only way to propose/vote on `AllocationManager` changes.
- **Emergency Pause**: `DEFAULT_ADMIN_ROLE` can pause the `StakingVault` and `RewardDistributor` in case of exploit.

## 🧪 Testing Coverage
- [x] Unit Tests (NovaToken, Basic Logic)
- [x] Integration Tests (Vault, LRT, NFT, Merge)
- [x] Economic Simulations (12 Months, Yield Split, Reward Accuracy)
- [ ] Invariant Tests (Echidna/Foundry) - *Next Step*

## 🚧 Known Trade-offs
- **Gas Costs**: Merging nodes and claiming rewards are the most gas-intensive operations due to NFT state updates.
- **Throttle**: The 10% daily withdrawal limit protects the protocol but may cause user friction during low-liquidity periods.

## 📍 Final Review Checklist
- [x] All state variables properly initialized.
- [x] Access control applied to all sensitive functions.
- [x] Reentrancy guards on all external state-changing calls.
- [x] Integer overflow/underflow protection (Solidity 0.8+).
- [x] Emergency functions (pause/withdraw) tested.
