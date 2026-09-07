// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";

import {PairPadLaunchFactory} from "../src/v2/PairPadLaunchFactory.sol";
import {ISwapRouter02, IWETH9, PairPadRouter} from "../src/v2/PairPadRouter.sol";
import {TestnetEthQuoteAdapter, TestnetWrappedEther} from "../src/testnet/TestnetEthQuoteAdapter.sol";

interface ITestnetMintable {
    function mint(address to, uint256 amount) external;
}

/**
 * @notice Replaces the reverting Robinhood-testnet swap stub with a
 * collateralized ETH/quote adapter and a new PairPadRouter. The factory and
 * every existing launch pool stay in place; only the trusted launch forwarder
 * changes.
 *
 * This script is testnet-only. Mainnet must use canonical WETH and a real
 * Uniswap SwapRouter02 with market-derived routes.
 */
contract DeployTestnetEthRoutes is Script {
    uint24 private constant TESTNET_ROUTE_FEE = 500;

    function run() external {
        require(block.chainid == 46630, "Robinhood testnet only");

        uint256 key = vm.envUint("PRIVATE_KEY");
        address owner = vm.addr(key);
        PairPadLaunchFactory factory = PairPadLaunchFactory(payable(vm.envAddress("FACTORY")));
        address usdg = vm.envAddress("USDG");
        address rwa = vm.envAddress("RWA_TOKEN");
        uint256 seedEth = vm.envOr("ADAPTER_SEED_ETH_WEI", uint256(0.005 ether));
        uint256 seedUsdg = vm.envOr("ADAPTER_SEED_USDG", uint256(225_000_000));
        uint256 seedRwa = vm.envOr("ADAPTER_SEED_RWA", uint256(1 ether));

        require(factory.owner() == owner, "signer is not factory owner");
        require(seedEth != 0 && seedUsdg != 0 && seedRwa != 0, "empty reserve");
        require(owner.balance > seedEth, "insufficient test ETH");
        require(IERC20(rwa).balanceOf(owner) >= seedRwa, "insufficient test RWA");

        vm.startBroadcast(key);

        TestnetWrappedEther weth = new TestnetWrappedEther();
        TestnetEthQuoteAdapter adapter = new TestnetEthQuoteAdapter(owner, weth);

        // Deterministic test-only rates: 1 ETH = 4,500 USDG = 18 TSLA.
        adapter.setRate(address(weth), usdg, uint128(4_500e6), uint128(1 ether));
        adapter.setRate(usdg, address(weth), uint128(1 ether), uint128(4_500e6));
        adapter.setRate(address(weth), rwa, uint128(18 ether), uint128(1 ether));
        adapter.setRate(rwa, address(weth), uint128(1 ether), uint128(18 ether));

        ITestnetMintable(usdg).mint(address(adapter), seedUsdg);
        IERC20(rwa).transfer(address(adapter), seedRwa);
        weth.deposit{value: seedEth}();
        weth.transfer(address(adapter), seedEth);

        PairPadRouter router = new PairPadRouter(
            IPoolManager(address(factory.poolManager())),
            factory,
            ISwapRouter02(address(adapter)),
            IWETH9(address(weth))
        );
        factory.setLaunchForwarder(address(router));

        vm.stopBroadcast();

        console2.log("Testnet wrapped ETH:   ", address(weth));
        console2.log("ETH/quote adapter:    ", address(adapter));
        console2.log("Upgraded PairPadRouter:", address(router));
        console2.log("Route fee marker:     ", TESTNET_ROUTE_FEE);
        console2.log("Seeded native reserve:", seedEth);
        console2.log("Seeded USDG reserve:  ", seedUsdg);
        console2.log("Seeded RWA reserve:   ", seedRwa);
    }
}
