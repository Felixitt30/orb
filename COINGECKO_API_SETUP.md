# CoinGecko API Key Setup Guide

## Why You Need This
The free CoinGecko API has very strict rate limits (10-30 calls per minute), which causes the $0 values you're seeing. With a free API key, you get **10,000 calls per month** - much more reliable!

## Step-by-Step Instructions

### 1. Get Your Free API Key
1. Go to https://www.coingecko.com/en/api/pricing
2. Click on **"Get Your Free API Key"** (Demo plan)
3. Sign up with your email
4. Verify your email
5. Copy your API key from the dashboard

### 2. Add the Key to Your Project
1. Open the `.env` file in your project root (`c:\dev\orb\.env`)
2. Replace the empty value with your API key:
   ```
   VITE_COINGECKO_API_KEY=CG-YourActualKeyHere
   ```
3. Save the file

### 3. Restart the Dev Server
1. Stop the current dev server (Ctrl+C in the terminal)
2. Run `npm run dev` again
3. Refresh your browser

## What Changed
- ✅ API calls now include your key in the `x-cg-demo-api-key` header
- ✅ No more CORS proxy needed (direct API calls)
- ✅ Much higher rate limits (10,000/month vs 10-30/min)
- ✅ More reliable data fetching

## Verification
After restarting, you should see:
- Real crypto prices instead of $0.00
- No more 429 errors in the console
- Portfolio values updating correctly

## Troubleshooting
- **Still seeing $0?** Make sure you restarted the dev server
- **429 errors?** Double-check your API key is correct in `.env`
- **Not working?** The key should start with `CG-`

## Free Tier Limits
- 10,000 calls/month
- 30 calls/minute
- More than enough for development and personal use!
