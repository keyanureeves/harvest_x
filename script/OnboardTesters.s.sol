//SPDX-License-Identifier:MIT
pragma solidity 0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {HarvestX} from "../src/HarvestX.sol";

/// @notice Onboards demo testers in a single run so they never need the owner.
/// @dev Reads a CSV of `address,privateKey` lines (see GenerateDemoWallets.sh)
///      and, per tester, sends up to three transactions, in this order:
///
///        1. ETH top-up            from the OWNER key    -> so they can pay gas
///        2. `register()`          from the TESTER's key  -> so they can farm
///        3. `verifyFarmer(tester)`from the OWNER key    -> so they can redeem
///
///      The top-up must come first: register() is signed by the tester, so it
///      cannot be mined until they hold gas. verifyFarmer must come after
///      register() because the contract rejects unregistered farmers.
///
///      Steps are skipped when already satisfied (checked with view calls
///      first), so re-running after a partial failure is safe and cheap.
///
///      Run with the owner's key:
///        forge script script/OnboardTesters.s.sol:OnboardTesters \
///          --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY \
///          --broadcast $HARVESTX_SEPOLIA demo-testers.keys.csv 0.05ether
contract OnboardTesters is Script {
    struct Tester {
        address account;
        uint256 privateKey;
    }

    /// @notice Skip a tester whose native balance is already at or above this.
    uint256 internal constant SKIP_FUND_THRESHOLD = 0.001 ether;

    function parseTesters(string memory _csv) public returns (Tester[] memory testers) {
        string[] memory lines = vm.split(vm.readFile(_csv), "\n");

        uint256 count;
        for (uint256 i = 0; i < lines.length; i++) {
            if (_isRow(lines[i])) count++;
        }
        require(count > 0, "no testers found in CSV");

        testers = new Tester[](count);
        uint256 filled;
        for (uint256 i = 0; i < lines.length; i++) {
            if (!_isRow(lines[i])) continue;

            string[] memory fields = vm.split(_trim(lines[i]), ",");
            require(fields.length == 2, "bad CSV row, want address,privateKey");
            require(bytes(fields[1]).length == 66, "private key must be 32 bytes hex");

            testers[filled].account = vm.parseAddress(_trim(fields[0]));
            testers[filled].privateKey = vm.parseUint(_trim(fields[1]));
            require(testers[filled].privateKey != 0, "private key is zero");
            require(testers[filled].account != address(0), "tester address is zero");
            filled++;
        }
    }

    function run(address _harvestX, string calldata _testersCsv, uint256 _gasTopUpWei) external {
        require(_harvestX != address(0), "HarvestX address is zero");
        require(_gasTopUpWei > 0, "top-up must be > 0");

        HarvestX harvestX = HarvestX(_harvestX);
        address owner = harvestX.owner();
        Tester[] memory testers = parseTesters(_testersCsv);

        console.log("HarvestX   ", _harvestX);
        console.log("owner      ", owner);
        console.log("testers    ", testers.length);
        console.log("gas top-up ", _gasTopUpWei);
        console.log("");

        for (uint256 i = 0; i < testers.length; i++) {
            _onboard(harvestX, owner, testers[i], _gasTopUpWei);
        }

        console.log("");
        console.log("done - hand each tester their address + private key");
    }

    function _onboard(HarvestX _harvestX, address _owner, Tester memory _t, uint256 _gasTopUpWei) internal {
        // Never onboard the owner: that key controls the whole deployment and
        // must never be handed to a tester.
        require(_t.account != _owner, "refusing to onboard the contract owner");
        require(_t.account != address(0), "tester address is zero");

        (bool isRegistered,,,,,) = _harvestX.farmers(_t.account);
        bool isVerified = _harvestX.verifiedFarmers(_t.account);
        uint256 balance = _t.account.balance;
        bool needsFund = balance < SKIP_FUND_THRESHOLD;

        if (isRegistered && isVerified && !needsFund) {
            console.log("skip       ", _t.account, "(already onboarded)");
            return;
        }

        // Fund before register(): register() is signed by the tester, so they
        // need gas in hand before their own transaction can be mined.
        if (needsFund) {
            vm.broadcast();
            (bool ok,) = payable(_t.account).call{value: _gasTopUpWei}("");
            require(ok, "ETH top-up failed");
            console.log("funded     ", _t.account, _gasTopUpWei);
        }

        if (!isRegistered) {
            vm.broadcast(_t.privateKey);
            _harvestX.register();
            console.log("registered ", _t.account);
        }

        // verifyFarmer requires isRegistered, so it must follow register in the
        // same run when both are pending.
        if (!isVerified) {
            vm.broadcast();
            _harvestX.verifyFarmer(_t.account);
            console.log("verified   ", _t.account);
        }

        console.log("  ready    ", _t.account);
    }

    function _isRow(string memory _line) internal pure returns (bool) {
        string memory line = _trim(_line);
        return bytes(line).length != 0 && bytes(line)[0] != "#";
    }

    function _trim(string memory _s) internal pure returns (string memory) {
        bytes memory b = bytes(_s);
        uint256 start;
        while (start < b.length && _isSpace(b[start])) start++;
        uint256 end = b.length;
        while (end > start && _isSpace(b[end - 1])) end--;

        bytes memory out = new bytes(end - start);
        for (uint256 i = 0; i < out.length; i++) {
            out[i] = b[start + i];
        }
        return string(out);
    }

    function _isSpace(bytes1 _c) internal pure returns (bool) {
        return _c == 0x20 || _c == 0x09 || _c == 0x0a || _c == 0x0d;
    }
}
