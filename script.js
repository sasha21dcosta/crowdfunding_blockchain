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
    // Check if CONFIG is loaded
    if (typeof CONFIG === 'undefined') {
        console.error('CONFIG not loaded! Check if config.js is loaded properly.');
        showNotification('Configuration not loaded. Please refresh the page.', 'error');
        return;
    }
    
    console.log('🔍 DEBUG: CONFIG loaded:', CONFIG);
    console.log('🔍 DEBUG: CONFIG.CONTRACT_ADDRESS:', CONFIG.CONTRACT_ADDRESS);
    console.log('🔍 DEBUG: CONFIG.CONTRACT_ABI length:', CONFIG.CONTRACT_ABI ? CONFIG.CONTRACT_ABI.length : 'undefined');
    
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
    
    // Debug config button
    document.getElementById('debugConfig').addEventListener('click', debugConfig);
    
    // View blockchain button
    document.getElementById('viewBlockchain').addEventListener('click', viewOnBlockchain);
    
    // Test refunds button
    document.getElementById('testRefunds').addEventListener('click', testRefundSystem);
    
    // Create campaign form
    document.getElementById('campaignForm').addEventListener('submit', createCampaign);
    
    // Refresh campaigns
    document.getElementById('refreshButton').addEventListener('click', loadCampaigns);
    
    // Fund campaign modal
    const fundModal = document.getElementById('fundModal');
    const contributorsModal = document.getElementById('contributorsModal');
    const closeModals = document.getElementsByClassName('close');
    
    // Close fund modal
    closeModals[0].onclick = () => fundModal.classList.remove('show');
    // Close contributors modal  
    closeModals[1].onclick = () => contributorsModal.classList.remove('show');
    
    window.onclick = (event) => {
        if (event.target === fundModal) {
            fundModal.classList.remove('show');
        }
        if (event.target === contributorsModal) {
            contributorsModal.classList.remove('show');
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
        
        // Create provider without ENS support to avoid errors
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
        console.log('🔍 DEBUG: CONFIG object:', CONFIG);
        console.log('🔍 DEBUG: Initializing contract with address:', CONFIG.CONTRACT_ADDRESS);
        console.log('🔍 DEBUG: ABI length:', CONFIG.CONTRACT_ABI.length);
        
        // Validate CONFIG before using
        if (!CONFIG.CONTRACT_ADDRESS || CONFIG.CONTRACT_ADDRESS.includes('Replace')) {
            throw new Error('Invalid contract address in CONFIG. Please check config.js file.');
        }
        
        if (!CONFIG.CONTRACT_ABI || CONFIG.CONTRACT_ABI.length === 0) {
            throw new Error('Invalid ABI in CONFIG. Please check config.js file.');
        }
        
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
        const durationInMinutes = parseInt(document.getElementById('campaignDuration').value);
        
        if (!title || !description || !goal || !durationInMinutes) {
            showNotification('Please fill in all fields', 'error');
            return;
        }
        
        if (durationInMinutes <= 0) {
            showNotification('Duration must be greater than 0 minutes', 'error');
            return;
        }
        
        if (durationInMinutes > 525600) {
            showNotification('Duration cannot exceed 525600 minutes (1 year)', 'error');
            return;
        }
        
        showNotification('Creating campaign... Please confirm the transaction in MetaMask', 'success');
        
        const tx = await contract.createCampaign(title, description, goal, durationInMinutes);
        
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

// Process automatic refunds for failed campaign
async function processRefunds(campaignId) {
    try {
        // Check if refund function exists
        if (typeof contract.processRefunds !== 'function') {
            showNotification('Refund function not available. Please deploy updated contract.', 'error');
            return;
        }
        
        showNotification('Processing automatic refunds... Please confirm the transaction in MetaMask', 'success');
        
        // Call the smart contract function to process refunds
        const tx = await contract.processRefunds(campaignId);
        
        showNotification('Refund transaction submitted! Waiting for confirmation...', 'success');
        
        await tx.wait();
        
        showNotification('All contributors have been automatically refunded!', 'success');
        
        // Reload campaigns to update status
        await loadCampaigns();
        
    } catch (error) {
        console.error('Error processing refunds:', error);
        if (error.code === 4001) {
            showNotification('Transaction rejected by user', 'error');
        } else if (error.message.includes('execution reverted')) {
            showNotification('Refund function not available. Please deploy updated contract.', 'error');
        } else if (error.message.includes('Campaign not ended yet')) {
            showNotification('Campaign deadline has not passed yet', 'error');
        } else if (error.message.includes('Goal was reached')) {
            showNotification('Campaign goal was reached, no refunds needed', 'error');
        } else if (error.message.includes('Already refunded')) {
            showNotification('Refunds have already been processed for this campaign', 'error');
        } else {
            showNotification('Failed to process refunds', 'error');
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
    } else if (isEnded && !goalReached) {
        statusClass = 'status-refunded';
        statusText = 'Refunded';
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
            <button class="btn btn-info" onclick="viewContributors(${campaign.id})">View Contributors</button>
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

// Debug config function
function debugConfig() {
    console.log('🔍 DEBUG: Manual config check triggered');
    console.log('🔍 DEBUG: typeof CONFIG:', typeof CONFIG);
    console.log('🔍 DEBUG: CONFIG object:', CONFIG);
    
    if (typeof CONFIG !== 'undefined') {
        console.log('🔍 DEBUG: CONTRACT_ADDRESS:', CONFIG.CONTRACT_ADDRESS);
        console.log('🔍 DEBUG: ABI length:', CONFIG.CONTRACT_ABI ? CONFIG.CONTRACT_ABI.length : 'undefined');
        showNotification('Config debug info logged to console', 'success');
    } else {
        console.error('🔍 DEBUG: CONFIG is undefined!');
        showNotification('CONFIG is undefined! Check config.js loading', 'error');
    }
}

// View contract on blockchain explorer
function viewOnBlockchain() {
    const contractAddress = CONFIG.CONTRACT_ADDRESS;
    const etherscanUrl = `https://sepolia.etherscan.io/address/${contractAddress}`;
    
    console.log('🔍 DEBUG: Opening blockchain explorer for contract:', contractAddress);
    console.log('🔍 DEBUG: Etherscan URL:', etherscanUrl);
    
    // Open in new tab
    window.open(etherscanUrl, '_blank');
    
    showNotification('Opening contract on Etherscan...', 'success');
}

// Test function to check refund functionality
async function testRefundSystem() {
    try {
        console.log('🧪 TESTING: Refund System');
        
        // Check if contract has refund functions
        console.log('🔍 DEBUG: Checking contract functions...');
        console.log('🔍 DEBUG: processRefunds function exists:', typeof contract.processRefunds);
        console.log('🔍 DEBUG: canRefund function exists:', typeof contract.canRefund);
        
        // Get campaign count
        const campaignCount = await contract.campaignCount();
        console.log('🔍 DEBUG: Total campaigns:', campaignCount.toString());
        
        // Check each campaign for refund eligibility
        for (let i = 1; i <= campaignCount; i++) {
            try {
                // Check if refund functions exist
                if (typeof contract.canRefund === 'function') {
                    const canRefund = await contract.canRefund(i);
                    const campaign = await contract.getCampaign(i);
                    console.log(`🔍 DEBUG: Campaign ${i} - Can refund: ${canRefund}`);
                    console.log(`🔍 DEBUG: Campaign ${i} - Deadline: ${new Date(Number(campaign.deadline) * 1000)}`);
                    console.log(`🔍 DEBUG: Campaign ${i} - Goal: ${ethers.utils.formatEther(campaign.goal)} ETH`);
                    console.log(`🔍 DEBUG: Campaign ${i} - Raised: ${ethers.utils.formatEther(campaign.fundsRaised)} ETH`);
                } else {
                    console.log(`⚠️ WARNING: Refund functions not available. Please deploy updated contract.`);
                    const campaign = await contract.getCampaign(i);
                    console.log(`🔍 DEBUG: Campaign ${i} - Deadline: ${new Date(Number(campaign.deadline) * 1000)}`);
                    console.log(`🔍 DEBUG: Campaign ${i} - Goal: ${ethers.utils.formatEther(campaign.goal)} ETH`);
                    console.log(`🔍 DEBUG: Campaign ${i} - Raised: ${ethers.utils.formatEther(campaign.fundsRaised)} ETH`);
                }
            } catch (error) {
                console.error(`Error checking campaign ${i}:`, error);
                if (error.message.includes('execution reverted')) {
                    console.log(`⚠️ Campaign ${i} may not exist or contract needs updating`);
                }
            }
        }
        
        showNotification('Refund system test completed. Check console for details.', 'success');
        
    } catch (error) {
        console.error('Error testing refund system:', error);
        showNotification('Refund system test failed. Check console for details.', 'error');
    }
}


// View contributors for a campaign
async function viewContributors(campaignId) {
    try {
        console.log('🔍 DEBUG: Loading contributors for campaign:', campaignId);
        
        // Get campaign info first
        const campaign = await contract.getCampaign(campaignId);
        document.getElementById('contributorsCampaignTitle').textContent = campaign.title;
        
        // Show modal
        const modal = document.getElementById('contributorsModal');
        modal.classList.add('show');
        
        // Show loading
        document.getElementById('contributorsList').innerHTML = '<div class="loading">Loading contributors...</div>';
        
        // Since we can't efficiently filter events by non-indexed parameters,
        // let's use a simpler approach: get all Funded events and filter manually
        const filter = contract.filters.Funded();
        const allEvents = await contract.queryFilter(filter);
        
        console.log('🔍 DEBUG: Found', allEvents.length, 'total funding events');
        
        // Filter events for this specific campaign
        const campaignEvents = allEvents.filter(event => {
            return event.args.id.toString() === campaignId.toString();
        });
        
        console.log('🔍 DEBUG: Found', campaignEvents.length, 'events for campaign', campaignId);
        
        if (campaignEvents.length === 0) {
            document.getElementById('contributorsList').innerHTML = '<p>No contributors yet.</p>';
            return;
        }
        
        // Process events and get current contribution amounts
        const contributors = new Map();
        
        for (const event of campaignEvents) {
            const contributor = event.args.contributor;
            const amount = event.args.amount;
            
            // Get current contribution amount from contract
            const currentContribution = await contract.contributions(campaignId, contributor);
            
            contributors.set(contributor, {
                address: contributor,
                totalContributed: ethers.utils.formatEther(currentContribution),
                lastContribution: ethers.utils.formatEther(amount)
            });
        }
        
        // Display contributors
        let html = '<div class="contributors-grid">';
        contributors.forEach((contributor, address) => {
            html += `
                <div class="contributor-card">
                    <div class="contributor-address">${address.slice(0, 6)}...${address.slice(-4)}</div>
                    <div class="contributor-amount">${contributor.totalContributed} ETH</div>
                    <div class="contributor-last">Last: ${contributor.lastContribution} ETH</div>
                </div>
            `;
        });
        html += '</div>';
        
        document.getElementById('contributorsList').innerHTML = html;
        
    } catch (error) {
        console.error('Error loading contributors:', error);
        document.getElementById('contributorsList').innerHTML = '<p>Error loading contributors. Please try again.</p>';
        showNotification('Failed to load contributors', 'error');
    }
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
