//SPDX-License-Identifier:MIT
pragma solidity 0.8.20;

import {Test} from "forge-std/Test.sol";
import {HarvestX} from "../../src/HarvestX.sol";
import {HarvestXToken} from "../../src/HarvestXToken.sol";
import {MockUSDC} from "../mocks/MockUSDC.sol";
import {MockPriceOracle} from "../mocks/MockPriceOracle.sol";

/// Proves the broken require at HarvestX.sol:366 (18dp HX balance compared
/// against a 6dp usdcAmount) is NOT exploitable, because
/// HarvestXToken.burnFrom re-checks the balance with the correct 18dp amount.
contract RedeemInvariantTest is Test {
    HarvestX harvestX;
    HarvestXToken hxToken;
    MockUSDC usdc;

    address farmer = address(0xBEEF);
    address owner = address(this);

    function setUp() public {
        hxToken = new HarvestXToken();
        usdc = new MockUSDC();
        harvestX = new HarvestX(
            address(hxToken),
            address(new MockPriceOracle()),
            address(usdc)
        );
        hxToken.transferOwnership(address(harvestX));
    }

    function _registerVerifyAndMint() private {
        vm.startPrank(farmer);
        harvestX.register();
        harvestX.processWaste(100, "Organics", 5, 500);
        vm.stopPrank();

        harvestX.verifyFarmer(farmer);
    }

    /// A farmer holding dust HX passes the broken require at :366
    /// (1e12 >= 1e6) yet cannot redeem, because burnFrom enforces the
    /// correct 18dp check. The whole tx reverts; no USDC leaves the contract.
    function test_dustBalanceCannotRedeem() public {
        _registerVerifyAndMint();

        // Burn the farmer down to dust: 1e12 wei = 0.000001 HX
        uint256 dust = 1e12;
        uint256 bal = hxToken.balanceOf(farmer);
        vm.prank(farmer);
        hxToken.transfer(owner, bal - dust);
        assertEq(hxToken.balanceOf(farmer), dust);

        usdc.mint(address(harvestX), 1_000e6);
        uint256 reserveBefore = usdc.balanceOf(address(harvestX));

        // 1e12 >= 1e6, so the broken require at :366 would let this through...
        uint256 usdcAmount = (1e18 * 1e6) / 1e18;
        assertGt(usdcAmount, 0);
        assertGe(dust, usdcAmount);

        // ...but burnFrom requires balanceOf(account) >= 1e18 and reverts.
        vm.expectRevert("Insufficient balance");
        vm.prank(farmer);
        harvestX.redeemHxForStablecoin(1e18);

        // Nothing was paid out and the balance is untouched.
        assertEq(usdc.balanceOf(address(harvestX)), reserveBefore);
        assertEq(hxToken.balanceOf(farmer), dust);
    }

    /// A farmer with a comfortable balance redeems normally, so the guard
    /// above is not blocking legitimate use.
    function test_normalRedemptionStillWorks() public {
        _registerVerifyAndMint();
        usdc.mint(address(harvestX), 1_000e6);

        uint256 bal = hxToken.balanceOf(farmer);
        assertGt(bal, 0);

        vm.prank(farmer);
        harvestX.redeemHxForStablecoin(bal);

        assertEq(hxToken.balanceOf(farmer), 0);
        assertEq(usdc.balanceOf(farmer), bal / 1e12);
    }

    /// The payout equals the quoted amount exactly (1 HX -> 1 USDC).
    function test_redemptionMatchesQuote() public {
        _registerVerifyAndMint();
        usdc.mint(address(harvestX), 1_000e6);

        vm.prank(farmer);
        (
            bool can,
            string memory reason,
            uint256 usdcAmount,
            ,
            ,
            ,
            
        ) = harvestX.checkRedemptionStatus(10e18);
        assertTrue(can);
        assertEq(reason, "Ready to redeem");
        assertEq(usdcAmount, 10e6);

        vm.prank(farmer);
        harvestX.redeemHxForStablecoin(10e18);
        assertEq(usdc.balanceOf(farmer), 10e6);
    }
}
