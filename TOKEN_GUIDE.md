# 🪙 Adding Crypto Tokens to ORB - Quick Guide

## ✅ ATOM Issue Fixed!

The issue with ATOM not showing price/value has been **fixed**! 

### What Was Wrong:
- When you added "ATOM", it was stored as "atom"
- But CoinGecko's API expects "cosmos" as the ID
- The price fetch failed because "atom" ≠ "cosmos"

### What's Fixed:
✅ Added **CRYPTO_ID_MAP** that automatically translates ticker symbols to CoinGecko IDs  
✅ ATOM now correctly maps to "cosmos"  
✅ 30+ popular tokens now supported with automatic mapping

---

## 📝 How to Add Tokens

### Method 1: Use Ticker Symbol (Recommended)
Just type the common ticker symbol:
- **ATOM** → Auto-maps to Cosmos ✅
- **ADA** → Auto-maps to Cardano ✅
- **DOT** → Auto-maps to Polkadot ✅
- **MATIC** → Auto-maps to Polygon ✅
- **AVAX** → Auto-maps to Avalanche ✅

### Method 2: Use CoinGecko ID (Advanced)
If a token isn't in the map, use its CoinGecko ID:
1. Go to https://www.coingecko.com
2. Search for your token
3. Look at the URL: `coingecko.com/en/coins/[ID]`
4. Use that ID in ORB

**Example:**
- Cosmos URL: `coingecko.com/en/coins/cosmos`
- Use ID: **cosmos**

---

## 🎯 Supported Tokens (Auto-Mapped)

### Top Cryptocurrencies
✅ **BTC** / **Bitcoin** → bitcoin  
✅ **ETH** / **Ethereum** → ethereum  
✅ **SOL** / **Solana** → solana  
✅ **BNB** → binancecoin  
✅ **XRP** → ripple  
✅ **ADA** → cardano  
✅ **DOGE** → dogecoin  
✅ **MATIC** → matic-network  
✅ **DOT** → polkadot  
✅ **AVAX** → avalanche-2

### DeFi & Layer 2
✅ **LINK** → chainlink  
✅ **UNI** → uniswap  
✅ **ARB** → arbitrum  
✅ **OP** → optimism  

### Cosmos Ecosystem
✅ **ATOM** → cosmos  
✅ **TIA** → celestia  
✅ **INJ** → injective-protocol  

### Other Popular Tokens
✅ **SHIB** → shiba-inu  
✅ **LTC** → litecoin  
✅ **TRX** → tron  
✅ **ETC** → ethereum-classic  
✅ **XLM** → stellar  
✅ **ALGO** → algorand  
✅ **VET** → vechain  
✅ **ICP** → internet-computer  
✅ **FIL** → filecoin  
✅ **APT** → aptos  
✅ **NEAR** → near  
✅ **FTM** → fantom  
✅ **SUI** → sui  
✅ **SEI** → sei-network

---

## 🔧 How It Works

### Behind the Scenes:
1. You enter: **ATOM** with quantity **100**
2. ORB stores it as: `{ atom: 100 }`
3. When fetching prices:
   - ORB checks `CRYPTO_ID_MAP['atom']` → finds `'cosmos'`
   - Fetches price from CoinGecko using ID: `cosmos`
   - Maps response back to `atom` key
4. Your portfolio shows:
   - **ATOM**: 100 tokens
   - **Price**: $10.50 (example)
   - **Value**: $1,050.00

---

## ➕ Adding New Tokens to the Map

### If a token isn't supported:

**Option 1: Use CoinGecko ID directly**
- Find the ID on CoinGecko
- Enter it in ORB (lowercase)

**Option 2: Add to the map (for developers)**
Edit `src/store.js` and add to `CRYPTO_ID_MAP`:
```javascript
const CRYPTO_ID_MAP = {
  // ... existing mappings ...
  'your-ticker': 'coingecko-id',
}
```

---

## 🐛 Troubleshooting

### Token Shows $0 or No Price?

**Check 1: Is it a valid CoinGecko token?**
- Search on https://www.coingecko.com
- If not found, CoinGecko doesn't track it

**Check 2: Did you use the right ID?**
- Ticker symbols are case-insensitive
- But must match CoinGecko's ID format

**Check 3: Wait for price update**
- Prices update every 5 seconds
- Force refresh by editing the token

### Token Not Showing Up?

**Check 1: Did you enter both symbol and amount?**
- Both fields are required

**Check 2: Is the amount a valid number?**
- Must be a positive number
- Decimals are allowed

---

## 💡 Pro Tips

### 1. Use Common Tickers
- **ATOM** instead of "cosmos"
- **ADA** instead of "cardano"
- **DOT** instead of "polkadot"

### 2. Check CoinGecko for New Tokens
- Always verify the token exists
- Use the exact ID from the URL

### 3. Batch Add Tokens
- Add multiple tokens at once
- Prices will fetch automatically

### 4. Update Quantities Anytime
- Just re-enter the ticker and new amount
- It will update, not duplicate

---

## 📊 Example: Adding ATOM

### Step-by-Step:
1. **Open Portfolio Panel**
2. **Enter Symbol:** ATOM
3. **Enter Amount:** 100
4. **Click "ADD / UPDATE"**
5. **Wait 5 seconds** for price to load
6. **See your ATOM** with price and value!

### What You'll See:
```
ATOM
100 tokens
$10.50 per token
$1,050.00 total value
+2.5% (24h change)
```

---

## 🎉 You're All Set!

ATOM and 30+ other popular tokens now work automatically!

### Quick Reference:
- **Supported Tokens:** 30+ auto-mapped
- **Custom Tokens:** Use CoinGecko ID
- **Price Updates:** Every 5 seconds
- **Value Calculation:** Automatic

---

## 📞 Need Help?

### Token Not Working?
1. Check if it's on CoinGecko
2. Try using the CoinGecko ID directly
3. Wait for price update (5 seconds)
4. Check console for errors

### Want to Add More Mappings?
Edit `src/store.js` → `CRYPTO_ID_MAP`

---

**Last Updated:** December 15, 2025  
**Version:** 1.0.1  
**Status:** ✅ ATOM Fixed + 30+ Tokens Supported
