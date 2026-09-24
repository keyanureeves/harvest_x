// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HarvestXToken is ERC20, Ownable {
    //add events for mints and burns
    event TokensMinted(address indexed to, uint256 amount);
    event TokensRedeemed(address indexed from, uint256 amount);

    constructor() ERC20("HxToken", "HXT") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000 * 10 ** 18);
    }

    //minting
    function mint(address to, uint256 amount) external onlyOwner {
        require(amount > 0, "Insufficient Amount!");
        require(to != address(0), "Zero address!");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    //redeem
    function redeem(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        _burn(msg.sender, amount);
        emit TokensRedeemed(msg.sender, amount);
    }

    //burn
    function burnFrom(address account, uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be > 0");
        require(balanceOf(account) >= amount, "Insufficient balance");
        _burn(account, amount);
    }
}
