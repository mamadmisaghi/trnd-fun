// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title ViralRewardVault
/// @notice Holds the daily creator-reward allocation and credits the five
/// finalized winners of each 24-hour epoch. Ranking happens offchain; this
/// contract only enforces authorization, one-time finalization, fixed weights,
/// exact accounting, and pull-based claims.
contract ViralRewardVault is Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant EPOCH_DURATION = 1 days;
    uint256 public constant BASIS_POINTS = 10_000;
    uint16[5] public REWARD_WEIGHTS_BPS = [uint16(4_000), 2_500, 1_500, 1_200, 800];

    error NotFunder();
    error NotDistributor();
    error ZeroAddress();
    error ZeroFunding();
    error EpochNotEnded(uint256 epochId, uint256 currentEpochId);
    error EpochAlreadyFinalized(uint256 epochId, address currency);
    error DuplicateRecipient(address recipient);
    error NothingToClaim();
    error NativeTransferFailed();

    event FunderUpdated(address indexed previousFunder, address indexed newFunder);
    event DistributorUpdated(address indexed previousDistributor, address indexed newDistributor);
    event EpochFunded(uint256 indexed epochId, address indexed currency, uint256 amount);
    event EpochFinalized(
        uint256 indexed epochId,
        address indexed currency,
        uint256 totalAmount,
        address[5] recipients,
        uint256[5] amounts
    );
    event RewardClaimed(address indexed recipient, address indexed currency, uint256 amount);

    address public funder;
    address public distributor;

    mapping(uint256 epochId => mapping(address currency => uint256 amount)) public epochFunding;
    mapping(uint256 epochId => mapping(address currency => bool finalized)) public epochFinalized;
    mapping(address recipient => mapping(address currency => uint256 amount)) public claimable;

    constructor(address initialOwner, address initialFunder, address initialDistributor) Ownable(initialOwner) {
        if (initialOwner == address(0) || initialFunder == address(0) || initialDistributor == address(0)) {
            revert ZeroAddress();
        }
        funder = initialFunder;
        distributor = initialDistributor;
    }

    modifier onlyFunder() {
        if (msg.sender != funder) revert NotFunder();
        _;
    }

    modifier onlyDistributor() {
        if (msg.sender != distributor) revert NotDistributor();
        _;
    }

    function currentEpoch() public view returns (uint256) {
        return block.timestamp / EPOCH_DURATION;
    }

    function setFunder(address newFunder) external onlyOwner {
        if (newFunder == address(0)) revert ZeroAddress();
        address previous = funder;
        funder = newFunder;
        emit FunderUpdated(previous, newFunder);
    }

    function setDistributor(address newDistributor) external onlyOwner {
        if (newDistributor == address(0)) revert ZeroAddress();
        address previous = distributor;
        distributor = newDistributor;
        emit DistributorUpdated(previous, newDistributor);
    }

    /// @notice Credits native currency to the epoch active at collection time.
    function fundCurrentEpoch() external payable onlyFunder returns (uint256 epochId) {
        if (msg.value == 0) revert ZeroFunding();
        epochId = currentEpoch();
        epochFunding[epochId][address(0)] += msg.value;
        emit EpochFunded(epochId, address(0), msg.value);
    }

    /// @notice Pulls a token allocation into the epoch active at collection
    /// time. The balance delta is recorded so a non-standard token cannot create
    /// claims larger than the assets actually received.
    function fundCurrentEpochToken(address token, uint256 amount)
        external
        onlyFunder
        returns (uint256 epochId, uint256 received)
    {
        if (token == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroFunding();

        uint256 beforeBalance = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        received = IERC20(token).balanceOf(address(this)) - beforeBalance;
        if (received == 0) revert ZeroFunding();

        epochId = currentEpoch();
        epochFunding[epochId][token] += received;
        emit EpochFunded(epochId, token, received);
    }

    /// @notice Finalizes one currency for an ended epoch. Each currency may be
    /// finalized once because fee collection can produce both quote and launch
    /// tokens. Rounding remainder is assigned to rank five so the full funded
    /// amount is conserved.
    function finalizeEpoch(uint256 epochId, address currency, address[5] calldata recipients)
        external
        onlyDistributor
        returns (uint256[5] memory amounts)
    {
        uint256 activeEpoch = currentEpoch();
        if (epochId >= activeEpoch) revert EpochNotEnded(epochId, activeEpoch);
        if (epochFinalized[epochId][currency]) revert EpochAlreadyFinalized(epochId, currency);

        uint256 totalAmount = epochFunding[epochId][currency];
        if (totalAmount == 0) revert ZeroFunding();
        _validateRecipients(recipients);

        epochFinalized[epochId][currency] = true;

        uint256 allocated;
        for (uint256 i; i < 4; ++i) {
            amounts[i] = totalAmount * REWARD_WEIGHTS_BPS[i] / BASIS_POINTS;
            allocated += amounts[i];
        }
        amounts[4] = totalAmount - allocated;

        for (uint256 i; i < 5; ++i) {
            claimable[recipients[i]][currency] += amounts[i];
        }

        emit EpochFinalized(epochId, currency, totalAmount, recipients, amounts);
    }

    function claim(address currency) external nonReentrant returns (uint256 amount) {
        amount = claimable[msg.sender][currency];
        if (amount == 0) revert NothingToClaim();
        claimable[msg.sender][currency] = 0;

        if (currency == address(0)) {
            (bool sent,) = payable(msg.sender).call{value: amount}("");
            if (!sent) revert NativeTransferFailed();
        } else {
            IERC20(currency).safeTransfer(msg.sender, amount);
        }

        emit RewardClaimed(msg.sender, currency, amount);
    }

    function _validateRecipients(address[5] calldata recipients) private pure {
        for (uint256 i; i < 5; ++i) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            for (uint256 j; j < i; ++j) {
                if (recipients[i] == recipients[j]) revert DuplicateRecipient(recipients[i]);
            }
        }
    }
}
