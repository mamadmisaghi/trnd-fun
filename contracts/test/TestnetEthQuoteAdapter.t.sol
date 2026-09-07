// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {TestnetEthQuoteAdapter, TestnetWrappedEther} from "../src/testnet/TestnetEthQuoteAdapter.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract TestnetEthQuoteAdapterTest is Test {
    TestnetWrappedEther internal weth;
    TestnetEthQuoteAdapter internal adapter;
    MockERC20 internal usdg;
    address internal trader = makeAddr("trader");

    function setUp() public {
        weth = new TestnetWrappedEther();
        adapter = new TestnetEthQuoteAdapter(address(this), weth);
        usdg = new MockERC20("Test USDG", "USDG", 6);

        adapter.setRate(address(weth), address(usdg), uint128(4_500e6), uint128(1 ether));
        adapter.setRate(address(usdg), address(weth), uint128(1 ether), uint128(4_500e6));
        usdg.mint(address(adapter), 45_000e6);
        vm.deal(address(this), 10 ether);
        weth.deposit{value: 5 ether}();
        weth.transfer(address(adapter), 5 ether);
        vm.deal(trader, 2 ether);
    }

    function test_nativeEthToQuoteAndBackUsesFundedReserves() public {
        bytes memory buyPath = abi.encodePacked(address(weth), uint24(500), address(usdg));
        vm.prank(trader);
        uint256 usdgOut = adapter.exactInput{value: 1 ether}(
            TestnetEthQuoteAdapter.ExactInputParams(buyPath, trader, 1 ether, 4_500e6)
        );
        assertEq(usdgOut, 4_500e6);
        assertEq(usdg.balanceOf(trader), 4_500e6);
        assertEq(weth.balanceOf(address(adapter)), 6 ether, "native input is wrapped into reserve");

        vm.startPrank(trader);
        usdg.approve(address(adapter), usdgOut);
        uint256 wethOut = adapter.exactInput(
            TestnetEthQuoteAdapter.ExactInputParams(
                abi.encodePacked(address(usdg), uint24(500), address(weth)), trader, usdgOut, 1 ether
            )
        );
        vm.stopPrank();
        assertEq(wethOut, 1 ether);
        assertEq(weth.balanceOf(trader), 1 ether);
        assertEq(usdg.balanceOf(address(adapter)), 45_000e6);
    }

    function test_rejectsSlippageAndBadNativeValue() public {
        bytes memory path = abi.encodePacked(address(weth), uint24(500), address(usdg));
        vm.prank(trader);
        vm.expectRevert(TestnetEthQuoteAdapter.NativeValueMismatch.selector);
        adapter.exactInput{value: 0.5 ether}(
            TestnetEthQuoteAdapter.ExactInputParams(path, trader, 1 ether, 0)
        );

        vm.prank(trader);
        vm.expectRevert(
            abi.encodeWithSelector(TestnetEthQuoteAdapter.SlippageExceeded.selector, 4_500e6, 4_501e6)
        );
        adapter.exactInput{value: 1 ether}(
            TestnetEthQuoteAdapter.ExactInputParams(path, trader, 1 ether, 4_501e6)
        );
    }

    function test_onlyOwnerConfiguresRatesAndPauseStopsTrading() public {
        vm.prank(trader);
        vm.expectRevert();
        adapter.setRate(address(weth), address(usdg), 1, 1);

        adapter.setPaused(true);
        vm.prank(trader);
        vm.expectRevert(TestnetEthQuoteAdapter.AdapterPaused.selector);
        adapter.exactInput{value: 1 ether}(
            TestnetEthQuoteAdapter.ExactInputParams(
                abi.encodePacked(address(weth), uint24(500), address(usdg)), trader, 1 ether, 0
            )
        );
    }

    function test_rejectsUnsupportedOrUnconfiguredPaths() public {
        vm.prank(trader);
        vm.expectRevert(TestnetEthQuoteAdapter.UnsupportedPath.selector);
        adapter.exactInput{value: 1 ether}(
            TestnetEthQuoteAdapter.ExactInputParams(hex"01", trader, 1 ether, 0)
        );

        MockERC20 other = new MockERC20("Other", "OTHER", 18);
        bytes memory path = abi.encodePacked(address(weth), uint24(500), address(other));
        vm.prank(trader);
        vm.expectRevert(
            abi.encodeWithSelector(TestnetEthQuoteAdapter.RateNotConfigured.selector, address(weth), address(other))
        );
        adapter.exactInput{value: 1 ether}(
            TestnetEthQuoteAdapter.ExactInputParams(path, trader, 1 ether, 0)
        );
    }
}
