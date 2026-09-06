// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";

import {PairPadFeeEscrow} from "../src/v2/PairPadFeeEscrow.sol";
import {ViralRewardVault} from "../src/viral/ViralRewardVault.sol";
import {ViralFeeSplitter, IViralCreatorEscrow, IViralRewardFunder} from "../src/viral/ViralFeeSplitter.sol";
import {ViralTreasuryVault} from "../src/viral/ViralTreasuryVault.sol";
import {MockERC20, MockFeeOnTransferERC20} from "./mocks/MockERC20.sol";

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

    function testTinyNativeAmountDoesNotRevertWhenProtocolSharesRoundToZero() external {
        splitter.splitNative{value: 1}(creator, 100, 0);

        assertEq(escrow.balanceOf(creator), 1);
        assertEq(address(operations).balance, 0);
        assertEq(address(buyback).balance, 0);
    }

    function testTinyTokenAmountDoesNotRevertWhenProtocolSharesRoundToZero() external {
        token.mint(address(this), 1);
        token.approve(address(splitter), 1);
        splitter.splitToken(creator, address(token), 1, 100, 0);

        assertEq(escrow.balanceOfToken(creator, address(token)), 1);
        assertEq(token.balanceOf(address(splitter)), 0);
    }

    function testRejectsFeeOnTransferAssetBeforeCreatingClaims() external {
        MockFeeOnTransferERC20 taxedToken = new MockFeeOnTransferERC20();
        taxedToken.mint(address(this), 100 ether);
        taxedToken.approve(address(splitter), 100 ether);

        vm.expectRevert(
            abi.encodeWithSelector(ViralFeeSplitter.InexactTransfer.selector, address(taxedToken), 100 ether, 99 ether)
        );
        splitter.splitToken(creator, address(taxedToken), 100 ether, 100, 0);

        assertEq(escrow.balanceOfToken(creator, address(taxedToken)), 0);
        assertEq(taxedToken.balanceOf(address(splitter)), 0);
    }

    function testFuzzPreviewAlwaysConserves(uint128 rawAmount, uint16 rawBaseFeeBps, uint16 rawCreatorFeeBps)
        external
        view
    {
        uint256 amount = bound(uint256(rawAmount), 1, type(uint128).max);
        uint16 baseFeeBps = uint16(bound(uint256(rawBaseFeeBps), 1, 1_000));
        uint16 creatorFeeBps = uint16(bound(uint256(rawCreatorFeeBps), 0, 1_000));

        (uint256 creatorAmount, uint256 rewardsAmount, uint256 operationsAmount, uint256 buybackAmount) =
            splitter.preview(amount, baseFeeBps, creatorFeeBps);

        assertEq(creatorAmount + rewardsAmount + operationsAmount + buybackAmount, amount);
        assertGe(creatorAmount, rewardsAmount + operationsAmount + buybackAmount);
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
