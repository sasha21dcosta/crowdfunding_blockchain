// Global state
let provider;
let signer;
let contract;
let connectedAddress;
let currentCampaignId = null;

// Network configuration
const SUPPORTED_NETWORKS = {
    1: { name: 'Ethereum Mainnet', rpc: 'https://mainnet.infura.io/v3/' },
    5: { name: 'Goerli Testnet', rpc: 'https://goerli.infura.io/v3/' },
    11155111: { name: 'Sepolia Testnet', rpc: 'https://sepolia.infura.io/v3/' },
    31337: { name: 'Localhost', rpc: 'http://localhost:8545' }
};

// Initialize the DApp
window.addEventListener('DOMContentLoaded', async () => {
    // Check if MetaMask is installed
    if (typeof window.ethereum !== 'undefined') {
        console.log('MetaMask is installed!');
        await initializeApp();
    } else {
        showNotification('Please install MetaMask to use this DApp!', 'error');
        document.getElementById('connectWallet').textContent = 'MetaMask Not Found';
        document.getElementById('connectWallet').disabled = true;
    }

    // Attach event listeners
    attachEventListeners();
});

// Initialize app and check for existing connection
async function initializeApp() {
    try {
        // Check if already connected
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            await connectWallet();
        }
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

// Attach all event listeners
function attachEventListeners() {
    // Wallet connection
    document.getElementById('connectWallet').addEventListener('click', connectWallet);
    
    // Create campaign form
    document.getElementById('campaignForm').addEventListener('submit', createCampaign);
    
    // Refresh campaigns
    document.getElementById('refreshButton').addEventListener('click', loadCampaigns);
    
    // Fund campaign modal
    const modal = document.getElementById('fundModal');
    const closeModal = document.getElementsByClassName('close')[0];
    closeModal.onclick = () => modal.classList.remove('show');
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.classList.remove('show');
        }
    };
    
    // Confirm fund button
    document.getElementById('confirmFund').addEventListener('click', fundCampaign);
    
    // Listen for account changes
    if (typeof window.ethereum !== 'undefined') {
        window.ethereum.on('accountsChanged', async (accounts) => {
            if (accounts.length === 0) {
                // User disconnected
                resetApp();
            } else {
                // Account switched
                await connectWallet();
            }
        });
        
        // Listen for network changes
        window.ethereum.on('chainChanged', async (chainId) => {
            console.log('🔍 DEBUG: Network changed to:', chainId);
            showNotification('Network changed. Reconnecting...', 'success');
            // Force page reload to ensure clean connection
            window.location.reload();
        });
    }
}

// Connect MetaMask wallet
async function connectWallet() {
    try {
        showNotification('Connecting to MetaMask...', 'success');
        
        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        connectedAddress = await signer.getAddress();
        
        // Check network
        const network = await provider.getNetwork();
        console.log('🔍 DEBUG: Connected to network:', network);
        console.log('🔍 DEBUG: Network name:', network.name);
        console.log('🔍 DEBUG: Chain ID:', network.chainId);
        console.log('🔍 DEBUG: Expected Sepolia chainId: 11155111');
        
        // Validate network
        if (!SUPPORTED_NETWORKS[network.chainId]) {
            const networkName = SUPPORTED_NETWORKS[network.chainId]?.name || `Chain ID ${network.chainId}`;
            showNotification(`Unsupported network: ${networkName}. Please switch to Sepolia test network.`, 'error');
            document.getElementById('connectionStatus').textContent = `✗ Wrong network: ${networkName}. Switch to Sepolia!`;
            document.getElementById('connectionStatus').className = 'status-message error';
            return;
        }
        
        // Special check for Mainnet (most common mistake)
        if (network.chainId === 1) {
            showNotification('You are on Ethereum Mainnet! Please switch to Sepolia test network in MetaMask.', 'error');
            document.getElementById('connectionStatus').textContent = '✗ On Mainnet! Switch to Sepolia test network!';
            document.getElementById('connectionStatus').className = 'status-message error';
            return;
        }
        
        // Initialize contract
        console.log('🔍 DEBUG: Initializing contract with address:', CONFIG.CONTRACT_ADDRESS);
        contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, CONFIG.CONTRACT_ABI, signer);
        console.log('🔍 DEBUG: Contract initialized:', contract);
        
        // Verify contract has code
        const code = await provider.getCode(CONFIG.CONTRACT_ADDRESS);
        console.log('🔍 DEBUG: Contract bytecode exists:', code !== '0x');
        console.log('🔍 DEBUG: Bytecode length:', code.length);
        
        if (code === '0x') {
            showNotification('Contract not found at this address. Please check the contract address.', 'error');
            document.getElementById('connectionStatus').textContent = '✗ Contract not found';
            document.getElementById('connectionStatus').className = 'status-message error';
            return;
        }
        
        // Update UI
        document.getElementById('walletAddress').textContent = 
            `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}`;
        document.getElementById('walletInfo').style.display = 'block';
        document.getElementById('connectWallet').textContent = 'Wallet Connected ✓';
        document.getElementById('createSection').style.display = 'block';
        
        document.getElementById('connectionStatus').textContent = `✓ Connected to ${SUPPORTED_NETWORKS[network.chainId].name}`;
        document.getElementById('connectionStatus').className = 'status-message success';
        
        // Load campaigns
        await loadCampaigns();
        
        showNotification('Wallet connected successfully!', 'success');
    } catch (error) {
        console.error('Error connecting wallet:', error);
        showNotification('Failed to connect wallet. Please try again.', 'error');
        document.getElementById('connectionStatus').textContent = '✗ Connection failed';
        document.getElementById('connectionStatus').className = 'status-message error';
    }
}

// Reset app state when wallet disconnects
function resetApp() {
    document.getElementById('walletInfo').style.display = 'none';
    document.getElementById('connectWallet').textContent = 'Connect MetaMask';
    document.getElementById('createSection').style.display = 'none';
    document.getElementById('connectionStatus').textContent = '';
    document.getElementById('connectionStatus').className = 'status-message';
    provider = null;
    signer = null;
    contract = null;
    connectedAddress = null;
}

// Create a new campaign
async function createCampaign(event) {
    event.preventDefault();
    
    try {
        const title = document.getElementById('campaignTitle').value;
        const description = document.getElementById('campaignDescription').value;
        const goal = ethers.utils.parseEther(document.getElementById('campaignGoal').value);
        const durationInDays = parseInt(document.getElementById('campaignDuration').value);
        
        if (!title || !description || !goal || !durationInDays) {
            showNotification('Please fill in all fields', 'error');
            return;
        }
        
        showNotification('Creating campaign... Please confirm the transaction in MetaMask', 'success');
        
        const tx = await contract.createCampaign(title, description, goal, durationInDays);
        
        showNotification('Transaction submitted! Waiting for confirmation...', 'success');
        
        await tx.wait();
        
        showNotification('Campaign created successfully!', 'success');
        
        // Reset form
        document.getElementById('campaignForm').reset();
        
        // Reload campaigns
        await loadCampaigns();
        
    } catch (error) {
        console.error('Error creating campaign:', error);
        if (error.code === 4001) {
            showNotification('Transaction rejected by user', 'error');
        } else {
            showNotification('Failed to create campaign', 'error');
        }
    }
}

// Open fund modal
function openFundModal(campaignId) {
    currentCampaignId = campaignId;
    const modal = document.getElementById('fundModal');
    modal.classList.add('show');
}

// Fund a campaign
async function fundCampaign() {
    try {
        const amount = document.getElementById('fundAmount').value;
        
        if (!amount || parseFloat(amount) <= 0) {
            showNotification('Please enter a valid amount', 'error');
            return;
        }
        
        showNotification('Processing funding... Please confirm the transaction in MetaMask', 'success');
        
        const value = ethers.utils.parseEther(amount);
        const tx = await contract.fundCampaign(currentCampaignId, { value });
        
        showNotification('Transaction submitted! Waiting for confirmation...', 'success');
        
        await tx.wait();
        
        showNotification('Campaign funded successfully!', 'success');
        
        // Close modal
        document.getElementById('fundModal').classList.remove('show');
        document.getElementById('fundAmount').value = '';
        
        // Reload campaigns
        await loadCampaigns();
        
    } catch (error) {
        console.error('Error funding campaign:', error);
        if (error.code === 4001) {
            showNotification('Transaction rejected by user', 'error');
        } else {
            showNotification('Failed to fund campaign', 'error');
        }
    }
}

// Withdraw funds from campaign
async function withdrawFunds(campaignId) {
    try {
        showNotification('Processing withdrawal... Please confirm the transaction in MetaMask', 'success');
        
        const tx = await contract.withdrawFunds(campaignId);
        
        showNotification('Transaction submitted! Waiting for confirmation...', 'success');
        
        await tx.wait();
        
        showNotification('Funds withdrawn successfully!', 'success');
        
        // Reload campaigns
        await loadCampaigns();
        
    } catch (error) {
        console.error('Error withdrawing funds:', error);
        if (error.code === 4001) {
            showNotification('Transaction rejected by user', 'error');
        } else {
            showNotification('Failed to withdraw funds', 'error');
        }
    }
}

// Load all campaigns
async function loadCampaigns() {
    try {
        console.log('🔍 DEBUG: Starting loadCampaigns...');
        console.log('🔍 DEBUG: Contract address:', CONFIG.CONTRACT_ADDRESS);
        console.log('🔍 DEBUG: Contract instance:', contract);
        
        if (!contract) {
            throw new Error('Contract not initialized');
        }
        
        document.getElementById('loadingMessage').style.display = 'block';
        document.getElementById('loadingMessage').textContent = 'Loading campaigns...';
        document.getElementById('campaignsList').innerHTML = '';
        
        console.log('🔍 DEBUG: Calling campaignCount()...');
        const campaignCount = await contract.campaignCount();
        console.log('🔍 DEBUG: Campaign count result:', campaignCount.toString());
        
        const campaigns = [];
        
        // Fetch all campaigns
        for (let i = 1; i <= campaignCount; i++) {
            try {
                console.log(`🔍 DEBUG: Fetching campaign ${i}...`);
                const campaign = await contract.getCampaign(i);
                campaigns.push({
                    id: i,
                    owner: campaign.owner,
                    title: campaign.title,
                    description: campaign.description,
                    goal: campaign.goal,
                    deadline: campaign.deadline,
                    fundsRaised: campaign.fundsRaised,
                    completed: campaign.completed
                });
                console.log(`🔍 DEBUG: Campaign ${i} loaded successfully`);
            } catch (error) {
                console.error(`Error fetching campaign ${i}:`, error);
                // Continue with other campaigns even if one fails
            }
        }
        
        document.getElementById('loadingMessage').style.display = 'none';
        
        if (campaigns.length === 0) {
            document.getElementById('noCampaignsMessage').style.display = 'block';
            document.getElementById('campaignsList').innerHTML = '';
        } else {
            document.getElementById('noCampaignsMessage').style.display = 'none';
            displayCampaigns(campaigns);
        }
        
        console.log(`🔍 DEBUG: Successfully loaded ${campaigns.length} campaigns`);
        
    } catch (error) {
        console.error('Error loading campaigns:', error);
        document.getElementById('loadingMessage').textContent = `Error loading campaigns: ${error.message}`;
        document.getElementById('loadingMessage').style.display = 'block';
        document.getElementById('noCampaignsMessage').style.display = 'none';
        
        // Show specific error messages
        if (error.message.includes('Contract not initialized')) {
            showNotification('Please connect your wallet first', 'error');
        } else if (error.message.includes('call revert')) {
            showNotification('Contract call failed. Please check if the contract is deployed correctly.', 'error');
        } else {
            showNotification('Failed to load campaigns. Please try again.', 'error');
        }
    }
}

// Display campaigns in the UI
function displayCampaigns(campaigns) {
    const campaignsList = document.getElementById('campaignsList');
    
    campaigns.forEach(campaign => {
        const card = createCampaignCard(campaign);
        campaignsList.appendChild(card);
    });
}

// Create a campaign card element
function createCampaignCard(campaign) {
    const card = document.createElement('div');
    card.className = 'campaign-card';
    
    const deadline = new Date(Number(campaign.deadline) * 1000);
    const now = new Date();
    const isEnded = deadline < now;
    const isCompleted = campaign.completed;
    const goalReached = ethers.utils.formatEther(campaign.fundsRaised) >= ethers.utils.formatEther(campaign.goal);
    
    let statusClass = 'status-active';
    let statusText = 'Active';
    
    if (isCompleted) {
        statusClass = 'status-completed';
        statusText = 'Completed';
    } else if (isEnded || goalReached) {
        statusClass = 'status-ended';
        statusText = goalReached ? 'Goal Reached' : 'Ended';
    }
    
    const isOwner = connectedAddress && campaign.owner.toLowerCase() === connectedAddress.toLowerCase();
    const progressPercentage = Math.min(
        (ethers.utils.formatEther(campaign.fundsRaised) / ethers.utils.formatEther(campaign.goal)) * 100,
        100
    );
    
    card.innerHTML = `
        <div class="campaign-header">
            <h3 class="campaign-title">${escapeHtml(campaign.title)}</h3>
            <p class="campaign-owner">Owner: ${campaign.owner.slice(0, 6)}...${campaign.owner.slice(-4)}</p>
        </div>
        <p class="campaign-description">${escapeHtml(campaign.description)}</p>
        <div class="campaign-stats">
            <div class="stat-item">
                <div class="stat-label">Goal</div>
                <div class="stat-value">${ethers.utils.formatEther(campaign.goal)} ETH</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Raised</div>
                <div class="stat-value">${ethers.utils.formatEther(campaign.fundsRaised)} ETH</div>
            </div>
        </div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressPercentage}%"></div>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">
            Deadline: ${deadline.toLocaleDateString()}<br>
            <span class="status-badge ${statusClass}">${statusText}</span>
        </p>
        <div class="campaign-actions">
            ${!isEnded && !isCompleted ? `<button class="btn btn-success" onclick="openFundModal(${campaign.id})">Fund Campaign</button>` : ''}
            ${isOwner && goalReached && !isCompleted ? `<button class="btn btn-danger" onclick="withdrawFunds(${campaign.id})">Withdraw</button>` : ''}
        </div>
    `;
    
    return card;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show notification toast
function showNotification(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
