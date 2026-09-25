//SPDX-License-Identifier:MIT
pragma solidity 0.8.20;

//1. deploying mocks when we are on the local anvil chain
//2. keep track of contract address across different chains by using a config file

//sepolia ETH/USD
//Mainnet ETH/USD
import {Script} from "forge-std/Script.sol";
import {MockPriceOracle} from "../test/mocks/MockPriceOracle.sol";
import {MockUSDC} from "../test/mocks/MockUSDC.sol";

contract HelperConfig is Script {
    // if we are on the local anvil, we deploy mocks
    //Otherwise, we grab the existing address from the live network

    NetworkConfig public activeNetworkConfig;

    uint8 public constant DECIMALS = 8;
    int256 public constant INITIAL_PRICE = 2000e8; // $2000

    struct NetworkConfig {
        address hxToken;
        address priceOracle; //carbon credit price oracle address
        address usdc; //stablecoin used for payments
    }

    constructor() {
        if (block.chainid == 11155111) {
            activeNetworkConfig = getSepoliaEthConfig();
        } else if (block.chainid == 1) {
            activeNetworkConfig = getMainnetEthConfig();
        } else {
            activeNetworkConfig = getAnvilEthConfig(); //needs refactoring
        }
    }

    function getSepoliaEthConfig() public view returns (NetworkConfig memory) {
        // Sepolia uses the mocked oracle + USDC so the frontend MVP can exercise
        // buyCarbonCredits / redeemHxForStablecoin / calculatePriceInUSDC.
        // Deploy them via script/DeployMocks.s.sol, then export:
        //   SEPOLIA_MOCK_USDC=<addr> SEPOLIA_MOCK_ORACLE=<addr>
        NetworkConfig memory sepoliaConfig = NetworkConfig({
            hxToken: address(0),
            priceOracle: vm.envOr("SEPOLIA_MOCK_ORACLE", address(0)),
            usdc: vm.envOr("SEPOLIA_MOCK_USDC", address(0))
        });
        return sepoliaConfig;
    }

    function getMainnetEthConfig() public view returns (NetworkConfig memory) {
        // Mainnet should be wired to real contracts, not mocks.
        NetworkConfig memory ethConfig = NetworkConfig({
            hxToken: address(0),
            priceOracle: vm.envOr("MAINNET_ORACLE", address(0)),
            usdc: vm.envOr("MAINNET_USDC", address(0))
        });
        return ethConfig;
    }

    function getAnvilEthConfig() public returns (NetworkConfig memory) {
        if (
            activeNetworkConfig.hxToken != address(0) ||
            activeNetworkConfig.priceOracle != address(0) ||
            activeNetworkConfig.usdc != address(0)
        ) {
            return activeNetworkConfig;
        }

        //1. Deploy the mocks
        //2. Return the mock addresses

        vm.startBroadcast();
        MockUSDC mockUSDC = new MockUSDC();
        MockPriceOracle mockPriceOracle = new MockPriceOracle();
        vm.stopBroadcast();

        NetworkConfig memory anvilConfig = NetworkConfig({
            hxToken: address(0), //HarvestXToken is deployed by the main deploy script
            priceOracle: address(mockPriceOracle),
            usdc: address(mockUSDC)
        });

        return anvilConfig;
    }
}
