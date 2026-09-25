// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Test} from "forge-std/Test.sol";
import {HarvestX} from "../../src/HarvestX.sol";
import {HarvestXToken} from "../../src/HarvestXToken.sol";
import {MockUSDC} from "../mocks/MockUSDC.sol";
import {MockPriceOracle} from "../mocks/MockPriceOracle.sol";

// This suite covers the main business logic in src/HarvestX.sol:
//   - farmer registration & verification lifecycle
//   - waste processing, token minting & carbon credit accrual
//   - product claiming
//   - carbon credit purchasing (buyer side)
//   - HX -> USDC redemption
//   - owner-only config functions (min price, platform fee, oracle)
//   - view/helper functions & statistics

contract HarvestXTest is Test {
    HarvestX harvestX;
    HarvestXToken hxToken;
    MockUSDC usdc;
    MockPriceOracle priceOracle;

    address public USER = makeAddr("user");
    address public BUYER = makeAddr("buyer");

    uint256 public constant WASTE_KG = 100;
    uint256 public constant WORKERS = 5;
    uint256 public constant PAYMENT_KES = 500;
    string public constant WASTE_TYPE = "Organics";

    //=========================================================
    // SETUP - deploy the full stack, HarvestX owns the token
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

    // expects every require/mint path to work from a registered farmer
    modifier registeredFarmer() {
        vm.startPrank(USER);
        harvestX.register();
        harvestX.processWaste(WASTE_KG, WASTE_TYPE, WORKERS, PAYMENT_KES);
        vm.stopPrank();
        _;
    }

    // Tests that the deployer (this test contract) becomes the owner
    // and the token/priceOracle/USDC are wired correctly.
    function testOwnerIsMsgSender() public {
        assertEq(harvestX.owner(), address(this));
        assertEq(address(harvestX.hxToken()), address(hxToken));
        assertEq(address(harvestX.priceOracle()), address(priceOracle));
    }

    // A user can register once and is tracked in totalFarmers.
    function testRegisterFarmer() public {
        vm.prank(USER);
        harvestX.register();
        (bool isRegistered, , , , , ) = harvestX.farmers(USER);
        assertTrue(isRegistered);
        assertEq(harvestX.totalFarmers(), 1);
    }

    // Double registration is rejected.
    function testRegisterRevertsIfAlreadyRegistered() public {
        vm.startPrank(USER);
        harvestX.register();
        vm.expectRevert("Already registered");
        harvestX.register();
        vm.stopPrank();
    }

    // PROCESS WASTE
    // 100kg of waste => (100/10)*1e18 = 10 HX rewarded to the farmer.
    function testProcessWasteMintsTokens() public {
        vm.startPrank(USER);
        harvestX.register();
        harvestX.processWaste(WASTE_KG, WASTE_TYPE, WORKERS, PAYMENT_KES);
        vm.stopPrank();

        uint256 expectedTokens = (WASTE_KG / 10) * 1e18;
        assertEq(hxToken.balanceOf(USER), expectedTokens);
    }

    // Waste under 10kg is rejected.
    function testProcessWasteRevertsBelow10Kg() public {
        vm.startPrank(USER);
        harvestX.register();
        vm.expectRevert("Minimum 10kg");
        harvestX.processWaste(5, WASTE_TYPE, WORKERS, PAYMENT_KES);
        vm.stopPrank();
    }

    // Processing with zero workers is rejected - proves labour is tracked.
    function testProcessWasteRevertsWithNoWorkers() public {
        vm.startPrank(USER);
        harvestX.register();
        vm.expectRevert("At least 1 worker");
        harvestX.processWaste(WASTE_KG, WASTE_TYPE, 0, PAYMENT_KES);
        vm.stopPrank();
    }

    // Processing with zero payment is rejected - proves payment is tracked.
    function testProcessWasteRevertsWithNoPayment() public {
        vm.startPrank(USER);
        harvestX.register();
        vm.expectRevert("Payment must be > 0");
        harvestX.processWaste(WASTE_KG, WASTE_TYPE, WORKERS, 0);
        vm.stopPrank();
    }

    // CO2 saved = kg * 400e18 grams; global + per-farmer totals updated.
    function testProcessWasteAccruesCarbonCredits() public {
        vm.startPrank(USER);
        harvestX.register();
        harvestX.processWaste(WASTE_KG, WASTE_TYPE, WORKERS, PAYMENT_KES);
        vm.stopPrank();

        uint256 expectedCO2Grams = WASTE_KG * 400e18;
        // getAvailableCarbonCredits returns hundredths of a metric ton:
        // 100kg * 400e18 = 40,000e18 grams = 0.04 metric tons => 4 hundredths.
        (, uint256 earned, , ) = harvestX.getAvailableCarbonCredits(USER);
        assertEq(earned, 4);
        assertEq(harvestX.globalCO2Saved(), expectedCO2Grams);
        assertEq(harvestX.globalWasteKg(), WASTE_KG);
    }

    // CLAIM PRODUCT TOKENS
    // Farmers can claim product tokens even before waste processing;
    // 100kg of product => 10 HX.
    function testClaimProductTokens() public {
        vm.prank(USER);
        harvestX.claimProductTokens(100);

        uint256 expectedTokens = (100 * 1e18) / 10;
        assertEq(hxToken.balanceOf(USER), expectedTokens);
    }

    // Zero product amount is rejected.
    function testClaimProductTokensRevertsZero() public {
        vm.expectRevert("Amount must be greater than zero");
        harvestX.claimProductTokens(0);
    }

    // FARMER VERIFICATION (owner only)
    // The owner can verify a registered farmer -> enables redemption.
    function testVerifyFarmer() public {
        vm.prank(USER);
        harvestX.register();

        vm.prank(address(this));
        harvestX.verifyFarmer(USER);

        assertTrue(harvestX.verifiedFarmers(USER));
    }

    // Can't verify a farmer who has never registered.
    function testVerifyFarmerRequiresRegistration() public {
        vm.expectRevert("Farmer not registere");
        harvestX.verifyFarmer(USER);
    }

    // Verification can be revoked, disabling privileged actions.
    function testRevokeVerification() public {
        vm.startPrank(USER);
        harvestX.register();
        vm.stopPrank();

        vm.startPrank(address(this));
        harvestX.verifyFarmer(USER);
        harvestX.revokeVerification(USER);
        vm.stopPrank();

        assertFalse(harvestX.verifiedFarmers(USER));
    }

    // Non-owners cannot verify farmers.
    function testVerifyFarmerOnlyOwner() public {
        vm.prank(USER);
        harvestX.register();
        vm.expectRevert();
        vm.prank(BUYER);
        harvestX.verifyFarmer(USER);
    }

    // REDEMPTION (HX -> USDC) - verified farmers only
    // A verified farmer redeems 10 HX for 10 USDC (6 dp). Contract must hold
    // USDC reserves, farmer must own the HX.
    function testRedeemHxForStablecoin() public {
        vm.startPrank(USER);
        harvestX.register();
        harvestX.processWaste(WASTE_KG, WASTE_TYPE, WORKERS, PAYMENT_KES);
        vm.stopPrank();

        vm.prank(address(this));
        harvestX.verifyFarmer(USER);

        // fund contract reserves with USDC
        usdc.mint(address(harvestX), 1_000e6);

        vm.startPrank(USER);
        harvestX.redeemHxForStablecoin(10e18);
        vm.stopPrank();

        uint256 expectedUSDC = (10e18 * 1e6) / 1e18;
        assertEq(usdc.balanceOf(USER), expectedUSDC);
        assertEq(hxToken.balanceOf(USER), 0); // tokens burned
    }

    // Unverified farmers cannot redeem.
    function testRedeemRevertsIfNotVerified() public {
        vm.startPrank(USER);
        harvestX.register();
        harvestX.processWaste(WASTE_KG, WASTE_TYPE, WORKERS, PAYMENT_KES);
        vm.startPrank(USER);
        vm.expectRevert("Farmer not verified");
        harvestX.redeemHxForStablecoin(1e18);
        vm.stopPrank();
        vm.stopPrank();
    }

    // Redemption is rejected if the contract lacks USDC reserves.
    function testRedeemRevertsIfNoReserves() public {
        vm.startPrank(USER);
        harvestX.register();
        harvestX.processWaste(WASTE_KG, WASTE_TYPE, WORKERS, PAYMENT_KES);
        vm.stopPrank();

        vm.prank(address(this));
        harvestX.verifyFarmer(USER);

        vm.expectRevert("Insufficient USDC in contract");
        vm.prank(USER);
        harvestX.redeemHxForStablecoin(1e18);
    }

    // Redemption is rejected if the farmer holds no HX tokens.
    function testRedeemRevertsIfNoTokens() public {
        vm.startPrank(USER);
        harvestX.register();
        vm.stopPrank();

        vm.prank(address(this));
        harvestX.verifyFarmer(USER);

        usdc.mint(address(harvestX), 1_000e6);

        // Farmer never processed waste, so their HX balance is zero.
        vm.expectRevert("Insufficient amount of Hx token");
        vm.prank(USER);
        harvestX.redeemHxForStablecoin(1e18);
    }

    // CHECK REDEMPTION STATUS - view
    // Unregistered caller gets a clear rejection reason.
    function testCheckRedemptionStatusNotRegistered() public {
        (bool can, string memory reason, , , , , ) = harvestX
            .checkRedemptionStatus(1e18);
        assertFalse(can);
        assertEq(reason, "Not registered as a farmer");
    }

    // Registered but unverified caller is rejected with that reason.
    function testCheckRedemptionStatusNotVerified() public {
        vm.prank(USER);
        harvestX.register();
        vm.prank(USER);
        (bool can, string memory reason, , , , , ) = harvestX
            .checkRedemptionStatus(1e18);
        assertFalse(can);
        assertEq(reason, "Farmer not verified");
    }

    // A fully-verified farmer with tokens & reserves can redeem.
    function testCheckRedemptionStatusReady() public {
        vm.startPrank(USER);
        harvestX.register();
        harvestX.processWaste(WASTE_KG, WASTE_TYPE, WORKERS, PAYMENT_KES);
        vm.stopPrank();

        vm.prank(address(this));
        harvestX.verifyFarmer(USER);

        usdc.mint(address(harvestX), 1_000e6);

        vm.prank(USER);
        (bool can, string memory reason, uint256 usdcAmount, , , , ) = harvestX
            .checkRedemptionStatus(10e18);
        assertTrue(can);
        assertEq(reason, "Ready to redeem");
        assertEq(usdcAmount, 10e6);
    }

    // BUY CARBON CREDITS (buyer side)
    // Buyer with USDC buys 1 ton of CO2 from a farmer who processed 2500kg.
    // 2500kg * 400g = 1,000,000 g CO2e = exactly 1 metric ton.
    // Oracle price = 100 USD/ton, platform takes 2%.
    //   total = 100 USDC, fee = 2 USDC, farmer receives 98 USDC.
    function testBuyCarbonCreditsTransfersToFarmer() public {
        vm.startPrank(USER);
        harvestX.register();
        harvestX.processWaste(2500, WASTE_TYPE, WORKERS, PAYMENT_KES);
        vm.stopPrank();

        usdc.mint(BUYER, 1_000e6);
        vm.prank(BUYER);
        usdc.approve(address(harvestX), 1_000e6);

        uint256 buyerUSDCBefore = usdc.balanceOf(BUYER);

        vm.prank(BUYER);
        harvestX.buyCarbonCredits(USER, 100, 1_000e6); // 100 => 1.00 ton

        assertEq(usdc.balanceOf(BUYER), buyerUSDCBefore - 100e6);
        assertEq(usdc.balanceOf(USER), 98e6);
        assertEq(harvestX.getCorporatePurchases(BUYER), 1_000_000e18);
    }

    // Buying more credits than the farmer earned reverts.
    function testBuyCarbonCreditsRevertsInsufficientCredits() public {
        vm.startPrank(USER);
        harvestX.register();
        harvestX.processWaste(2500, WASTE_TYPE, WORKERS, PAYMENT_KES);
        vm.stopPrank();

        usdc.mint(BUYER, 1_000e6);
        vm.prank(BUYER);
        usdc.approve(address(harvestX), 1_000e6);

        // 200 => 2.00 tons, farmer only earned 1 ton.
        vm.expectRevert("Insufficient credits");
        vm.prank(BUYER);
        harvestX.buyCarbonCredits(USER, 200, 1_000e6);
    }

    // Under-paying the computed USDC price reverts.
    function testBuyCarbonCreditsRevertsInsufficientPayment() public {
        vm.startPrank(USER);
        harvestX.register();
        harvestX.processWaste(2500, WASTE_TYPE, WORKERS, PAYMENT_KES);
        vm.stopPrank();

        usdc.mint(BUYER, 1_000e6);
        vm.prank(BUYER);
        usdc.approve(address(harvestX), 1_000e6);

        // 1 ton costs 100 USDC; only approve/pay 50.
        vm.expectRevert("Insufficient USDC amount");
        vm.prank(BUYER);
        harvestX.buyCarbonCredits(USER, 100, 50e6);
    }

    // OWNER CONFIGURATION FUNCTIONS
    // Non-owners cannot change the minimum price.
    function testSetMinPriceRevertsForNonOwner() public {
        vm.expectRevert();
        vm.prank(BUYER);
        harvestX.setMinPricePerTon(200e8);
    }

    // Owner can update the minimum price per ton. Raising it above the oracle
    // price ($100) makes carbon credit purchases revert.
    function testSetMinPricePerTon() public {
        harvestX.setMinPricePerTon(200e8);

        vm.startPrank(USER);
        harvestX.register();
        harvestX.processWaste(2500, WASTE_TYPE, WORKERS, PAYMENT_KES);
        vm.stopPrank();

        usdc.mint(BUYER, 1_000e6);
        vm.prank(BUYER);
        usdc.approve(address(harvestX), 1_000e6);

        // oracle price is 100 USD/ton < new min of 200 => purchase blocked
        vm.expectRevert("Price below minimum");
        vm.prank(BUYER);
        harvestX.buyCarbonCredits(USER, 100, 1_000e6);
    }

    // Zero minimum price is rejected.
    function testSetMinPriceRevertsZero() public {
        vm.expectRevert("Price must be > 0");
        harvestX.setMinPricePerTon(0);
    }

    // Fee above 10% is rejected.
    function testSetPlatformFeeRevertsTooHigh() public {
        vm.expectRevert("Fee too high");
        harvestX.setPlatformFee(11);
    }

    // Owner can set a valid platform fee without reverting.
    function testSetPlatformFee() public {
        harvestX.setPlatformFee(5);
    }

    // Raising the fee reduces the farmer's share of a sale.
    function testHigherPlatformFeeReducesFarmerPayout() public {
        vm.prank(address(this));
        harvestX.setPlatformFee(10); // 10% platform fee

        vm.startPrank(USER);
        harvestX.register();
        harvestX.processWaste(2500, WASTE_TYPE, WORKERS, PAYMENT_KES);
        vm.stopPrank();

        usdc.mint(BUYER, 1_000e6);
        vm.prank(BUYER);
        usdc.approve(address(harvestX), 1_000e6);

        vm.prank(BUYER);
        harvestX.buyCarbonCredits(USER, 100, 1_000e6); // 1 ton = 100 USDC

        // 10% fee => farmer receives 90 USDC instead of 98.
        assertEq(usdc.balanceOf(USER), 90e6);
    }

    // Owner can swap the price oracle.
    function testUpdateOracle() public {
        MockPriceOracle newOracle = new MockPriceOracle();
        vm.prank(address(this));
        harvestX.updateOracle(address(newOracle));
        assertEq(address(harvestX.priceOracle()), address(newOracle));
    }

    // Updating oracle to the zero address is rejected.
    function testUpdateOracleRevertsZero() public {
        vm.expectRevert("Invalid address");
        harvestX.updateOracle(address(0));
    }

    // Owner can swap the USDC token (e.g. mock -> real across chains).
    function testUpdateUSDC() public {
        MockUSDC newUSDC = new MockUSDC();
        vm.prank(address(this));
        harvestX.updateUSDC(address(newUSDC));

        // interacting with the new USDC settles correctly
        newUSDC.mint(BUYER, 1_000e6);
        vm.prank(BUYER);
        newUSDC.approve(address(harvestX), 1_000e6);

        vm.startPrank(USER);
        harvestX.register();
        harvestX.processWaste(2500, WASTE_TYPE, WORKERS, PAYMENT_KES);
        vm.stopPrank();

        vm.prank(BUYER);
        harvestX.buyCarbonCredits(USER, 100, 1_000e6); // 1 ton = 100 mUSDC

        assertEq(newUSDC.balanceOf(USER), 98e6); // paid from the new USDC
        assertEq(newUSDC.balanceOf(address(harvestX)), 2e6); // platform fee
    }

    // Updating USDC to the zero address is rejected.
    function testUpdateUSDCRevertsZero() public {
        vm.expectRevert("Invalid address");
        harvestX.updateUSDC(address(0));
    }

    // Non-owners cannot change the USDC address.
    function testUpdateUSDCOnlyOwner() public {
        vm.expectRevert();
        vm.prank(BUYER);
        harvestX.updateUSDC(address(makeAddr("otherUSDC")));
    }

    // VIEW / HELPER FUNCTIONS
    // getImpact aggregates a farmer's waste, CO2, tokens, workers, payouts.
    function testGetImpact() public {
        vm.startPrank(USER);
        harvestX.register();
        harvestX.processWaste(WASTE_KG, WASTE_TYPE, WORKERS, PAYMENT_KES);
        vm.stopPrank();

        (
            uint256 wasteKg,
            uint256 productKg,
            uint256 co2Grams,
            uint256 co2Kg,
            uint256 tokens,
            uint256 workersPaid,
            uint256 totalPayoutKES
        ) = harvestX.getImpact(USER);

        assertEq(wasteKg, WASTE_KG);
        assertEq(productKg, 0);
        assertEq(co2Grams, WASTE_KG * 400e18);
        assertEq(co2Kg, (WASTE_KG * 400e18) / 1e18 / 1000);
        assertEq(tokens, 10e18);
        assertEq(workersPaid, WORKERS);
        assertEq(totalPayoutKES, PAYMENT_KES);
    }

    // getGlobalStats reflects global farm totals and circulating supply.
    function testGetGlobalStats() public {
        vm.startPrank(USER);
        harvestX.register();
        harvestX.processWaste(WASTE_KG, WASTE_TYPE, WORKERS, PAYMENT_KES);
        vm.stopPrank();

        (
            uint256 farmersCount,
            uint256 wasteKg,
            uint256 co2SavedKg,
            uint256 tokensCirculating,
            ,

        ) = harvestX.getGlobalStats();

        assertEq(farmersCount, 1);
        assertEq(wasteKg, WASTE_KG);
        assertEq(co2SavedKg, (WASTE_KG * 400e18) / 1e18 / 1000);
        // initial 1,000,000 HX + the 10 HX minted to USER
        assertEq(tokensCirculating, 1_000_000e18 + 10e18);
    }

    // getWastehistory returns the stored collection records.
    function testGetWasteHistory() public {
        vm.startPrank(USER);
        harvestX.register();
        harvestX.processWaste(WASTE_KG, WASTE_TYPE, WORKERS, PAYMENT_KES);
        vm.stopPrank();

        HarvestX.WasteCollection[] memory history = harvestX.getWastehistory(
            USER
        );
        assertEq(history.length, 1);
        assertEq(history[0].kgCollected, WASTE_KG);
        assertEq(history[0].workersInvolved, WORKERS);
        assertEq(history[0].workersPaymentKES, PAYMENT_KES);
        assertEq(history[0].wasteType, WASTE_TYPE);
    }

    // getWorkerPayments returns empty until worker payments are recorded.
    function testGetWorkerPayments() public view {
        HarvestX.WorkerPayment[] memory payments = harvestX.getWorkerPayments(
            USER
        );
        assertEq(payments.length, 0);
    }

    // calculatePriceInUSDC converts tons (hundredths) to USD and USDC.
    // 100 (1 ton) * 100 USD/ton = 10000 USD... /100 = 100 USD => 100 USDC.
    function testCalculatePriceInUSDC() public {
        (uint256 priceUSD, uint256 priceUSDC) = harvestX.calculatePriceInUSDC(
            100
        );
        assertEq(priceUSD, 100e8);
        assertEq(priceUSDC, 100e6);
    }

    // getAvailableCarbonCredits returns tons in hundredths.
    //   earned = (400e18 grams-per-kg * 2500 kg) = 1,000,000e18 = 1 metric ton => 100.
    function testGetAvailableCarbonCredits() public {
        vm.startPrank(USER);
        harvestX.register();
        harvestX.processWaste(2500, WASTE_TYPE, WORKERS, PAYMENT_KES);
        vm.stopPrank();

        (uint256 available, uint256 earned, uint256 sold, ) = harvestX
            .getAvailableCarbonCredits(USER);
        assertEq(available, 100); // 1.00 ton in hundredths
        assertEq(earned, 100);
        assertEq(sold, 0);
    }

    // PLATFORM FEES
    // Owner can withdraw accrued USDC platform fees from the contract.
    function testWithdrawPlatformFees() public {
        // seed the contract with USDC fees
        usdc.mint(address(harvestX), 100e6);

        uint256 ownerBalanceBefore = usdc.balanceOf(address(this));

        vm.prank(address(this));
        harvestX.withdrawPlatformFees(100e6);

        assertEq(usdc.balanceOf(address(this)), ownerBalanceBefore + 100e6);
        assertEq(usdc.balanceOf(address(harvestX)), 0);
    }

    // Withdrawing more than contract reserves reverts.
    function testWithdrawPlatformFeesRevertsInsufficient() public {
        usdc.mint(address(harvestX), 10e6);
        vm.expectRevert("Insufficient funds");
        harvestX.withdrawPlatformFees(20e6);
    }
}

// HARVESTXTOKEN - TOKEN CONTRACT UNIT TEST
// Covers minting (owner only), self-redeem burning, and owner burnFrom,
// including all revert guards.
contract HarvestXTokenTest is Test {
    HarvestXToken token;

    address public OWNER = address(this);
    address public USER = makeAddr("user");

    function setUp() external {
        token = new HarvestXToken(); // owner = this test contract
    }

    // The deployer receives the initial 1,000,000 HX supply.
    function testInitialSupplyMintedToOwner() public {
        assertEq(token.balanceOf(OWNER), 1_000_000e18);
        assertEq(token.totalSupply(), 1_000_000e18);
    }

    // Only the owner can mint new tokens.
    function testMintOnlyOwner() public {
        vm.prank(OWNER);
        token.mint(USER, 100e18);
        assertEq(token.balanceOf(USER), 100e18);
    }

    // Non-owner mint is rejected.
    function testMintRevertsForNonOwner() public {
        vm.expectRevert();
        vm.prank(USER);
        token.mint(USER, 100e18);
    }

    // Minting zero or to the zero address reverts.
    function testMintRevertsInvalidArgs() public {
        vm.expectRevert("Insufficient Amount!");
        token.mint(USER, 0);
        vm.expectRevert("Zero address!");
        token.mint(address(0), 100e18);
    }

    // A holder can burn their own tokens via redeem.
    function testRedeemBurnsTokens() public {
        token.mint(USER, 100e18);
        vm.prank(USER);
        token.redeem(40e18);
        assertEq(token.balanceOf(USER), 60e18);
        assertEq(token.totalSupply(), 1_000_000e18 + 60e18);
    }

    // Redeeming more than balance reverts.
    function testRedeemRevertsInsufficientBalance() public {
        vm.expectRevert("Insufficient balance");
        vm.prank(USER);
        token.redeem(1e18);
    }

    // Redeeming zero reverts.
    function testRedeemRevertsZero() public {
        vm.expectRevert("Amount must be > 0");
        vm.prank(USER);
        token.redeem(0);
    }

    // Owner can burn from any account (used by HarvestX on redemption).
    function testBurnFrom() public {
        token.mint(USER, 100e18);
        vm.prank(OWNER);
        token.burnFrom(USER, 30e18);
        assertEq(token.balanceOf(USER), 70e18);
    }

    // Non-owner cannot burnFrom.
    function testBurnFromRevertsForNonOwner() public {
        token.mint(USER, 100e18);
        vm.expectRevert();
        vm.prank(USER);
        token.burnFrom(USER, 30e18);
    }
}

// MOCK CONTRACT UNIT TESTS
// Covers the oracle mock (price reads/updates) and the USDC mock
// (decimals, faucet, refill, owner mint).
contract MockContractTest is Test {
    MockPriceOracle priceOracle;
    MockUSDC usdc;

    address public USER = makeAddr("user");

    function setUp() external {
        priceOracle = new MockPriceOracle();
        usdc = new MockUSDC();
    }

    // Default carbon credit price is $100 (1e8 precision).
    function testOracleDefaultPrice() public view {
        assertEq(priceOracle.getCarbonCreditPricePerTon(), 100e8);
    }

    // Owner can update the oracle price and it is readable back.
    function testOracleSetPrice() public {
        priceOracle.setCarbonCreditPricePerTon(250e8);
        assertEq(priceOracle.getCarbonCreditPricePerTon(), 250e8);
    }

    // USDC mock uses 6 decimals like real USDC.
    function testUSDCDecimals() public view {
        assertEq(usdc.decimals(), 6);
    }

    // quickFaucet hands anyone 10,000 USDC from the contract's reserves.
    function testQuickFaucet() public {
        uint256 balanceBefore = usdc.balanceOf(USER);
        vm.prank(USER);
        usdc.quickFaucet();
        assertEq(usdc.balanceOf(USER), balanceBefore + 10_000e6);
    }

    // Owner can refill the faucet reserves.
    function testRefillFaucet() public {
        usdc.refillFaucet(50_000e6);
        assertEq(usdc.balanceOf(address(usdc)), 1_000_000e6 + 50_000e6);
    }

    // Non-owner mint is rejected.
    function testUSDCMintOnlyOwner() public {
        vm.expectRevert();
        vm.prank(USER);
        usdc.mint(USER, 100e6);
    }
}
