// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Crowdfunding {
    struct Campaign {
        address payable owner;
        string title;
        string description;
        string imageUrl;
        uint goal;
        uint deadline;
        uint fundsRaised;
        bool completed;
        bool refunded;
    }

    mapping(uint => Campaign) public campaigns;
    uint public campaignCount = 0;

    mapping(uint => mapping(address => uint)) public contributions;
    mapping(uint => address[]) public contributors;

    event CampaignCreated(uint id, address owner, string title, uint goal, uint deadline);
    event Funded(uint id, address contributor, uint amount);
    event Withdrawn(uint id, uint amount);
    event Refunded(uint id, address contributor, uint amount);
    event CampaignRefunded(uint id);

    function createCampaign(
        string memory _title,
        string memory _description,
        string memory _imageUrl,
        uint _goal,
        uint _durationInMinutes
    ) public {
        require(_goal > 0, "Goal must be greater than 0");

        campaignCount++;
        Campaign storage newCampaign = campaigns[campaignCount];
        newCampaign.owner = payable(msg.sender);
        newCampaign.title = _title;
        newCampaign.description = _description;
        newCampaign.imageUrl = _imageUrl;
        newCampaign.goal = _goal;
        newCampaign.deadline = block.timestamp + (_durationInMinutes * 1 minutes);
        newCampaign.fundsRaised = 0;
        newCampaign.completed = false;
        newCampaign.refunded = false;

        emit CampaignCreated(campaignCount, msg.sender, _title, _goal, newCampaign.deadline);
    }

    function fundCampaign(uint _id) public payable {
        Campaign storage c = campaigns[_id];
        require(block.timestamp < c.deadline, "Campaign has ended");
        require(msg.value > 0, "Must send ETH to fund");
        require(!c.refunded, "Campaign has been refunded");

        // Check if campaign deadline has passed and auto-refund if needed
        if (block.timestamp >= c.deadline && c.fundsRaised < c.goal && !c.refunded) {
            _processRefunds(_id);
        }

        if (contributions[_id][msg.sender] == 0) {
            contributors[_id].push(msg.sender);
        }

        contributions[_id][msg.sender] += msg.value;
        c.fundsRaised += msg.value;

        emit Funded(_id, msg.sender, msg.value);
    }

    function withdrawFunds(uint _id) public {
        Campaign storage c = campaigns[_id];
        require(msg.sender == c.owner, "Only owner can withdraw");
        require(c.fundsRaised >= c.goal, "Goal not reached");
        require(!c.completed, "Funds already withdrawn");
        require(!c.refunded, "Campaign has been refunded");

        c.completed = true;
        c.owner.transfer(c.fundsRaised);

        emit Withdrawn(_id, c.fundsRaised);
    }

    // Internal function to process refunds (called automatically)
    function _processRefunds(uint _id) internal {
        Campaign storage c = campaigns[_id];
        require(block.timestamp >= c.deadline, "Campaign not ended yet");
        require(c.fundsRaised < c.goal, "Goal was reached");
        require(!c.refunded, "Already refunded");

        c.refunded = true;
        
        address[] memory campaignContributors = contributors[_id];
        for (uint i = 0; i < campaignContributors.length; i++) {
            address contributor = campaignContributors[i];
            uint amount = contributions[_id][contributor];
            
            if (amount > 0) {
                contributions[_id][contributor] = 0;
                payable(contributor).transfer(amount);
                emit Refunded(_id, contributor, amount);
            }
        }

        emit CampaignRefunded(_id);
    }

    // Function to check if refunds are available for a campaign
    function canRefund(uint _id) public view returns (bool) {
        Campaign storage c = campaigns[_id];
        return block.timestamp >= c.deadline && 
               c.fundsRaised < c.goal && 
               !c.refunded;
    }

    // Function to manually trigger refunds (if needed)
    function processRefunds(uint _id) public {
        Campaign storage c = campaigns[_id];
        require(block.timestamp >= c.deadline, "Campaign not ended yet");
        require(c.fundsRaised < c.goal, "Goal was reached");
        require(!c.refunded, "Already refunded");

        _processRefunds(_id);
    }

    function getCampaign(uint _id)
        public
        view
        returns (
            address owner,
            string memory title,
            string memory description,
            string memory imageUrl,
            uint goal,
            uint deadline,
            uint fundsRaised,
            bool completed
        )
    {
        Campaign storage c = campaigns[_id];
        return (c.owner, c.title, c.description, c.imageUrl, c.goal, c.deadline, c.fundsRaised, c.completed);
    }

    function getCampaignWithRefund(uint _id)
        public
        view
        returns (
            address owner,
            string memory title,
            string memory description,
            string memory imageUrl,
            uint goal,
            uint deadline,
            uint fundsRaised,
            bool completed,
            bool refunded
        )
    {
        Campaign storage c = campaigns[_id];
        return (
            c.owner,
            c.title,
            c.description,
            c.imageUrl,
            c.goal,
            c.deadline,
            c.fundsRaised,
            c.completed,
            c.refunded
        );
    }
}