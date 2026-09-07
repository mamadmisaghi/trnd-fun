// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @notice Wrapped test ETH with real 1:1 native backing. This contract is
 * deliberately testnet-only and must never be substituted for canonical WETH.
 */
contract TestnetWrappedEther is ERC20 {
    constructor() ERC20("TRND Test Wrapped Ether", "tWETH") {}

    function deposit() public payable {
        _mint(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        _burn(msg.sender, amount);
        (bool sent,) = payable(msg.sender).call{value: amount}("");
        require(sent, "tWETH native transfer failed");
    }

    receive() external payable {
        deposit();
    }
}

/**
 * @title TestnetEthQuoteAdapter
 * @notice A collateralized, owner-priced one-hop adapter used only on
 * Robinhood Chain testnet, where canonical Uniswap V3 liquidity is absent.
 *
 * It implements the exact `SwapRouter02.exactInput` surface consumed by
 * PairPadRouter. ETH-in trades wrap the received native asset into `tWETH`;
 * token-in trades pull the input with SafeERC20. Output is always paid from
 * pre-funded reserves, so the adapter cannot fabricate RWA balances.
 *
 * Production deployments must use the canonical Uniswap SwapRouter02 and
 * market-derived routes. This adapter exists only to exercise the complete
 * ETH <-> RWA <-> launch-token flow on testnet.
 */
contract TestnetEthQuoteAdapter is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct ExactInputParams {
        bytes path;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
    }

    struct Rate {
        uint128 numerator;
        uint128 denominator;
    }

    TestnetWrappedEther public immutable weth;
    mapping(address tokenIn => mapping(address tokenOut => Rate)) public rates;
    bool public paused;

    error ZeroAddress();
    error ZeroAmount();
    error UnsupportedPath();
    error RateNotConfigured(address tokenIn, address tokenOut);
    error NativeValueMismatch();
    error SlippageExceeded(uint256 amountOut, uint256 minimum);
    error AdapterPaused();

    event RateSet(address indexed tokenIn, address indexed tokenOut, uint128 numerator, uint128 denominator);
    event PausedSet(bool paused);
    event TestnetSwap(
        address indexed sender,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address recipient
    );

    constructor(address owner_, TestnetWrappedEther weth_) Ownable(owner_) {
        if (owner_ == address(0) || address(weth_) == address(0)) revert ZeroAddress();
        weth = weth_;
    }

    function setRate(address tokenIn, address tokenOut, uint128 numerator, uint128 denominator)
        external
        onlyOwner
    {
        if (tokenIn == address(0) || tokenOut == address(0) || tokenIn == tokenOut) revert ZeroAddress();
        if (numerator == 0 || denominator == 0) revert ZeroAmount();
        rates[tokenIn][tokenOut] = Rate(numerator, denominator);
        emit RateSet(tokenIn, tokenOut, numerator, denominator);
    }

    function setPaused(bool paused_) external onlyOwner {
        paused = paused_;
        emit PausedSet(paused_);
    }

    function exactInput(ExactInputParams calldata params)
        external
        payable
        nonReentrant
        returns (uint256 amountOut)
    {
        if (paused) revert AdapterPaused();
        if (params.recipient == address(0)) revert ZeroAddress();
        if (params.amountIn == 0) revert ZeroAmount();
        if (params.path.length != 43) revert UnsupportedPath();

        address tokenIn = address(bytes20(params.path[:20]));
        address tokenOut = address(bytes20(params.path[23:43]));
        Rate memory rate = rates[tokenIn][tokenOut];
        if (rate.denominator == 0) revert RateNotConfigured(tokenIn, tokenOut);

        if (msg.value != 0) {
            if (tokenIn != address(weth) || msg.value != params.amountIn) revert NativeValueMismatch();
            weth.deposit{value: msg.value}();
        } else {
            IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), params.amountIn);
        }

        amountOut = Math.mulDiv(params.amountIn, rate.numerator, rate.denominator);
        if (amountOut < params.amountOutMinimum) {
            revert SlippageExceeded(amountOut, params.amountOutMinimum);
        }
        IERC20(tokenOut).safeTransfer(params.recipient, amountOut);
        emit TestnetSwap(msg.sender, tokenIn, tokenOut, params.amountIn, amountOut, params.recipient);
    }

    function withdrawReserve(address token, address recipient, uint256 amount) external onlyOwner {
        if (token == address(0) || recipient == address(0)) revert ZeroAddress();
        IERC20(token).safeTransfer(recipient, amount);
    }
}
