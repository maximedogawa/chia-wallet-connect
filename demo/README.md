# Demo App

This is a demo/test application for the `@chia/wallet-connect` package.

## Running the Demo

From the root directory:

```bash
npm run dev
```

This will start the Next.js demo app on `http://localhost:3000`.

## Environment Variables

Create a `.env.local` file in this `demo/` directory with your WalletConnect configuration:

```env
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_WALLET_CONNECT_RELAY_URL=wss://relay.walletconnect.com
NEXT_PUBLIC_CHIA_NETWORK=mainnet
```

**Note**: Next.js loads environment variables from the directory where `next.config.js` is located (this `demo/` folder), not from the project root.

## Purpose

This demo app is used to:
- Test the WalletConnect components locally
- Verify the package works correctly before publishing
- Provide examples of how to use the package

## Note

This demo app is **not** included in the published npm package. Only the `dist/` folder and necessary files are published.
