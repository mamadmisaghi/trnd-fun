// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId} from "@uniswap/v4-core/src/types/PoolId.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";

import {ViralPairRegistry} from "../src/viral/ViralPairRegistry.sol";
import {PairPadLaunchFactory} from "../src/v2/PairPadLaunchFactory.sol";
import {PairPadLaunchLocker} from "../src/v2/PairPadLaunchLocker.sol";
import {PairPadFeeEscrow} from "../src/v2/PairPadFeeEscrow.sol";
import {PairPadRouter} from "../src/v2/PairPadRouter.sol";
import {PairPadLauncherToken} from "../src/v2/PairPadLauncherToken.sol";

interface ITestMintableToken {
    function mint(address to, uint256 amount) external;
}

/// @notice Enables deterministic USDG and TSLA quote markets on the deployed
/// Robinhood testnet stack, then executes a complete quote-token lifecycle for
/// each pair: launch + creator buy, second buy, sell, collect and claim.
contract ConfigureTestnetPairs is Script {
    uint256 private constant USDG_PHANTOM = 6_100_650_000; // 6,100.65 test USDG
    uint256 private constant TSLA_PHANTOM = 10 ether; // deterministic testnet-only opening reserve

    function run() external {
        uint256 key = vm.envUint("PRIVATE_KEY");
        address owner = vm.addr(key);
        PairPadLaunchFactory factory = PairPadLaunchFactory(payable(vm.envAddress("FACTORY")));
        PairPadRouter router = PairPadRouter(payable(vm.envAddress("ROUTER")));
        ViralPairRegistry registry = ViralPairRegistry(vm.envAddress("PAIR_REGISTRY"));
        address usdg = vm.envAddress("USDG");
        address rwa = vm.envAddress("RWA_TOKEN");

        require(block.chainid == 46630, "Robinhood testnet only");
        require(factory.owner() == owner && registry.owner() == owner, "signer is not protocol owner");
        require(IERC20(rwa).balanceOf(owner) >= 2 ether, "insufficient faucet RWA balance");

        vm.startBroadcast(key);
        registry.setPair(usdg, ViralPairRegistry.PairType.STABLE, 6, true);
        factory.setPairTokenEconomics(usdg, USDG_PHANTOM, 6);
        registry.setPair(rwa, ViralPairRegistry.PairType.STOCK, 18, true);
        factory.setPairTokenEconomics(rwa, TSLA_PHANTOM, 18);

        ITestMintableToken(usdg).mint(owner, 1_000_000_000); // 1,000 test USDG
        _exercisePair(factory, router, owner, usdg, "Viral USDG Test Market", "VUSDG", 100_000_000, 50_000_000);
        _exercisePair(factory, router, owner, rwa, "Viral Tesla Test Market", "VTSLA", 1 ether, 0.5 ether);
        vm.stopBroadcast();

        require(registry.isEnabled(usdg), "USDG not enabled");
        require(registry.isEnabled(rwa), "RWA not enabled");
        require(factory.previewQuoteEconomics(0, usdg) == USDG_PHANTOM, "USDG economics mismatch");
        require(factory.previewQuoteEconomics(0, rwa) == TSLA_PHANTOM, "RWA economics mismatch");
        console2.log("USDG enabled:", usdg);
        console2.log("RWA enabled:", rwa);
    }

    function _exercisePair(
        PairPadLaunchFactory factory,
        PairPadRouter router,
        address owner,
        address quote,
        string memory name,
        string memory symbol,
        uint256 openingBuy,
        uint256 secondBuy
    ) private {
        bytes32 expected = factory.previewLaunchEconomics(0, quote);
        PairPadLaunchFactory.TokenParams memory params = PairPadLaunchFactory.TokenParams({
            name: name,
            symbol: symbol,
            logo: "",
            description: "ViralTerminal Robinhood testnet quote-pair validation.",
            socials: PairPadLauncherToken.Socials("", "", "", "", ""),
            creatorFeeRecipient: owner,
            creatorTaxBps: 100,
            expectedEconomics: expected,
            salt: keccak256(abi.encode(symbol, block.timestamp, quote))
        });

        IERC20(quote).approve(address(router), openingBuy + secondBuy);
        (address token, PoolId poolId, uint256 openingOut) = router.launchAndBuyWithQuote{value: factory.launchFee()}(
            params, 0, quote, openingBuy, 0
        );
        PoolKey memory poolKey = factory.poolKeyFor(token);
        bool quoteIsCurrency0 = Currency.unwrap(poolKey.currency0) == quote;
        uint256 secondOut = router.swapExactIn(poolKey, quoteIsCurrency0, secondBuy, 0, owner);
        uint256 sellAmount = secondOut / 2;
        IERC20(token).approve(address(router), sellAmount);
        router.swapExactIn(poolKey, !quoteIsCurrency0, sellAmount, 0, owner);

        PairPadLaunchLocker locker = factory.locker();
        locker.collectFees(token);
        PairPadFeeEscrow escrow = PairPadFeeEscrow(payable(address(factory.feeEscrow())));
        uint256 quoteClaim = escrow.balanceOfToken(owner, quote);
        uint256 tokenClaim = escrow.balanceOfToken(owner, token);
        if (quoteClaim != 0) escrow.claimToken(quote);
        if (tokenClaim != 0) escrow.claimToken(token);

        console2.log("market token:", token);
        console2.log("pool id:", vm.toString(PoolId.unwrap(poolId)));
        console2.log("opening / second output:", openingOut, secondOut);
    }
}
