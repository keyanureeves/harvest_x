//SPDX-License-Identifier:MIT
pragma solidity 0.8.20;

import {Test} from "forge-std/Test.sol";
import {HarvestX} from "../../src/HarvestX.sol";
import {HarvestXToken} from "../../src/HarvestXToken.sol";
import {MockUSDC} from "../mocks/MockUSDC.sol";
import {MockPriceOracle} from "../mocks/MockPriceOracle.sol";
import {DeployHarvestX} from "../../script/DeployHarvestX.s.sol";
import {RegisterHarvestX, ProcessWasteHarvestX} from "../../script/Interactions.s.sol";

// INTERACTIONS / INTEGRATION TESTS
// Verifies that the deployment + interaction scripts wire up the real
// HarvestX protocol end-to-end:
//   - DeployHarvestX script produces a working HarvestX deployment
//   - Interactions scripts can register farmers & process waste onchain
//   - The full cross-contract loop: farmer earns HX -> buyer buys carbon
//     credits with USDC -> farmer redeems HX back into USDC

contract InteractionsTest is Test {
    HarvestX harvestX;
    HarvestXToken hxToken;
    MockUSDC usdc;
    MockPriceOracle priceOracle;

    address public USER = makeAddr("user");
    address public BUYER = makeAddr("buyer");

    uint256 public constant WASTE_KG = 100;
    string public constant WASTE_TYPE = "Organics";
    uint256 public constant WORKERS = 5;
    uint256 public constant PAYMENT_KES = 500;

    // Deploy the whole stack directly so we have handles on every contract.
    function setUp() external {
        vm.startBroadcast(address(this));
        hxToken = new HarvestXToken();
        priceOracle = new MockPriceOracle();
        usdc = new MockUSDC();
        harvestX = new HarvestX(
            address(hxToken),
            address(priceOracle),
            address(usdc)
        );
        hxToken.transferOwnership(address(harvestX));
        vm.stopBroadcast();

        vm.deal(USER, 10 ether);
        vm.deal(BUYER, 10 ether);
    }

    // INTERACTION SCRIPT: REGISTER FARMER
    // The RegisterHarvestX script registers its own address as a farmer.
    function testInteractionScriptRegistersFarmer() public {
        RegisterHarvestX registerScript = new RegisterHarvestX();
        registerScript.register(address(harvestX));

        (bool isRegistered, , , , , ) = harvestX.farmers(
            address(registerScript)
        );
        assertTrue(isRegistered);
        assertEq(harvestX.totalFarmers(), 1);
    }

    // INTERACTION SCRIPT: PROCESS WASTE
    // The ProcessWasteHarvestX script processes waste and the farmer
    // (the script contract) receives the HX reward.
    function testInteractionScriptProcessesWaste() public {
        ProcessWasteHarvestX processScript = new ProcessWasteHarvestX();
        processScript.processWaste(address(harvestX));

        // 100kg => (100/10) * 1e18 = 10 HX minted to the script contract.
        assertEq(hxToken.balanceOf(address(processScript)), 10e18);
        assertEq(harvestX.globalWasteKg(), WASTE_KG);
        assertEq(harvestX.globalCO2Saved(), WASTE_KG * 400e18);
    }

    // DEPLOY SCRIPT + INTERACTION SCRIPTS COMBINED
    // The full script-based flow: deploy via DeployHarvestX, then register
    // and process waste entirely through the Interactions scripts.
    function testScriptBasedRegisterAndProcessEndToEnd() public {
        DeployHarvestX deploy = new DeployHarvestX();
        DeployHarvestX.Deployment memory deployment = deploy.run();
        HarvestX scriptHarvestX = deployment.harvestX;

        RegisterHarvestX registerScript = new RegisterHarvestX();
        registerScript.register(address(scriptHarvestX));

        ProcessWasteHarvestX processScript = new ProcessWasteHarvestX();
        processScript.processWaste(address(scriptHarvestX));

        // DeployHarvestX transfers token ownership so processWaste can mint.
        HarvestXToken scriptToken = HarvestXToken(scriptHarvestX.hxToken());
        assertEq(scriptToken.balanceOf(address(processScript)), 10e18);
        assertEq(scriptHarvestX.totalFarmers(), 1);
    }

    // FULL BUSINESS LOOP (cross-contract integration)
    // Complete economic cycle through the HarvestX protocol:
    //   1. farmer registers + is verified + processes waste (earns HX + CO2)
    //   2. buyer pays USDC for 1 ton of carbon credits (~$100), platform
    //      takes 2%, farmer gets 98 USDC
    //   3. farmer redeems 10 HX back into USDC from the contract reserves
    function testFullBusinessLoopBuyThenRedeem() public {
        //----- 1. farmer side
        vm.startPrank(USER);
        harvestX.register();
        harvestX.processWaste(2500, WASTE_TYPE, WORKERS, PAYMENT_KES);
        vm.stopPrank();

        // must be verified before they can redeem
        vm.prank(address(this));
        harvestX.verifyFarmer(USER);

        // farmer earned 1 ton of credits from 2500kg of waste
        assertEq(hxToken.balanceOf(USER), 250e18);
        (uint256 availableBefore, , , ) = harvestX.getAvailableCarbonCredits(
            USER
        );
        assertEq(availableBefore, 100); // 1.00 ton in hundredths

        //----- 2. buyer side
        usdc.mint(BUYER, 1_000e6);
        vm.prank(BUYER);
        usdc.approve(address(harvestX), 1_000e6);

        uint256 buyerUSDCBefore = usdc.balanceOf(BUYER);

        vm.prank(BUYER);
        harvestX.buyCarbonCredits(USER, 100, 1_000e6); // buy 1 ton @ $100/ton

        // buyer paid 100 USDC, platform keeps 2 USDC, farmer gets 98 USDC
        assertEq(usdc.balanceOf(BUYER), buyerUSDCBefore - 100e6);
        assertEq(usdc.balanceOf(USER), 98e6);
        assertEq(usdc.balanceOf(address(harvestX)), 2e6);
        assertEq(harvestX.getCorporatePurchases(BUYER), 1_000_000e18);

        // farmer's credits are now fully sold
        (uint256 availableAfter, , , ) = harvestX.getAvailableCarbonCredits(
            USER
        );
        assertEq(availableAfter, 0);

        //----- 3. redemption
        // top up reserves so the redemption is backed by USDC
        usdc.mint(address(harvestX), 1_000e6);

        vm.prank(USER);
        harvestX.redeemHxForStablecoin(10e18); // 10 HX -> 10 USDC

        // farmer burned their HX and received USDC
        assertEq(hxToken.balanceOf(USER), 250e18 - 10e18);
        assertEq(usdc.balanceOf(USER), 98e6 + 10e6);
    }

    // Applying the platform fee config flow via the owner keeps the rest
    // of the ecosystem working (buy still settles after a fee change).
    function testFeeChangeStillSettlesPurchase() public {
        harvestX.setPlatformFee(10); // 10% platform fee

        vm.startPrank(USER);
        harvestX.register();
        harvestX.processWaste(2500, WASTE_TYPE, WORKERS, PAYMENT_KES);
        vm.stopPrank();

        usdc.mint(BUYER, 1_000e6);
        vm.prank(BUYER);
        usdc.approve(address(harvestX), 1_000e6);

        vm.prank(BUYER);
        harvestX.buyCarbonCredits(USER, 100, 1_000e6);

        // 10 USDC fee, 90 USDC to the farmer
        assertEq(usdc.balanceOf(address(harvestX)), 10e6);
        assertEq(usdc.balanceOf(USER), 90e6);
    }
}
