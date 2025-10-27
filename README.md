# ✨ Decentralized Crowdfunding Platform

A professional full-stack decentralized application (DApp) built with Solidity and vanilla JavaScript for peer-to-peer crowdfunding campaigns on the Ethereum blockchain.

## ✨ Features

- 🔐 **MetaMask Wallet Integration** - Seamlessly connect and manage your Ethereum wallet
- 📝 **Create Campaigns** - Start your own crowdfunding campaign with title, description, goal, and deadline
- 💰 **Fund Campaigns** - Contribute ETH to support campaigns you believe in
- 💸 **Withdraw Funds** - Campaign owners can withdraw funds when the goal is reached
- 📊 **Real-time Updates** - View campaign progress, funds raised, and status
- 🎨 **Modern UI/UX** - Clean, responsive design with elegant animations
- 🔒 **Blockchain Security** - All transactions secured by smart contracts on Ethereum

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla), Ethers.js v5
- **Blockchain**: Solidity ^0.8.0, Ethereum, Sepolia Testnet
- **Wallet**: MetaMask
- **Development**: Remix IDE, VS Code

## 📋 Prerequisites

1. **MetaMask Extension** - Download from [metamask.io](https://metamask.io/)
2. **Modern Web Browser** (Chrome, Firefox, Edge, or Brave)
3. **Test ETH** - Get from [Sepolia Faucet](https://sepoliafaucet.com/)

## 🚀 Quick Setup

### 1. Download Project
```bash
git clone https://github.com/yourusername/blockchain_project.git
cd blockchain_project
```

### 2. Configure MetaMask
1. Install MetaMask extension
2. Switch to "Sepolia test network"
3. Get test ETH from faucet

### 3. Configure Contract
Update `config.js` with your contract details:
```javascript
const CONFIG = {
    CONTRACT_ADDRESS: "0xYourContractAddress",
    CONTRACT_ABI: [/* Your ABI here */]
};
```

### 4. Run Application
```bash
# Using Python
python -m http.server 8000

# Or using Node.js
npm install -g http-server
http-server
```

### 5. Access DApp
Open `http://localhost:8000` in your browser

## 🎯 Usage

### Connect Wallet
1. Click "Connect MetaMask"
2. Approve connection request
3. Verify wallet address is displayed

### Create Campaign
1. Fill in campaign details (title, description, goal, duration)
2. Click "Create Campaign"
3. Confirm transaction in MetaMask

### Fund Campaign
1. Browse active campaigns
2. Click "Fund Campaign"
3. Enter ETH amount and confirm transaction

### Withdraw Funds
1. Campaign owner only
2. Goal must be reached
3. Click "Withdraw" and confirm transaction

## 🔧 Smart Contract Functions

```solidity
function createCampaign(string memory _title, string memory _description, uint256 _goal, uint256 _durationInDays) public
function fundCampaign(uint256 _id) public payable
function withdrawFunds(uint256 _id) public
function getCampaign(uint256 _id) public view returns (...)
function campaignCount() public view returns (uint256)
```

## 📁 Project Structure

```
blockchain_project/
├── index.html          # Main HTML structure
├── style.css           # Styling and responsive design
├── script.js           # Frontend logic and blockchain integration
├── config.js           # Contract configuration
└── README.md           # Documentation
```

## 🐛 Troubleshooting

**MetaMask Not Found**: Install MetaMask extension
**Wrong Network**: Switch to Sepolia test network
**Transaction Fails**: Check gas fees and network
**Campaigns Not Loading**: Verify contract address and ABI
**CORS Errors**: Use local server, don't open file directly
