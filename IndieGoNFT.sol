// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract IndieGoNFT is ERC721Enumerable, ReentrancyGuard {

    struct HistoryRecord {
        string actionType;
        address user;
        uint256 timestamp;
        uint256 amount;
    }

    struct Milestone {
        string description;
        uint256 payPercent;     // % of TOTAL project price
        bool isCompleted;       // true after payment released

        // --- Verification additions ---
        bool isSubmitted;       // creator submitted evidence for current milestone
        bool isApproved;        // buyer approved submitted evidence
        string evidenceURI;     // IPFS/Drive/URL/etc.
    }

    struct Project {
        string title;
        address payable creator;
        address buyer;          // original buyer who approves milestones
        uint256 price;
        uint256 balance;        // escrow held by contract (usually 90% of price)
        bool isSold;
        Milestone[3] milestones;
        uint256 currentMilestoneIndex; // 0..3
    }

    IERC20 public currency;
    uint256 public nextId;
    mapping(uint256 => Project) public projects;
    mapping(uint256 => HistoryRecord[]) public projectHistory;

    constructor(address _currencyAddress) ERC721("IndieGoProject", "IGP") {
        currency = IERC20(_currencyAddress);
    }

    // -----------------------------
    // Helpers
    // -----------------------------
    function _log(uint256 _id, string memory _action, uint256 _amount) internal {
        projectHistory[_id].push(HistoryRecord({
            actionType: _action,
            user: msg.sender,
            timestamp: block.timestamp,
            amount: _amount
        }));
    }

    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 len;
        while (j != 0) { len++; j /= 10; }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - (_i / 10) * 10));
            bstr[k] = bytes1(temp);
            _i /= 10;
        }
        return string(bstr);
    }

    modifier onlyCreator(uint256 _id) {
        require(msg.sender == projects[_id].creator, "Only creator");
        _;
    }

    modifier onlyBuyer(uint256 _id) {
        require(msg.sender == projects[_id].buyer, "Only buyer");
        _;
    }

    // -----------------------------
    // Core flow
    // -----------------------------
    function createProject(
        string memory _title,
        uint256 _price,
        string memory m1,
        string memory m2,
        string memory m3
    ) external {
        Project storage p = projects[nextId];
        p.title = _title;
        p.creator = payable(msg.sender);
        p.price = _price;

        // evidence fields start empty/false
        p.milestones[0] = Milestone(m1, 30, false, false, false, "");
        p.milestones[1] = Milestone(m2, 40, false, false, false, "");
        p.milestones[2] = Milestone(m3, 30, false, false, false, "");

        _mint(msg.sender, nextId);
        _log(nextId, "Created", _price);
        nextId++;
    }

    function buyProject(uint256 _id) external nonReentrant {
        Project storage p = projects[_id];
        require(!p.isSold, "Already sold");
        require(ownerOf(_id) != msg.sender, "Cannot buy own");

        uint256 upfront = (p.price * 10) / 100;
        uint256 escrow = p.price - upfront;

        require(currency.transferFrom(msg.sender, p.creator, upfront), "Upfront transfer failed");
        require(currency.transferFrom(msg.sender, address(this), escrow), "Escrow transfer failed");

        p.balance += escrow;
        p.isSold = true;
        p.buyer = msg.sender;

        _transfer(p.creator, msg.sender, _id);
        _log(_id, "Purchased (10% paid)", upfront);
    }

    /// Creator submits evidence for the CURRENT milestone only.
    function submitMilestoneEvidence(
        uint256 _id,
        string calldata evidenceURI
    ) external onlyCreator(_id) {
        Project storage p = projects[_id];
        require(p.isSold, "Not sold yet");
        require(p.currentMilestoneIndex < 3, "All milestones done");

        Milestone storage m = p.milestones[p.currentMilestoneIndex];
        require(!m.isCompleted, "Milestone already completed");
        require(!m.isSubmitted, "Evidence already submitted");
        require(bytes(evidenceURI).length > 0, "Empty URI");

        m.isSubmitted = true;
        m.evidenceURI = evidenceURI;

        string memory actionName = string(
            abi.encodePacked("Milestone ", uint2str(p.currentMilestoneIndex + 1), " Evidence Submitted")
        );
        _log(_id, actionName, 0);
    }

    /// Buyer approves/rejects evidence for the CURRENT milestone.
    /// Approve -> payout released. Reject -> evidence cleared so creator can resubmit.
    function reviewCurrentMilestone(
        uint256 _id,
        bool approve
    ) external nonReentrant onlyBuyer(_id) {
        Project storage p = projects[_id];
        require(p.isSold, "Not sold yet");
        require(p.currentMilestoneIndex < 3, "All milestones done");

        Milestone storage m = p.milestones[p.currentMilestoneIndex];
        require(m.isSubmitted, "No evidence submitted");
        require(!m.isCompleted, "Already completed");

        if (!approve) {
            m.isSubmitted = false;
            m.isApproved = false;
            m.evidenceURI = "";

            string memory actionReject = string(
                abi.encodePacked("Milestone ", uint2str(p.currentMilestoneIndex + 1), " Rejected")
            );
            _log(_id, actionReject, 0);
            return;
        }

        m.isApproved = true;
        m.isCompleted = true;

        uint256 amountToRelease = (p.price * m.payPercent) / 100;

        // Milestone #1 releases only 20% from escrow (because 10% already paid upfront)
        if (p.currentMilestoneIndex == 0) {
            uint256 upfront = (p.price * 10) / 100;
            amountToRelease = amountToRelease - upfront;
        }

        require(p.balance >= amountToRelease, "Insufficient escrow balance");
        p.balance -= amountToRelease;

        require(currency.transfer(p.creator, amountToRelease), "Payout failed");

        string memory actionApprove = string(
            abi.encodePacked("Milestone ", uint2str(p.currentMilestoneIndex + 1), " Approved & Paid")
        );
        _log(_id, actionApprove, amountToRelease);

        p.currentMilestoneIndex++;
    }

    // -----------------------------
    // View helpers
    // -----------------------------
    function getFullHistory(uint256 _id) external view returns (HistoryRecord[] memory) {
        return projectHistory[_id];
    }

    function getMilestones(uint256 _id) external view returns (Milestone[3] memory) {
        return projects[_id].milestones;
    }
}
