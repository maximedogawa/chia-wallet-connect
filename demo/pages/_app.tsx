import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import '../../src/styles/globals.css';

const ClientApp = dynamic(() => import('./_app.client'), {
  ssr: false,
});

export default function App(props: AppProps) {
  if (typeof window === 'undefined') {
    return <props.Component {...props.pageProps} />;
  }
  return <ClientApp {...props} />;
}
