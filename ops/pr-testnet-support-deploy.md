# Robinhood Chain testnet support deployment

This internal operations PR triggers the one-time support-contract deployment on chain 46630 after the full contract test suite passes.

Retry 1: normalize the GitHub Secret to the `0x`-prefixed uint256 format expected by Foundry inside the runner.
