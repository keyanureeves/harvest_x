// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockUSDC is ERC20, Ownable {
    uint8 private _decimals = 6;

    mapping(address => bool) public hasUsedFaucet;

    event FaucetDispensed(address indexed to, uint256 amount);

    constructor() ERC20("Mock USDC", "mUSDC") Ownable(msg.sender) {
        //mint 1 million USDC to this contract
        _mint(address(this), 1_000_000 * 10 ** 6);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    //One -time faucet (prevents abuse)
    function quickFaucet() external {
      uint256 amount = 10_000 * 10**6;
      require(balanceOf(address(this)) >= amount, "Out of funds");
      _transfer(address(this), msg.sender, amount);
      emit FaucetDispensed(msg.sender, amount);
    }

    //refill the faucet
    function refillFaucet(uint256 amount) external onlyOwner {
      _mint(address(this),amount);
    }

    //public mint function for testing
    function mint(address to,uint256 amount) external onlyOwner {
      _mint(to, amount);
    }
}
