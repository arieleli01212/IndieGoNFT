// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract IndieToken is ERC20 {
    constructor() ERC20("IndieCoin", "IND") {
        _mint(msg.sender, 1000000 * 10 ** decimals()); // Mint 1M tokens to deployer
    }

    // פונקציית ברז לטובת הדגמה - כל אחד יכול לקבל 1000 מטבעות
    function faucet() external {
        _mint(msg.sender, 1000 * 10 ** decimals());
    }
}