# Robinhood Chain Testnet Genesis Deployment

This directory is the immutable developer handoff for ViralTerminal's first complete Robinhood Chain Testnet deployment.

It records:

- the 13 verified core protocol contracts;
- the 5 verified testnet-support contracts;
- deployment and verification transaction hashes;
- the first end-to-end launch, buy, and sell smoke test;
- integration ABIs and public frontend environment variables.

Start with [`DEVELOPER_HANDOFF.md`](./DEVELOPER_HANDOFF.md). Machine-readable deployment records are under [`manifests/`](./manifests), and frontend/backend integration ABIs are under [`abi/`](./abi).

## Important

This is a historical snapshot of the first testnet deployment, not a mutable source of current production configuration. Runtime applications should use the repository's current deployment records and validate chain state before sending transactions.

No private key, API key, mnemonic, or other secret belongs in this directory.
