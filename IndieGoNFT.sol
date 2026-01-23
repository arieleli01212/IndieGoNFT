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
        uint256 payPercent;
        bool isCompleted;
    }

    struct Project {
        string title; // <--- חדש: כותרת הפרויקט
        address payable creator;
        uint256 price;
        uint256 balance;
        bool isSold;
        Milestone[3] milestones;
        uint256 currentMilestoneIndex;
    }

    IERC20 public currency;
    uint256 public nextId;
    mapping(uint256 => Project) public projects;
    mapping(uint256 => HistoryRecord[]) public projectHistory;

    constructor(address _currencyAddress) ERC721("IndieGoProject", "IGP") {
        currency = IERC20(_currencyAddress);
    }

    function _log(uint256 _id, string memory _action, uint256 _amount) internal {
        projectHistory[_id].push(HistoryRecord({
            actionType: _action,
            user: msg.sender,
            timestamp: block.timestamp,
            amount: _amount
        }));
    }

    // עדכון: הוספת _title כפרמטר
    function createProject(string memory _title, uint256 _price, string memory m1, string memory m2, string memory m3) external {
        Project storage p = projects[nextId];
        p.title = _title; // שמירת הכותרת
        p.creator = payable(msg.sender);
        p.price = _price;
        p.milestones[0] = Milestone(m1, 30, false);
        p.milestones[1] = Milestone(m2, 40, false);
        p.milestones[2] = Milestone(m3, 30, false);
        
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

        require(currency.transferFrom(msg.sender, p.creator, upfront), "Transfer failed");
        require(currency.transferFrom(msg.sender, address(this), escrow), "Escrow failed");

        p.balance += escrow;
        p.isSold = true;

        _transfer(p.creator, msg.sender, _id);
        _log(_id, "Purchased (10% paid)", upfront);
    }

    function completeMilestone(uint256 _id) external nonReentrant {
        Project storage p = projects[_id];
        require(msg.sender == p.creator, "Only creator");
        require(p.currentMilestoneIndex < 3, "Done");

        Milestone storage m = p.milestones[p.currentMilestoneIndex];
        m.isCompleted = true;

        uint256 amountToRelease = (p.price * m.payPercent) / 100;
        if (p.currentMilestoneIndex == 0) {
            amountToRelease -= (p.price * 10) / 100;
        }

        require(p.balance >= amountToRelease, "Insufficient funds");
        p.balance -= amountToRelease;
        currency.transfer(p.creator, amountToRelease);
        
        string memory actionName = string(abi.encodePacked("Milestone ", uint2str(p.currentMilestoneIndex + 1), " Done"));
        _log(_id, actionName, amountToRelease);

        p.currentMilestoneIndex++;
    }
    
    function getFullHistory(uint256 _id) external view returns (HistoryRecord[] memory) {
        return projectHistory[_id];
    }

    // פונקציה חדשה וקריטית ל-UI: שליפת אבני הדרך
    function getMilestones(uint256 _id) external view returns (Milestone[3] memory) {
        return projects[_id].milestones;
    }

    function uint2str(uint256 _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 len;
        while (j != 0) { len++; j /= 10; }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) { k = k-1; uint8 temp = (48 + uint8(_i - _i / 10 * 10)); bytes1 b1 = bytes1(temp); bstr[k] = b1; _i /= 10; }
        return string(bstr);
    }
}