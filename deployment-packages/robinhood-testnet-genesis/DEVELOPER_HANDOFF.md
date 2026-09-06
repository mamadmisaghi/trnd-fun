# ViralTerminal — Robinhood Chain Testnet Deployment Handoff

This package contains the canonical ViralTerminal launchpad deployment addresses for frontend and backend integration.

## Network

```text
Network: Robinhood Chain Testnet
Chain ID: 46630
RPC: https://rpc.testnet.chain.robinhood.com
Explorer: https://explorer.testnet.chain.robinhood.com
Deployer: 0x66B6c5e00B1242B9681BCB3bC3bCc3C87C138CaE
```

## Verification status

- Core deployment: 13/13 contracts deployed and source-verified.
- Testnet support deployment: 5/5 contracts deployed and source-verified.
- Verification was completed by the deployment workflows and recorded in the canonical manifests.
- The generated `VIRALTEST` smoke token is not counted as an infrastructure contract and was not separately recorded as source-verified.

## Core protocol contracts

### LaunchFactory

```text
Address: 0x8D196Fc239AE5C364eF4E8b76A987Acd6065929C
Explorer: https://explorer.testnet.chain.robinhood.com/address/0x8D196Fc239AE5C364eF4E8b76A987Acd6065929C
Deploy TX: https://explorer.testnet.chain.robinhood.com/tx/0xf2c907e57fb639554d1caa94ed02e54cf0a18c17d061d001e62978b96cf44982
Verified: YES
```

Creates launch tokens, opens their pools, stores launch configuration and records launch provenance.

### Router

```text
Address: 0x55Bea0D582C48815585164AC476C2C0c71506B5d
Explorer: https://explorer.testnet.chain.robinhood.com/address/0x55Bea0D582C48815585164AC476C2C0c71506B5d
Deploy TX: https://explorer.testnet.chain.robinhood.com/tx/0x3581c837afb9a3ba5b31bd3a98521836eb1822ead034966712446e2c958c9fbe
Verified: YES
```

Frontend entry point for atomic launch-and-buy and launch-pool buy/sell routing.

### LaunchDeployer

```text
Address: 0x62Bf40701f7B8A56deB74224D39A7137eD988Cf3
Explorer: https://explorer.testnet.chain.robinhood.com/address/0x62Bf40701f7B8A56deB74224D39A7137eD988Cf3
Deploy TX: https://explorer.testnet.chain.robinhood.com/tx/0x2dab10ee057bcc80087bb0374633cab8e25a9c5092586db637332b0ede1b3738
Verified: YES
```

Deploys fixed-supply launch tokens deterministically with CREATE2.

### PositionMinter

```text
Address: 0xc2F71201De7b0d440eb75bBEDd278f88E3fADD7e
Explorer: https://explorer.testnet.chain.robinhood.com/address/0xc2F71201De7b0d440eb75bBEDd278f88E3fADD7e
Deploy TX: https://explorer.testnet.chain.robinhood.com/tx/0x2262a32d3e0c99f2a0c5d5da0f273dcd3fd8ca9bfbc9198a9ba2e7a236c15da9
Verified: YES
```

Creates the Uniswap V4 liquidity position for a newly launched market.

### LaunchLocker

```text
Address: 0x0CB8026DB8122b2454cd29aF31E1172b3cA39739
Explorer: https://explorer.testnet.chain.robinhood.com/address/0x0CB8026DB8122b2454cd29aF31E1172b3cA39739
Deploy TX: https://explorer.testnet.chain.robinhood.com/tx/0xccba5157a7f387280e71e49818476a5f91d691ddb16e5e5b3091c6345c7e92e9
Verified: YES
```

Permanently holds launch liquidity positions and collects the LP fees.

### FeeSplitter

```text
Address: 0x43543d18D40Ad68bE00eA3c23322A3c0EDe7d080
Explorer: https://explorer.testnet.chain.robinhood.com/address/0x43543d18D40Ad68bE00eA3c23322A3c0EDe7d080
Deploy TX: https://explorer.testnet.chain.robinhood.com/tx/0x731d77fdaed2bb2db7bdaa912b538db2a04ec401b4cd68c9cd39d2a6ddee275f
Verified: YES
```

Splits protocol fee revenue across creator, daily rewards, operations and buyback destinations.

### FeeEscrow

```text
Address: 0xCA093138A86Ab9aA4f4aB7bE112F6B0a106c8722
Explorer: https://explorer.testnet.chain.robinhood.com/address/0xCA093138A86Ab9aA4f4aB7bE112F6B0a106c8722
Deploy TX: https://explorer.testnet.chain.robinhood.com/tx/0x200dc37f716b7c696c318a2651a10b2c82a35a895a3cf980ca5b4dfdc98b8ba4
Verified: YES
```

Holds claimable fee balances.

### RewardVault

```text
Address: 0x426d472CdC78f7741aCbE4864aaf92A015883c9C
Explorer: https://explorer.testnet.chain.robinhood.com/address/0x426d472CdC78f7741aCbE4864aaf92A015883c9C
Deploy TX: https://explorer.testnet.chain.robinhood.com/tx/0xe02d35ae30cf43f9c71602044ccb2b37b0f9e0740cc7d29b622d29f48b233d62
Verified: YES
```

Funds and distributes the daily top-five creator reward epochs.

### OperationsVault

```text
Address: 0x19Ec2b0B14f3a057F9fDBa6aabE30601D5bc4Cca
Explorer: https://explorer.testnet.chain.robinhood.com/address/0x19Ec2b0B14f3a057F9fDBa6aabE30601D5bc4Cca
Deploy TX: https://explorer.testnet.chain.robinhood.com/tx/0x96dca8d6430e173e3a1a2a75daca26dad4126a272da39c6cdad844474eb46e47
Verified: YES
```

Receives the protocol allocation for API, infrastructure and operations costs.

### BuybackVault

```text
Address: 0xfA3B7d885b76BF87B76875529A14613Ce3BF893E
Explorer: https://explorer.testnet.chain.robinhood.com/address/0xfA3B7d885b76BF87B76875529A14613Ce3BF893E
Deploy TX: https://explorer.testnet.chain.robinhood.com/tx/0xc7676e80bf1b4dc15fb436f46e7a141745889d1ed3f372eb55ae32db876f5e69
Verified: YES
```

Receives the allocation reserved for future VIRAL buyback execution.

### PairRegistry

```text
Address: 0x8e84B45d98A2b8233Aa1bA8BB16b6678E1C947aa
Explorer: https://explorer.testnet.chain.robinhood.com/address/0x8e84B45d98A2b8233Aa1bA8BB16b6678E1C947aa
Deploy TX: https://explorer.testnet.chain.robinhood.com/tx/0x67f60292f14b34cf885b825f087d6dd5ee5ce972f5b99645369f60c371ff9e22
Verified: YES
```

Authoritative allowlist and configuration store for native, stable and RWA pair assets.

### QuotePricer

```text
Address: 0x6632cBf9012B2c214b70ccF7121708c3EB5e3f3e
Explorer: https://explorer.testnet.chain.robinhood.com/address/0x6632cBf9012B2c214b70ccF7121708c3EB5e3f3e
Deploy TX: https://explorer.testnet.chain.robinhood.com/tx/0x0eeb8c7123c88a9ae481d4b0150fac6686176a8840d74a15a6987104d2390bc1
Verified: YES
```

Calculates the pair-denominated phantom quote used to establish opening economics.

### ReferenceRegistry

```text
Address: 0x54cFF4Aaf45fB14d40D55BDbD1A341196Ec3C1e8
Explorer: https://explorer.testnet.chain.robinhood.com/address/0x54cFF4Aaf45fB14d40D55BDbD1A341196Ec3C1e8
Deploy TX: https://explorer.testnet.chain.robinhood.com/tx/0x76c88117cb91ca069ee647d1057569abe76e30d19addb8fd4e9b8a8a59de98a6
Verified: YES
```

Stores reference venues and pricing routes for quote assets.

## Testnet support contracts

### Test WETH

```text
Address: 0xfCEDD91c7d8a32c0747D8B076b394EfDC5833C60
Explorer: https://explorer.testnet.chain.robinhood.com/address/0xfCEDD91c7d8a32c0747D8B076b394EfDC5833C60
Deploy TX: https://explorer.testnet.chain.robinhood.com/tx/0xb966e7adee8cbd088f49437335e3d95829259c8343461af508c8ddbe4d9f889d
Verified: YES
```

### Test USDG

```text
Address: 0x20A887523fbbF0024eB46ee672DF15A95521E680
Explorer: https://explorer.testnet.chain.robinhood.com/address/0x20A887523fbbF0024eB46ee672DF15A95521E680
Deploy TX: https://explorer.testnet.chain.robinhood.com/tx/0x300bd655caf4548c296b047bdf2c9d6fdb7d02e6a5dd50ca9a7a13ca4bda5351
Verified: YES
```

### Testnet V3 Factory

```text
Address: 0x91ad675ef9b9A935B00BAd1B74bD1E18cbE03026
Explorer: https://explorer.testnet.chain.robinhood.com/address/0x91ad675ef9b9A935B00BAd1B74bD1E18cbE03026
Deploy TX: https://explorer.testnet.chain.robinhood.com/tx/0xbe49143f3b284dd95b22279ce9c3c3acd31065ace197637e5096231eed4f7b39
Verified: YES
```

### Testnet Swap Router Stub

```text
Address: 0xa3bAA042FeBFbC06AaBf00Fb3dFB3CbB7abFe92D
Explorer: https://explorer.testnet.chain.robinhood.com/address/0xa3bAA042FeBFbC06AaBf00Fb3dFB3CbB7abFe92D
Deploy TX: https://explorer.testnet.chain.robinhood.com/tx/0xbf7f6a118a6fc73109e62def07bc4de20d8e5b7314a59c23cc4b44b794729620
Verified: YES
```

### WETH/USDG Reference Pool

```text
Address: 0x5974C84A89e61574ED196F44FF328e11D9Fc318b
Explorer: https://explorer.testnet.chain.robinhood.com/address/0x5974C84A89e61574ED196F44FF328e11D9Fc318b
Creation TX: https://explorer.testnet.chain.robinhood.com/tx/0xaf665b4371e6c9c5b1a81e3e9cb7222832de48dd4ce37622e51f26d18e855096
Verified: YES
```

## External network dependencies — not deployed by ViralTerminal

```text
Uniswap V4 PoolManager: 0x8366a39CC670B4001A1121B8F6A443A643e40951
PositionManager: 0x58daec3116aae6D93017bAAea7749052E8a04fA7
Permit2: 0x000000000022D473030F116dDEE9F6B43aC78BA3
```

These contracts were already present on Robinhood Chain Testnet and are dependencies rather than ViralTerminal deployments.

## Deployed smoke-test market

```text
Token name: ViralTerminal Testnet Genesis
Symbol: VIRALTEST
Token: 0x06353b828dBeB40908f5e08c56a6F7bB60fE92e3
Explorer: https://explorer.testnet.chain.robinhood.com/address/0x06353b828dBeB40908f5e08c56a6F7bB60fE92e3
Pair: Native ETH
Pool ID: 0x7f53c547a2fd984d49bc6803ec721e7454b5413a066135cd0049aae1250aa470
Position ID: 2980
Base protocol fee: 1%
Creator fee: 2%
Total pool fee: 3%
```

Smoke transactions:

```text
Launch + Creator Buy: https://explorer.testnet.chain.robinhood.com/tx/0xdd99bf3087f6f73e34bb1d3047a2b9d0649f386a8bba9dfd314945d798a1c328
Second Buy: https://explorer.testnet.chain.robinhood.com/tx/0xa1d6cdec5be13e7f281803287cc8ca92d082fe25e5a96d0e99324466462d845f
Sell Approval: https://explorer.testnet.chain.robinhood.com/tx/0x8e0e117cf17cc62d0bb54d7ba2b8fb7f7a2cc26220d65f902e48d2962c4c06b6
Partial Sell: https://explorer.testnet.chain.robinhood.com/tx/0xe68cedc5686b7ce094464d6aaebffb74d35afa5cf2005bb96d208aacf79e00e9
```

## Canonical GitHub files

```text
Repository: https://github.com/mamadmisaghi/viral-terminal-protocol
Core manifest: https://github.com/mamadmisaghi/viral-terminal-protocol/blob/main/contracts/deployments/46630/core.json
Support manifest: https://github.com/mamadmisaghi/viral-terminal-protocol/blob/main/contracts/deployments/46630/support.json
Smoke manifest: https://github.com/mamadmisaghi/viral-terminal-protocol/blob/main/contracts/deployments/46630/smoke.json
```

## Important integration notes

1. The current browser integration supports a real native ETH launch on testnet.
2. Do not hardcode mock RWA addresses from the UI. RWA tokens must be registered in PairRegistry and assigned valid reference-pricing routes before launch.
3. Read launch fee and economics from LaunchFactory immediately before transaction submission.
4. Use Router for atomic `launchAndBuyWithEth` and launch-pool buy/sell flows.
5. Do not mark a launch successful until the transaction receipt confirms.
6. Never expose or request a deployer or user private key in frontend code.
7. Testnet verification is not a security audit. A professional audit and additional invariant/fork testing are required before mainnet value is placed at risk.
