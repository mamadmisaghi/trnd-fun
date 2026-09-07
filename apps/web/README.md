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

The scanner, market history, portfolio and creator analytics remain mock-backed. Manual Create and Signal Launch now support a real native-ETH testnet launch through the deployed TRND.fun router, including wallet connection, network switching, live launch economics, preflight simulation, optional atomic Creator Buy and receipt confirmation. RWA routes, live trading, pair synchronization and creator fee claims remain separate integration workstreams.

## Robinhood Chain Testnet

- Chain ID: `46630`
- Launch factory: `0x8D196Fc239AE5C364eF4E8b76A987Acd6065929C`
- Router: `0x55Bea0D582C48815585164AC476C2C0c71506B5d`
- Pair registry: `0x8e84B45d98A2b8233Aa1bA8BB16b6678E1C947aa`
- Explorer: `https://explorer.testnet.chain.robinhood.com`

The UI never receives or stores a private key. A browser wallet remains the creator and signer. The first live route intentionally enables only the native ETH pair; RWA choices stay in preview until their testnet tokens and reference pools are registered.
