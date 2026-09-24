// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockPriceOracle {
    uint256 public carbonPricePerTon = 100e8;

    // event PriceUpdated(uint156 newPrice); // OLD - uint156 invalid/type mismatch
    event PriceUpdated(uint256 newPrice);

    // function getCarbonCreditPricePerTon() external view returns(uint156){ // OLD - must match IPriceOracle (uint256)
    function getCarbonCreditPricePerTon() external view returns (uint256) {
        return carbonPricePerTon;
    }

    function setCarbonCreditPricePerTon(uint256 _price) external {
        carbonPricePerTon = _price;
        emit PriceUpdated(_price);
    }
}
