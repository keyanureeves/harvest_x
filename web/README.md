# HarvestX frontend

This directory contains the Next.js frontend for HarvestX, a Sepolia MVP for recording organic-waste processing, HX rewards, and carbon-credit payments.

See the [project README](../README.md) for the protocol overview, contract architecture, deployment flow, usage instructions, and troubleshooting.

## Setup

```bash
npm ci
```

Create `.env.local` before starting the app:

```dotenv
NEXT_PUBLIC_WC_PROJECT_ID=<walletconnect-project-id>
```

The frontend is configured for Ethereum Sepolia in [`lib/config.ts`](lib/config.ts). The RPC transport is currently defined in that file.

## Development

```bash
npm run dev
```

Open `http://localhost:3000` and connect a Sepolia wallet.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
npm start
```

Run `npm run build` before using `npm start`.
