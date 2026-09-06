# Deployment packages

This directory contains immutable, developer-facing snapshots of notable ViralTerminal deployments.

## Available snapshots

- [`robinhood-testnet-genesis/`](./robinhood-testnet-genesis) — first complete Robinhood Chain Testnet deployment, verified contract addresses, ABIs, manifests, frontend variables, and end-to-end smoke-test results.

These packages are integration and historical reference material. The active Solidity sources live under [`contracts/`](../contracts), while canonical current deployment manifests live under [`contracts/deployments/`](../contracts/deployments).

Never commit deployer keys, mnemonics, API secrets, or production credentials to a deployment package.
