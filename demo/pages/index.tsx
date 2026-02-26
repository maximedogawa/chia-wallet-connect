import Head from 'next/head';
import PageLayout from '../components/PageLayout';
import CodeExample from '../components/CodeExample';
import ConnectionStatusCheck from '../components/ConnectionStatusCheck';

const USAGE_EXAMPLE_CODE = `import { useWalletConnectNetwork } from '@maximedogawa/chia-wallet-connect-react';

function MyComponent() {
  const { network, setNetwork, chainId } = useWalletConnectNetwork();
  
  return (
    <div>
      <p>Current Network: {network}</p>
      <p>Chain ID: {chainId}</p>
      <button onClick={() => setNetwork('mainnet')}>
        Switch to Mainnet
      </button>
      <button onClick={() => setNetwork('testnet')}>
        Switch to Testnet
      </button>
    </div>
  );
}`;

export default function Home() {
  return (
    <>
      <Head>
        <title>Chia Wallet Connect - Demo</title>
      </Head>
      <PageLayout>
        <ConnectionStatusCheck />
        <CodeExample
          title="Usage Example"
          code={USAGE_EXAMPLE_CODE}
          language="typescript"
        />
      </PageLayout>
    </>
  );
}

// Use SSR to avoid static generation issues with Redux
export async function getServerSideProps() {
  return { props: {} };
}
