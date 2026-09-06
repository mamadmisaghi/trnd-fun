// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

/// @title ViralPairRegistry
/// @notice Curated source of truth for quote assets allowed at launch. The
/// registry deliberately does not price assets; it only gates the set that the
/// factory may pass to its pricing logic.
contract ViralPairRegistry is Ownable2Step {
    enum PairType {
        NATIVE,
        STABLE,
        STOCK
    }

    struct PairAsset {
        bool registered;
        bool enabled;
        PairType pairType;
        uint8 decimals;
        uint64 updatedAt;
        uint64 configVersion;
    }

    error ZeroAddress();
    error LengthMismatch();
    error InvalidNativeConfig();
    error InvalidTokenConfig();
    error OwnershipCannotBeRenounced();

    event PairAssetUpdated(
        address indexed asset, PairType indexed pairType, bool enabled, uint8 decimals, uint64 configVersion
    );

    uint64 public configVersion;
    mapping(address asset => PairAsset config) private _assets;

    constructor(address initialOwner) Ownable(initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
    }

    function setPair(address asset, PairType pairType, uint8 decimals, bool enabled) public onlyOwner {
        if (asset == address(0)) {
            if (pairType != PairType.NATIVE || decimals != 18) revert InvalidNativeConfig();
        } else {
            if (pairType == PairType.NATIVE || decimals < 6 || asset.code.length == 0) revert InvalidTokenConfig();
        }

        uint64 version = ++configVersion;
        _assets[asset] = PairAsset({
            registered: true,
            enabled: enabled,
            pairType: pairType,
            decimals: decimals,
            updatedAt: uint64(block.timestamp),
            configVersion: version
        });
        emit PairAssetUpdated(asset, pairType, enabled, decimals, version);
    }

    function setPairs(
        address[] calldata assets,
        PairType[] calldata pairTypes,
        uint8[] calldata decimals,
        bool[] calldata enabled
    ) external onlyOwner {
        uint256 length = assets.length;
        if (pairTypes.length != length || decimals.length != length || enabled.length != length) {
            revert LengthMismatch();
        }
        for (uint256 i; i < length; ++i) {
            setPair(assets[i], pairTypes[i], decimals[i], enabled[i]);
        }
    }

    function isEnabled(address asset) external view returns (bool) {
        return _assets[asset].registered && _assets[asset].enabled;
    }

    function getPair(address asset) external view returns (PairAsset memory) {
        return _assets[asset];
    }

    function renounceOwnership() public pure override {
        revert OwnershipCannotBeRenounced();
    }
}
