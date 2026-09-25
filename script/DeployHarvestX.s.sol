//SPDX-License-Identifier:MIT
pragma solidity 0.8.20;

import {Script} from "forge-std/Script.sol"; // this are libraries  that hep with scripting
import {HarvestX} from "../src/HarvestX.sol";
import {HarvestXToken} from "../src/HarvestXToken.sol";
import {MockUSDC} from "../test/mocks/MockUSDC.sol";
import {MockPriceOracle} from "../test/mocks/MockPriceOracle.sol";

contract DeployHarvestX is Script {
    // Full stack of interlinked contracts so the frontend can read every
    // address after a single run().
    struct Deployment {
        HarvestX harvestX;
        HarvestXToken hxToken;
        MockUSDC mockUSDC;
        MockPriceOracle mockPriceOracle;
    }

    // to run a script we need the function run(),  to have functions like vm i guess something of the sort
    function run() external returns (Deployment memory) {
        //Before startBroadcast -> Not a real tx

        //1. Deploy the mocks first so their addresses can be wired into the
        //   HarvestX constructor, keeping the whole system interlinked.
        (MockUSDC mockUSDC, MockPriceOracle mockPriceOracle) = deployMocks();

        vm.startBroadcast();
        HarvestXToken hxToken = new HarvestXToken();
        HarvestX harvestX = new HarvestX(
            address(hxToken),
            address(mockPriceOracle),
            address(mockUSDC)
        );
        hxToken.transferOwnership(address(harvestX)); //HarvestX must own the token to mint rewards
        vm.stopBroadcast();

        Deployment memory deployment = Deployment({
            harvestX: harvestX,
            hxToken: hxToken,
            mockUSDC: mockUSDC,
            mockPriceOracle: mockPriceOracle
        });

        return deployment;
    }

    // Deploys the mock dependencies on the active chain and returns them so
    // the caller (constructor wiring, scripts, frontend) can use the addresses.
    function deployMocks()
        public
        returns (MockUSDC mockUSDC, MockPriceOracle mockPriceOracle)
    {
        vm.startBroadcast();
        mockUSDC = new MockUSDC();
        mockPriceOracle = new MockPriceOracle();
        vm.stopBroadcast();
    }
}