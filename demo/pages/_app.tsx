import type { AppProps } from 'next/app';
import ClientApp from './_app.client';
import '@maximedogawa/chia-wallet-connect-react/styles';

export default function App(props: AppProps) {
  if (typeof window === 'undefined') {
    return <props.Component {...props.pageProps} />;
  }
  return <ClientApp {...props} />;
}
