// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";

import {ViralPairRegistry} from "../src/viral/ViralPairRegistry.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract ViralPairRegistryTest is Test {
    ViralPairRegistry internal registry;
    MockERC20 internal stock;

    function setUp() external {
        registry = new ViralPairRegistry(address(this));
        stock = new MockERC20("Test NVIDIA", "NVDA", 18);
    }

    function testRegistersNativeAndStockPairs() external {
        registry.setPair(address(0), ViralPairRegistry.PairType.NATIVE, 18, true);
        registry.setPair(address(stock), ViralPairRegistry.PairType.STOCK, 18, true);

        assertTrue(registry.isEnabled(address(0)));
        assertTrue(registry.isEnabled(address(stock)));
        assertEq(registry.configVersion(), 2);

        ViralPairRegistry.PairAsset memory config = registry.getPair(address(stock));
        assertTrue(config.registered);
        assertTrue(config.enabled);
        assertEq(uint8(config.pairType), uint8(ViralPairRegistry.PairType.STOCK));
        assertEq(config.decimals, 18);
    }

    function testCanDisableWithoutRemovingHistory() external {
        registry.setPair(address(stock), ViralPairRegistry.PairType.STOCK, 18, true);
        registry.setPair(address(stock), ViralPairRegistry.PairType.STOCK, 18, false);

        assertFalse(registry.isEnabled(address(stock)));
        ViralPairRegistry.PairAsset memory config = registry.getPair(address(stock));
        assertTrue(config.registered);
        assertEq(config.configVersion, 2);
    }

    function testRejectsInvalidNativeAndTokenConfiguration() external {
        vm.expectRevert(ViralPairRegistry.InvalidNativeConfig.selector);
        registry.setPair(address(0), ViralPairRegistry.PairType.STOCK, 18, true);

        vm.expectRevert(ViralPairRegistry.InvalidTokenConfig.selector);
        registry.setPair(address(stock), ViralPairRegistry.PairType.NATIVE, 18, true);

        vm.expectRevert(ViralPairRegistry.InvalidTokenConfig.selector);
        registry.setPair(address(0xBEEF), ViralPairRegistry.PairType.STOCK, 18, true);
    }
}
