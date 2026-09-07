# Robinhood testnet ETH-route deployment request

This operations-only change triggers the guarded, idempotent deployment workflow. The workflow either deploys the validated collateralized testnet adapter or recovers the already-active deployment, records its manifest, and updates the frontend contract addresses.
