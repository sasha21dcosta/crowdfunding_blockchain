# 🚀 Decentralized Crowdfunding Platform

A modern crowdfunding DApp frontend with automatic refund functionality. Users create campaigns, fund projects, and receive automatic refunds if goals aren't met.

## ✨ Features

- 🔐 **MetaMask Integration** - Seamless wallet connection
- 📝 **Campaign Creation** - Create detailed fundraising campaigns
- 💰 **Secure Funding** - Contribute ETH to support campaigns
- 🔄 **Automatic Refunds** - Contributors automatically refunded if goals aren't met
- 💸 **Smart Withdrawals** - Campaign owners withdraw funds when goals are reached
- 👥 **Multi-User Support** - Anyone can create or fund campaigns
- 📊 **Real-Time Tracking** - Live progress updates and contributor visibility

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript, Ethers.js v5
- **Smart Contract**: Solidity ^0.8.0 (deploy separately on Remix)
- **Blockchain**: Ethereum Sepolia Testnet
- **Wallet**: MetaMask

## 🚀 Quick Start

### Prerequisites
- MetaMask extension installed
- Sepolia testnet ETH
- Modern web browser

### 1. Get Sepolia ETH
1. Go to [Sepolia Faucet](https://sepoliafaucet.com/)
2. Enter your MetaMask wallet address
3. Request test ETH (usually 0.1-0.5 ETH)
4. Wait for confirmation (1-2 minutes)

### 2. Deploy Smart Contract
1. Open [Remix IDE](https://remix.ethereum.org/)
2. Create new file: `Crowdfunding.sol`
3. Copy code from `contracts/Crowdfunding.sol`
4. Compile with Solidity 0.8.0+
5. Deploy on Sepolia testnet
6. **Copy the contract address**

### 3. Configure Frontend
1. Open `config.js`
2. Update `CONTRACT_ADDRESS` with your deployed contract address
3. Save the file

### 4. Run Application
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server

# Using Live Server (VS Code)
Right-click index.html → "Open with Live Server"
```

Open `http://localhost:8000` in your browser

## 📋 How to Use

### Create Campaign
1. Connect MetaMask wallet
2. Fill campaign details (title, description, goal in ETH, duration in minutes)
3. Click "Create Campaign"
4. Confirm transaction in MetaMask

### Fund Campaign
1. Browse active campaigns
2. Click "Fund Campaign"
3. Enter ETH amount
4. Confirm transaction

### Automatic Refunds
- **No action required** - refunds happen automatically
- When deadline passes without reaching goal
- All contributors receive their money back

### Withdraw Funds
- **Campaign owners only**
- Available when goal is reached
- Click "Withdraw" button

## 🔧 Smart Contract Functions

```solidity
createCampaign(string _title, string _description, uint _goal, uint _durationInMinutes)
fundCampaign(uint _id) public payable
withdrawFunds(uint _id) public
getCampaign(uint _id) public view returns (...)
canRefund(uint _id) public view returns (bool)
```

## 📁 Project Structure

```
blockchain_project/               # Frontend Application
├── contracts/
│   └── Crowdfunding.sol          # Smart contract (deploy on Remix)
├── index.html                    # Main HTML structure
├── style.css                     # Styling and responsive design
├── script.js                     # Frontend logic and blockchain integration
├── config.js                     # Contract configuration
└── README.md                     # This file
```

## 🔗 Smart Contract Deployment

**Important**: This project is the **frontend only**. The smart contract must be deployed separately:

1. **Contract Location**: `contracts/Crowdfunding.sol`
2. **Deploy On**: [Remix IDE](https://remix.ethereum.org/)
3. **Network**: Sepolia Testnet
4. **Update**: Contract address in `config.js`

## 🧪 Testing

### Test Campaign Creation
1. Create campaign with 5-minute duration
2. Fund partially (don't reach goal)
3. Wait for deadline to pass
4. Verify automatic refunds

### Test Values
- **Duration**: 5 minutes (quick testing)
- **Goal**: 0.5 ETH
- **Funding**: 0.1 ETH (partial)

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| MetaMask not found | Install MetaMask extension |
| Wrong network | Switch to Sepolia testnet |
| Transaction fails | Check gas fees and network |
| Campaigns not loading | Verify contract address in config.js |
| CORS errors | Use local server, don't open file directly |

## 📊 Campaign States

- **Active** - Accepting contributions
- **Goal Reached** - Owner can withdraw funds
- **Refunded** - Contributors automatically refunded
- **Completed** - Funds withdrawn by owner

