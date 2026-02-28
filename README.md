# 🚀 Decentralized Crowdfunding DApp

Minimal frontend for a crowdfunding smart contract on Ethereum Sepolia.  
Users create campaigns (with images), fund them in ETH, and get automatic refunds if goals aren’t met.

## ✨ Features

- **MetaMask** wallet connection
- **Campaign creation** with title, description, image URL, goal, duration
- **Secure funding** in ETH
- **Automatic refunds** when goal not reached by deadline
- **Owner withdrawals** when goal is reached

## 🛠 Tech Stack

- **Frontend**: HTML, CSS, JavaScript, Ethers.js v5  
- **Contract**: Solidity ^0.8.0 (deployed via Remix)  
- **Network**: Ethereum Sepolia Testnet  
- **Wallet**: MetaMask

## 🚀 Quick Start

1. **Prerequisites**
   - MetaMask installed and on **Sepolia**
   - Some Sepolia ETH (e.g. from `https://sepoliafaucet.com`)

2. **Deploy contract (Remix)**
   - Open `Crowdfunding.sol` from `contracts/` in [Remix](https://remix.ethereum.org/)
   - Compile with Solidity 0.8.x
   - Deploy to **Sepolia** (Injected Provider – MetaMask)
   - Copy the deployed contract address

3. **Configure frontend**
   - Open `config.js`
   - Set `CONTRACT_ADDRESS` to your deployed address
   - (Optional) replace `CONTRACT_ABI` with the ABI from Remix

4. **Run frontend**
   ```bash
   # From project root
   python -m http.server 8000
   ```
   Open `http://localhost:8000` in your browser.

## 📋 Usage

- **Connect wallet**: Click “Connect MetaMask” (Sepolia only).  
- **Create campaign**: Fill title, description, image URL, goal (ETH), duration (minutes) → confirm tx.  
- **Fund campaign**: Choose a campaign → “Fund Campaign” → enter ETH → confirm tx.  
- **Withdraw**: Campaign owner clicks “Withdraw” after goal is reached.  
- **Refunds**: When deadline passes and goal not reached, contributors are refunded automatically/on `processRefunds`.

## 🔧 Contract (high level)

```solidity
createCampaign(string _title, string _description, string _imageUrl, uint _goal, uint _durationInMinutes)
fundCampaign(uint _id) payable
withdrawFunds(uint _id)
canRefund(uint _id) view returns (bool)
processRefunds(uint _id)
getCampaign(uint _id) view returns (owner, title, description, imageUrl, goal, deadline, fundsRaised, completed)
```

## 📁 Structure

```
contracts/Crowdfunding.sol   // Smart contract (deploy via Remix)
index.html                   // UI markup
style.css                    // Styling
script.js                    // Frontend + blockchain logic
config.js                    // Contract address + ABI
README.md                    // This file
```

## 🐛 Common Issues

- **MetaMask not detected**: Install MetaMask and refresh.  
- **Wrong network**: Switch MetaMask to **Sepolia**.  
- **Campaigns not loading / tx failing**: Check `CONTRACT_ADDRESS` and ABI in `config.js`, and confirm you redeployed the latest contract.  