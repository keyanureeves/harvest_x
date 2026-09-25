//SPDX-License-Identifier:MIT
pragma solidity 0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {HarvestX} from "../src/HarvestX.sol";
import {MockUSDC} from "../test/mocks/MockUSDC.sol";

contract RegisterHarvestX is Script {
    function register(address _harvestX) public {
        HarvestX(_harvestX).register();
        console.log("Registered farmer in HarvestX");
    }

    function run(address _harvestX) external {
        vm.startBroadcast();
        register(_harvestX);
        vm.stopBroadcast();
    }
}

contract ProcessWasteHarvestX is Script {
    function processWaste(address _harvestX) public {
        HarvestX(_harvestX).processWaste(100, "Organics", 5, 500);
        console.log("Processed waste in HarvestX");
    }

    function run(address _harvestX) external {
        vm.startBroadcast();
        processWaste(_harvestX);
        vm.stopBroadcast();
    }
}

/// Points an already-deployed HarvestX at the mock USDC + mock oracle
/// (owner only). Use on Sepolia after DeployMocks to enable the
/// buyCarbonCredits / redeemHxForStablecoin / calculatePriceInUSDC flow.
contract ConfigureMocksHarvestX is Script {
    function configure(
        address _harvestX,
        address _mockUSDC,
        address _mockOracle
    ) public {
        HarvestX(_harvestX).updateOracle(_mockOracle);
        HarvestX(_harvestX).updateUSDC(_mockUSDC);
        console.log("HarvestX pointed at MockUSDC + MockPriceOracle");
    }

    function run(
        address _harvestX,
        address _mockUSDC,
        address _mockOracle
    ) external {
        vm.startBroadcast();
        configure(_harvestX, _mockUSDC, _mockOracle);
        vm.stopBroadcast();
    }
}

/// Tops up the HarvestX contract with mock USDC so redemption and
/// farmer payouts can settle. MockUSDC.mint is owner-only, so this
/// must be run by the address that deployed MockUSDC.
contract FundHarvestXUSDC is Script {
    function fund(
        address _mockUSDC,
        address _harvestX,
        uint256 _amount
    ) public {
        MockUSDC(_mockUSDC).mint(_harvestX, _amount);
        console.log("Funded HarvestX with mock USDC");
    }

    function run(
        address _mockUSDC,
        address _harvestX,
        uint256 _amount
    ) external {
        vm.startBroadcast();
        fund(_mockUSDC, _harvestX, _amount);
        vm.stopBroadcast();
    }
}
