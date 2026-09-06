#!/usr/bin/env bash
set -euo pipefail

: "${RH_TESTNET_RPC_URL:=https://rpc.testnet.chain.robinhood.com}"
: "${RH_TESTNET_DEPLOYER_PRIVATE_KEY:?RH_TESTNET_DEPLOYER_PRIVATE_KEY is required}"
: "${RH_TESTNET_DEPLOYER_ADDRESS:?RH_TESTNET_DEPLOYER_ADDRESS is required}"

EXPECTED_CHAIN_ID="46630"
POOL_MANAGER="${POOL_MANAGER:-0x8366a39CC670B4001A1121B8F6A443A643e40951}"
POSITION_MANAGER="${POSITION_MANAGER:-0x58daec3116aae6D93017bAAea7749052E8a04fA7}"
PERMIT2="${PERMIT2:-0x000000000022D473030F116dDEE9F6B43aC78BA3}"

actual_chain_id="$(cast chain-id --rpc-url "$RH_TESTNET_RPC_URL")"
if [[ "$actual_chain_id" != "$EXPECTED_CHAIN_ID" ]]; then
  echo "Unexpected chain id: $actual_chain_id (expected $EXPECTED_CHAIN_ID)" >&2
  exit 1
fi

actual_address="$(cast wallet address --private-key "$RH_TESTNET_DEPLOYER_PRIVATE_KEY")"
if [[ "${actual_address,,}" != "${RH_TESTNET_DEPLOYER_ADDRESS,,}" ]]; then
  echo "The configured deployer secret does not match RH_TESTNET_DEPLOYER_ADDRESS." >&2
  exit 1
fi

balance="$(cast balance "$actual_address" --rpc-url "$RH_TESTNET_RPC_URL")"
if [[ "$balance" == "0" ]]; then
  echo "The testnet deployer has no ETH for gas." >&2
  exit 1
fi

for entry in "PoolManager:$POOL_MANAGER" "PositionManager:$POSITION_MANAGER" "Permit2:$PERMIT2"; do
  name="${entry%%:*}"
  address="${entry#*:}"
  code="$(cast code "$address" --rpc-url "$RH_TESTNET_RPC_URL")"
  if [[ "$code" == "0x" || "$code" == "0x0" ]]; then
    echo "$name has no bytecode at $address on Robinhood Chain testnet." >&2
    exit 1
  fi
  echo "$name bytecode confirmed at $address"
done

echo "Robinhood Chain testnet preflight passed."
echo "Deployer: $actual_address"
echo "Balance (wei): $balance"

