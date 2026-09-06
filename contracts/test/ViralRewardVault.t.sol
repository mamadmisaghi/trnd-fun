// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";

import {ViralRewardVault} from "../src/viral/ViralRewardVault.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract ViralRewardVaultTest is Test {
    ViralRewardVault internal vault;
    MockERC20 internal token;

    address internal funder = makeAddr("funder");
    address internal distributor = makeAddr("distributor");
    address[5] internal winners;

    function setUp() public {
        vault = new ViralRewardVault(address(this), funder, distributor);
        token = new MockERC20("Quote", "QUOTE", 18);
        winners = [makeAddr("first"), makeAddr("second"), makeAddr("third"), makeAddr("fourth"), makeAddr("fifth")];
        vm.deal(funder, 100 ether);
        token.mint(funder, 100 ether);
    }

    function test_nativeEpochUsesConfiguredWeightsAndClaims() public {
        uint256 epochId = vault.currentEpoch();
        vm.prank(funder);
        vault.fundCurrentEpoch{value: 10 ether}();

        vm.warp(block.timestamp + 1 days);
        vm.prank(distributor);
        uint256[5] memory amounts = vault.finalizeEpoch(epochId, address(0), winners);

        assertEq(amounts[0], 4 ether);
        assertEq(amounts[1], 2.5 ether);
        assertEq(amounts[2], 1.5 ether);
        assertEq(amounts[3], 1.2 ether);
        assertEq(amounts[4], 0.8 ether);

        vm.prank(winners[0]);
        vault.claim(address(0));
        assertEq(winners[0].balance, 4 ether);
    }

    function test_tokenEpochConservesRoundingAndClaims() public {
        uint256 epochId = vault.currentEpoch();
        vm.startPrank(funder);
        token.approve(address(vault), type(uint256).max);
        vault.fundCurrentEpochToken(address(token), 101);
        vm.stopPrank();

        vm.warp(block.timestamp + 1 days);
        vm.prank(distributor);
        uint256[5] memory amounts = vault.finalizeEpoch(epochId, address(token), winners);

        uint256 total;
        for (uint256 i; i < 5; ++i) {
            total += amounts[i];
        }
        assertEq(total, 101);

        vm.prank(winners[4]);
        vault.claim(address(token));
        assertEq(token.balanceOf(winners[4]), amounts[4]);
    }

    function test_cannotFinalizeCurrentEpoch() public {
        uint256 epochId = vault.currentEpoch();
        vm.prank(funder);
        vault.fundCurrentEpoch{value: 1 ether}();

        vm.prank(distributor);
        vm.expectRevert(abi.encodeWithSelector(ViralRewardVault.EpochNotEnded.selector, epochId, epochId));
        vault.finalizeEpoch(epochId, address(0), winners);
    }

    function test_cannotFinalizeCurrencyTwice() public {
        uint256 epochId = vault.currentEpoch();
        vm.prank(funder);
        vault.fundCurrentEpoch{value: 1 ether}();
        vm.warp(block.timestamp + 1 days);

        vm.startPrank(distributor);
        vault.finalizeEpoch(epochId, address(0), winners);
        vm.expectRevert(abi.encodeWithSelector(ViralRewardVault.EpochAlreadyFinalized.selector, epochId, address(0)));
        vault.finalizeEpoch(epochId, address(0), winners);
        vm.stopPrank();
    }

    function test_rejectsDuplicateWinner() public {
        uint256 epochId = vault.currentEpoch();
        vm.prank(funder);
        vault.fundCurrentEpoch{value: 1 ether}();
        vm.warp(block.timestamp + 1 days);

        winners[4] = winners[0];
        vm.prank(distributor);
        vm.expectRevert(abi.encodeWithSelector(ViralRewardVault.DuplicateRecipient.selector, winners[0]));
        vault.finalizeEpoch(epochId, address(0), winners);
    }

    function test_onlyAuthorizedRolesCanFundOrFinalize() public {
        vm.expectRevert(ViralRewardVault.NotFunder.selector);
        vault.fundCurrentEpoch{value: 1 ether}();

        vm.expectRevert(ViralRewardVault.NotDistributor.selector);
        vault.finalizeEpoch(0, address(0), winners);
    }
}
