// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";

import {PairPadFeeEscrow} from "../src/v2/PairPadFeeEscrow.sol";
import {ViralRewardVault} from "../src/viral/ViralRewardVault.sol";
import {ViralFeeSplitter, IViralCreatorEscrow, IViralRewardFunder} from "../src/viral/ViralFeeSplitter.sol";
import {ViralTreasuryVault} from "../src/viral/ViralTreasuryVault.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract ViralFeeSplitterTest is Test {
    address internal creator = address(0xC0FFEE);
    address internal outsider = address(0xBAD);

    PairPadFeeEscrow internal escrow;
    ViralRewardVault internal rewards;
    ViralTreasuryVault internal operations;
    ViralTreasuryVault internal buyback;
    ViralFeeSplitter internal splitter;
    MockERC20 internal token;

    function setUp() external {
        escrow = new PairPadFeeEscrow();
        rewards = new ViralRewardVault(address(this), address(this), address(this));
        operations = new ViralTreasuryVault(address(this));
        buyback = new ViralTreasuryVault(address(this));
        splitter = new ViralFeeSplitter(
            address(this),
            IViralCreatorEscrow(address(escrow)),
            IViralRewardFunder(address(rewards)),
            address(operations),
            address(buyback)
        );
        splitter.setLocker(address(this));
        rewards.setFunder(address(splitter));
        token = new MockERC20("Quote", "QUOTE", 18);
        vm.deal(address(this), 100 ether);
    }

    function testSplitNativeWithTwoPercentCreatorFee() external {
        splitter.splitNative{value: 3 ether}(creator, 100, 200);

        assertEq(escrow.balanceOf(creator), 2.5 ether);
        assertEq(rewards.epochFunding(rewards.currentEpoch(), address(0)), 0.2 ether);
        assertEq(address(operations).balance, 0.1 ether);
        assertEq(address(buyback).balance, 0.2 ether);
        assertEq(address(splitter).balance, 0);
    }

    function testSplitTokenWithTwoPercentCreatorFee() external {
        token.mint(address(this), 3 ether);
        token.approve(address(splitter), 3 ether);
        splitter.splitToken(creator, address(token), 3 ether, 100, 200);

        assertEq(escrow.balanceOfToken(creator, address(token)), 2.5 ether);
        assertEq(rewards.epochFunding(rewards.currentEpoch(), address(token)), 0.2 ether);
        assertEq(token.balanceOf(address(operations)), 0.1 ether);
        assertEq(token.balanceOf(address(buyback)), 0.2 ether);
        assertEq(token.balanceOf(address(splitter)), 0);
    }

    function testRoundingAlwaysConservesFullAmount() external view {
        (uint256 creatorAmount, uint256 rewardsAmount, uint256 operationsAmount, uint256 buybackAmount) =
            splitter.preview(101, 100, 0);

        assertEq(creatorAmount, 51);
        assertEq(rewardsAmount, 20);
        assertEq(operationsAmount, 10);
        assertEq(buybackAmount, 20);
        assertEq(creatorAmount + rewardsAmount + operationsAmount + buybackAmount, 101);
    }

    function testOnlyLockerMaySplit() external {
        vm.deal(outsider, 1 ether);
        vm.prank(outsider);
        vm.expectRevert(ViralFeeSplitter.NotLocker.selector);
        splitter.splitNative{value: 1 ether}(creator, 100, 0);
    }

    function testLockerCanOnlyBeSetOnce() external {
        vm.expectRevert(ViralFeeSplitter.LockerAlreadySet.selector);
        splitter.setLocker(address(0x1234));
    }
}
