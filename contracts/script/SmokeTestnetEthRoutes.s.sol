// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId} from "@uniswap/v4-core/src/types/PoolId.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";

import {PairPadLaunchFactory} from "../src/v2/PairPadLaunchFactory.sol";
import {PairPadLaunchLocker} from "../src/v2/PairPadLaunchLocker.sol";
import {PairPadFeeEscrow} from "../src/v2/PairPadFeeEscrow.sol";
import {PairPadLauncherToken} from "../src/v2/PairPadLauncherToken.sol";
import {PairPadRouter} from "../src/v2/PairPadRouter.sol";

/** @notice One-time end-to-end validation of the testnet ETH route. */
contract SmokeTestnetEthRoutes is Script {
    uint256 private constant CREATOR_BUY = 0.0001 ether;
    uint256 private constant SECOND_BUY = 0.0001 ether;

    function run() external {
        require(block.chainid == 46630, "Robinhood testnet only");
        uint256 key = vm.envUint("PRIVATE_KEY");
        address owner = vm.addr(key);
        PairPadLaunchFactory factory = PairPadLaunchFactory(payable(vm.envAddress("FACTORY")));
        PairPadRouter router = PairPadRouter(payable(vm.envAddress("ROUTER")));
        address usdg = vm.envAddress("USDG");

        PairPadRouter.EthLeg memory buyLeg = PairPadRouter.EthLeg({
            v3Path: abi.encodePacked(address(router.weth()), uint24(500), usdg),
            v4Hops: new PoolKey[](0)
        });
        PairPadRouter.EthLeg memory sellLeg = PairPadRouter.EthLeg({
            v3Path: abi.encodePacked(usdg, uint24(500), address(router.weth())),
            v4Hops: new PoolKey[](0)
        });
        PairPadLaunchFactory.TokenParams memory params = PairPadLaunchFactory.TokenParams({
            name: "TRND ETH Route Test",
            symbol: "TRETH",
            logo: "",
            description: "End-to-end Robinhood testnet ETH route validation.",
            socials: PairPadLauncherToken.Socials("", "", "", "", ""),
            creatorFeeRecipient: owner,
            creatorTaxBps: 100,
            expectedEconomics: factory.previewLaunchEconomics(0, usdg),
            salt: keccak256(abi.encode("TRND_ETH_ROUTE", block.timestamp))
        });

        vm.startBroadcast(key);
        (address token, PoolId poolId, uint256 creatorTokens) = router.launchAndBuyWithEth{
            value: factory.launchFee() + CREATOR_BUY
        }(params, 0, usdg, buyLeg, 0);

        PoolKey memory poolKey = factory.poolKeyFor(token);
        uint256 secondTokens = router.buyWithEth{value: SECOND_BUY}(poolKey, buyLeg, 0, owner);
        uint256 sellAmount = secondTokens / 2;
        IERC20(token).approve(address(router), sellAmount);
        uint256 ethOut = router.sellToEth(
            poolKey,
            Currency.unwrap(poolKey.currency0) == token,
            sellAmount,
            sellLeg,
            0,
            owner
        );

        PairPadLaunchLocker locker = factory.locker();
        locker.collectFees(token);
        PairPadFeeEscrow escrow = PairPadFeeEscrow(payable(address(factory.feeEscrow())));
        uint256 usdgClaim = escrow.balanceOfToken(owner, usdg);
        uint256 tokenClaim = escrow.balanceOfToken(owner, token);
        if (usdgClaim != 0) escrow.claimToken(usdg);
        if (tokenClaim != 0) escrow.claimToken(token);
        vm.stopBroadcast();

        require(creatorTokens != 0 && secondTokens != 0 && ethOut != 0, "empty route output");
        console2.log("Smoke token:", token);
        console2.log("Pool id:", vm.toString(PoolId.unwrap(poolId)));
        console2.log("Creator / second tokens:", creatorTokens, secondTokens);
        console2.log("ETH returned on sell:", ethOut);
        console2.log("USDG / token fees claimed:", usdgClaim, tokenClaim);
    }
}
