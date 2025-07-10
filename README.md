# 🪙 Rewind Coins

**A viral Farcaster Mini App where every memory mints its own Zora ERC20 coin. Tip, trade, and battle memories—onchain!**

---

## 🔗 Links & Resources

Codebase: https://github.com/Swarnim-Chandve/Coin
Video Demo 1: https://www.loom.com/share/21b4c8bcb35141748ccc2c06b2507615?sid=2af1d80f-46a0-435b-bcad-1313c83ee68b






Video Demo 2: https://www.loom.com/share/16681b9ed4c9493498d0acaea7d1ce62?sid=5aba94a0-b979-4735-8ede-8243200cb976










Presentation: https://docs.google.com/presentation/d/1z3qq5cPw4zgmwbnOJ2laQCPRBrN96RMExO6KYViZ_LM/edit?usp=sharing



Demo/Website: https://coin-two.vercel.app/

---

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Deployment & Testnet](#deployment--testnet)
- [Future Plans](#future-plans)
- [Credits](#credits)

---

## Overview

**Rewind Coins** is a social, onchain Farcaster Mini App built for the Zora x Farcaster hackathon. Every user-generated “memory” (text, image, or AI art) mints a unique Zora ERC20 coin on Base Sepolia using the Zora Coins SDK. Users can tip, trade, and battle memories, with all activity onchain and coins viewable on the Zora testnet explorer.

---

## Features

- **Mint a Coin for Every Memory:** Each memory mints a unique, tradable Zora ERC20 coin (not an NFT!).
- **Onchain Tipping & Trading:** Tip memory creators by buying their coins, powered by Zora/Uniswap v4.
- **Coin Battles:** Pit two memories against each other for the most tips—winner gets a badge!
- **Leaderboards:** See top tippers and holders.
- **Recent Activity Feed:** Stay up to date with the latest onchain actions.
- **“Surprise Me” Button:** Randomly tip a memory for fun, with haptics and confetti.
- **Social Sharing:** Share your tips and wins to Farcaster.
- **Comments:** Leave comments on memories (in-memory for demo).
- **Mobile-First UI:** Modern, delightful, and mini app–native.

---

## How It Works

1. **Connect your Farcaster wallet** (via Mini App SDK).
2. **Create a memory** (text, image, or AI art).
3. **A unique Zora ERC20 coin is minted** for your memory on Base Sepolia.
4. **Other users can tip you** by buying your coin (onchain, via Zora/Uniswap v4).
5. **Battle your memory** against others for the most tips.
6. **Track your stats** on global leaderboards.
7. **Share your activity** to Farcaster.

> All coins are visible on [testnet.zora.co](https://testnet.zora.co/coin/bsep:[token_address]) using the provided token address.

---

## Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS
- **Onchain:** Zora Coins SDK, Uniswap v4, Base Sepolia
- **Wallet & Social:** Farcaster Mini App SDK, Wagmi, Viem
- **Backend:** Prisma, SQLite (for demo), Vercel
- **Other:** Confetti, haptics, and delightful UX touches

---

## 🛠️ Architecture & Technical Details

### Onchain: Zora Coins SDK & Base Sepolia

- **ERC20 Coins, not NFTs:**  
  Every memory mints a unique ERC20 token using the Zora Coins SDK. This ensures full compliance with hackathon requirements (no NFTs).
- **Network:**  
  All coins are deployed on Base Sepolia (`chainId: 84532`), and are viewable on [testnet.zora.co](https://testnet.zora.co/coin/bsep:[token_address]).
- **Minting Flow:**  
  - User submits a memory (text/image/AI art).
  - Metadata is uploaded to IPFS.
  - The app calls `createCoin` from the Zora Coins SDK with:
    - `name`: Memory title
    - `symbol`: Auto-generated or user-chosen
    - `uri`: IPFS metadata link
    - `payoutRecipient`: Creator’s address
    - `chainId`: 84532 (Base Sepolia)
    - `currency`: ETH (ZORA not supported on Sepolia)
  - The SDK returns the new coin’s contract address.

### Trading & Tipping

- **Buy/Sell:**  
  Users can buy or sell any memory coin using the Zora Coins SDK’s `tradeCoin` function, which routes through Uniswap v4 pools.
- **Tipping:**  
  Tipping is implemented as a buy action, with the tipper receiving coins and the creator earning rewards.
- **Simulation:**  
  All trades are simulated before execution to show users expected outcomes and prevent failed transactions.

### Farcaster Mini App Integration

- **Wallet:**  
  Uses the Farcaster Mini App SDK for seamless wallet connection and transaction signing.
- **Haptics & Confetti:**  
  Haptic feedback and confetti are triggered on successful actions for delightful UX.
- **Social Sharing:**  
  After tipping or winning a battle, users can share their activity to Farcaster with a single tap.

### Backend & Data

- **Prisma ORM:**  
  Used for storing memory metadata, user profiles, and in-memory comments (for demo).
- **API Routes:**  
  Next.js API routes handle memory creation, leaderboard queries, and activity feeds.
- **No private keys stored:**  
  All onchain actions are user-signed; backend is non-custodial.

### UI/UX

- **Mobile-first:**  
  Responsive, touch-friendly, and optimized for Farcaster Mini App surfaces.
- **Modern Design:**  
  Uses Tailwind CSS and custom components for a clean, social look.
- **Delightful Interactions:**  
  Confetti, haptics, and “Surprise Me” random tip button for viral engagement.

---

## 🔗 Example API Endpoints

- `POST /api/memory`  
  Create a new memory and mint a coin.
- `GET /api/leaderboard`  
  Fetch top tippers and holders.
- `POST /api/tip`  
  Buy (tip) a memory coin.
- `GET /api/activity`  
  Recent onchain activity feed.
- `POST /api/battle`  
  Start a coin battle between two memories.

---

## 🧑‍💻 Example Code Snippet

```ts
import { createCoin, DeployCurrency } from "@zoralabs/coins-sdk";
import { baseSepolia } from "viem/chains";

const coinParams = {
  name: "My Memory",
  symbol: "MEM1",
  uri: "ipfs://bafybeigoxzqzbnxsn35vq7lls3ljxdcwjafxvbvkivprsodzrptpiguysy",
  payoutRecipient: "0xYourAddress",
  chainId: baseSepolia.id,
  currency: DeployCurrency.ETH,
};

const result = await createCoin(coinParams, walletClient, publicClient);
console.log("Coin address:", result.address);
```

---

## 🏆 Why This Project Stands Out

- **Meets all hackathon requirements:**  
  100% ERC20 coins, Base Sepolia, Zora Coins SDK, not NFTs.
- **Viral, social, and fun:**  
  Designed for sharing, tipping, and competition.
- **Modern, robust codebase:**  
  Next.js, Prisma, Wagmi, Viem, and best practices throughout.
- **Ready for mainnet and future growth.**

---

## Getting Started

1. **Clone the repo:**
   ```bash
   git clone https://github.com/Swarnim-Chandve/Coin.git
   cd Coin
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env` and fill in required keys (Farcaster, Zora, etc.)

4. **Run locally:**
   ```bash
   npm run dev
   ```

5. **Prisma (if needed):**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

---

## Deployment & Testnet

- **Network:** Base Sepolia
- **Zora Coins:** All coins minted are ERC20s, not NFTs.
- **Testnet Explorer:**  
  View any coin at:  
  `https://testnet.zora.co/coin/bsep:[token_address]`

---

## Future Plans

- Expand to more creative memory types (audio, video)
- Add onchain comments and reactions
- Integrate with more social platforms
- Launch on Base Mainnet
- Build a community around memory coins

---

## Credits

- Built by [Swarnim Chandve](https://github.com/Swarnim-Chandve) for the Zora x Farcaster hackathon.
- Thanks to Zora, Farcaster, Uniswap, and Encode Club for support and inspiration.

---

## License

MIT
