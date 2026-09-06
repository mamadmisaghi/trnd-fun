// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

interface IViralCreatorEscrow {
    function credit(address recipient) external payable;
    function creditToken(address recipient, address token, uint256 amount) external;
}

interface IViralRewardFunder {
    function fundCurrentEpoch() external payable returns (uint256 epochId);
    function fundCurrentEpochToken(address token, uint256 amount) external returns (uint256 epochId, uint256 received);
}

/// @title ViralFeeSplitter
/// @notice Receives fees collected by the permanent-liquidity locker and
/// allocates them in kind. It performs no swap and no burn.
///
/// Base trading fee allocation:
/// - 50% creator escrow
/// - 20% daily creator rewards
/// - 10% operations/API treasury
/// - 20% VIRAL buyback treasury
///
/// The creator also receives 100% of the optional creator fee. Any integer
/// rounding remainder is conservatively credited to the creator.
contract ViralFeeSplitter is Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant BASIS_POINTS = 10_000;
    uint256 public constant REWARDS_SHARE_BPS = 2_000;
    uint256 public constant OPERATIONS_SHARE_BPS = 1_000;
    uint256 public constant BUYBACK_SHARE_BPS = 2_000;

    error NotLocker();
    error LockerAlreadySet();
    error ZeroAddress();
    error ZeroAmount();
    error InvalidFeeTerms();
    error InexactTransfer(address token, uint256 expected, uint256 received);
    error NativeTransferFailed(address recipient, uint256 amount);
    error OwnershipCannotBeRenounced();

    event LockerSet(address indexed locker);
    event FeesSplit(
        address indexed creator,
        address indexed currency,
        uint256 totalAmount,
        uint256 creatorAmount,
        uint256 rewardsAmount,
        uint256 operationsAmount,
        uint256 buybackAmount,
        uint16 baseFeeBps,
        uint16 creatorFeeBps
    );

    IViralCreatorEscrow public immutable creatorEscrow;
    IViralRewardFunder public immutable rewardVault;
    address public immutable operationsVault;
    address public immutable buybackVault;
    address public locker;

    constructor(
        address initialOwner,
        IViralCreatorEscrow creatorEscrow_,
        IViralRewardFunder rewardVault_,
        address operationsVault_,
        address buybackVault_
    ) Ownable(initialOwner) {
        if (
            initialOwner == address(0) || address(creatorEscrow_) == address(0) || address(rewardVault_) == address(0)
                || operationsVault_ == address(0) || buybackVault_ == address(0)
        ) revert ZeroAddress();
        creatorEscrow = creatorEscrow_;
        rewardVault = rewardVault_;
        operationsVault = operationsVault_;
        buybackVault = buybackVault_;
    }

    modifier onlyLocker() {
        if (msg.sender != locker) revert NotLocker();
        _;
    }

    function setLocker(address locker_) external onlyOwner {
        if (locker != address(0)) revert LockerAlreadySet();
        if (locker_ == address(0)) revert ZeroAddress();
        locker = locker_;
        emit LockerSet(locker_);
    }

    function renounceOwnership() public pure override {
        revert OwnershipCannotBeRenounced();
    }

    function splitNative(address creator, uint16 baseFeeBps, uint16 creatorFeeBps)
        external
        payable
        onlyLocker
        nonReentrant
    {
        if (creator == address(0)) revert ZeroAddress();
        if (msg.value == 0) revert ZeroAmount();
        (uint256 creatorAmount, uint256 rewardsAmount, uint256 operationsAmount, uint256 buybackAmount) =
            _allocations(msg.value, baseFeeBps, creatorFeeBps);

        if (creatorAmount != 0) creatorEscrow.credit{value: creatorAmount}(creator);
        if (rewardsAmount != 0) rewardVault.fundCurrentEpoch{value: rewardsAmount}();
        _sendNative(operationsVault, operationsAmount);
        _sendNative(buybackVault, buybackAmount);

        emit FeesSplit(
            creator,
            address(0),
            msg.value,
            creatorAmount,
            rewardsAmount,
            operationsAmount,
            buybackAmount,
            baseFeeBps,
            creatorFeeBps
        );
    }

    function splitToken(address creator, address token, uint256 amount, uint16 baseFeeBps, uint16 creatorFeeBps)
        external
        onlyLocker
        nonReentrant
    {
        if (creator == address(0) || token == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        IERC20 asset = IERC20(token);
        uint256 beforeBalance = asset.balanceOf(address(this));
        asset.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = asset.balanceOf(address(this)) - beforeBalance;
        if (received != amount) revert InexactTransfer(token, amount, received);

        (uint256 creatorAmount, uint256 rewardsAmount, uint256 operationsAmount, uint256 buybackAmount) =
            _allocations(amount, baseFeeBps, creatorFeeBps);

        if (creatorAmount != 0) {
            asset.forceApprove(address(creatorEscrow), creatorAmount);
            creatorEscrow.creditToken(creator, token, creatorAmount);
        }

        if (rewardsAmount != 0) {
            asset.forceApprove(address(rewardVault), rewardsAmount);
            (, uint256 rewardReceived) = rewardVault.fundCurrentEpochToken(token, rewardsAmount);
            if (rewardReceived != rewardsAmount) revert InexactTransfer(token, rewardsAmount, rewardReceived);
        }

        _transferExact(asset, token, operationsVault, operationsAmount);
        _transferExact(asset, token, buybackVault, buybackAmount);

        emit FeesSplit(
            creator,
            token,
            amount,
            creatorAmount,
            rewardsAmount,
            operationsAmount,
            buybackAmount,
            baseFeeBps,
            creatorFeeBps
        );
    }

    function preview(uint256 amount, uint16 baseFeeBps, uint16 creatorFeeBps)
        external
        pure
        returns (uint256 creatorAmount, uint256 rewardsAmount, uint256 operationsAmount, uint256 buybackAmount)
    {
        return _allocations(amount, baseFeeBps, creatorFeeBps);
    }

    function _allocations(uint256 amount, uint16 baseFeeBps, uint16 creatorFeeBps)
        private
        pure
        returns (uint256 creatorAmount, uint256 rewardsAmount, uint256 operationsAmount, uint256 buybackAmount)
    {
        uint256 totalFeeBps = uint256(baseFeeBps) + creatorFeeBps;
        if (baseFeeBps == 0 || totalFeeBps == 0) revert InvalidFeeTerms();

        uint256 denominator = totalFeeBps * BASIS_POINTS;
        rewardsAmount = Math.mulDiv(amount, uint256(baseFeeBps) * REWARDS_SHARE_BPS, denominator);
        operationsAmount = Math.mulDiv(amount, uint256(baseFeeBps) * OPERATIONS_SHARE_BPS, denominator);
        buybackAmount = Math.mulDiv(amount, uint256(baseFeeBps) * BUYBACK_SHARE_BPS, denominator);
        creatorAmount = amount - rewardsAmount - operationsAmount - buybackAmount;
    }

    function _sendNative(address recipient, uint256 amount) private {
        if (amount == 0) return;
        (bool sent,) = payable(recipient).call{value: amount}("");
        if (!sent) revert NativeTransferFailed(recipient, amount);
    }

    function _transferExact(IERC20 asset, address token, address recipient, uint256 amount) private {
        if (amount == 0) return;
        uint256 beforeBalance = asset.balanceOf(recipient);
        asset.safeTransfer(recipient, amount);
        uint256 received = asset.balanceOf(recipient) - beforeBalance;
        if (received != amount) revert InexactTransfer(token, amount, received);
    }
}
