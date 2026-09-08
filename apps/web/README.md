# TRND.fun

A Next.js App Router conversion of the published TRND.fun prototype. The visual system, routes, terminal layout, live-feed interactions and current mock content have been preserved, while Base44-specific application code has been removed.

## Stack

- Next.js App Router + React
- Tailwind CSS
- shadcn/ui source components in `components/ui`
- Local Aceternity-style terminal grid in `components/aceternity`
- Local Vengeance-style magnetic interaction in `components/vengeance`
- Framer Motion for interaction motion
- viem with an injected EIP-1193 wallet for Robinhood Chain Testnet

Aceternity UI and Vengeance UI are copied-source component libraries. Their local components are owned by this repository, so they can be reviewed and changed without depending on a hosted component runtime.

## Routes

| Route | Surface |
|---|---|
| `/` | Landing and live launch overview |
| `/live`, `/signals` | Live signal analyzer |
| `/signal/[id]` | Viral event intelligence |
| `/launch/[id]` | Viral event launch studio |
| `/create` | Manual launch |
| `/explore` | Markets |
| `/token/[id]` | Token market |
| `/creators`, `/creator/[id]` | Creator network and profile |
| `/portfolio` | Mock portfolio |

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm start
```

## Project structure

```text
app/                       Next.js route boundaries
components/pages/          Route surfaces retained from the current TRND.fun UI
components/viral/          Shared terminal components and shell
components/ui/             shadcn/ui primitives used by the UI
components/aceternity/     Local terminal-grid interaction primitive
components/vengeance/      Local magnetic interaction primitive
data/mock/viral-terminal.js            Temporary domain mock data
lib/launchState.js         Browser-only UI session/provenance state
lib/protocol/              Testnet chain, ABI, wallet and launch integration
lib/navigation.jsx         Transitional Next navigation adapter for retained UI components
```

## Backend handoff

UI components do not fetch data directly. Replace `data/mock/viral-terminal.js` with server-side repository modules or typed API clients, keeping their exported domain shapes while the backend is being introduced. Replace `lib/launchState.js` with authoritative reservation and launch endpoints before production. API secrets go only in server-side environment variables; `.env.example` intentionally contains names only.

The scanner, portfolio and creator analytics remain mock-backed. Manual Create
and Signal Launch use a server-controlled, onchain-verified pair catalog for
ETH, USDG and TSLA testnet launches. Onchain token pages support live indexed
market history, buy/sell simulation and execution, fee collection and creator
fee claims. Execution fails closed if the catalog or a fresh route is
unavailable. The USDG/TSLA adapter is testnet-only; production routes and the
Viral Engine remain separate release gates.

## Robinhood Chain Testnet

- Chain ID: `46630`
- Launch factory: `0x8D196Fc239AE5C364eF4E8b76A987Acd6065929C`
- Active ETH-route router: `0xc3e36d0c7374dee38a092356a59e0829404729e9`
- Pair registry: `0x8e84B45d98A2b8233Aa1bA8BB16b6678E1C947aa`
- Explorer: `https://explorer.testnet.chain.robinhood.com`

The UI never receives or stores a private key. A browser wallet remains the
creator and signer. The active testnet catalog is read from the pair registry
and filtered by the server route policy; it currently includes ETH, test USDG
and test TSLA. These assets and routes are not approved for mainnet or real
funds.
