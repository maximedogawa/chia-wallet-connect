import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import '@maximedogawa/chia-wallet-connect-react/styles';

// Dynamically import ClientApp with SSR disabled to prevent hook errors during server-side rendering
const ClientApp = dynamic(() => import('./_app.client'), {
  ssr: false,
});

export default function App(props: AppProps) {
  return <ClientApp {...props} />;
}
