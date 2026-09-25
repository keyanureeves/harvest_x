//SPDX-License-Identifier:MIT
pragma solidity 0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {MockUSDC} from "../test/mocks/MockUSDC.sol";
import {MockPriceOracle} from "../test/mocks/MockPriceOracle.sol";

/// Deploys the mock dependencies (MockUSDC + MockPriceOracle)
/// on any chain. Use this on Sepolia so the frontend MVP can rely on
/// the mocks backing buyCarbonCredits / redeemHxForStablecoin /
/// calculatePriceInUSDC. Afterwards, set the emitted addresses in
/// your .env as SEPOLIA_MOCK_USDC and SEPOLIA_MOCK_ORACLE.
contract DeployMocks is Script {
    struct MockAddresses {
        address usdc;
        address priceOracle;
    }

    function run() external returns (MockAddresses memory) {
        vm.startBroadcast();

        MockUSDC usdc = new MockUSDC();
        MockPriceOracle priceOracle = new MockPriceOracle();

        vm.stopBroadcast();

        console.log("MockUSDC deployed at:", address(usdc));
        console.log("MockPriceOracle deployed at:", address(priceOracle));

        return
            MockAddresses({
                usdc: address(usdc),
                priceOracle: address(priceOracle)
            });
    }
}
