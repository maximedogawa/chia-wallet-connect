import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="application-name" content="Wallet Connect" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Wallet Connect" />
        <meta name="description" content="Wallet Connect for Chia blockchain" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />

        <link rel="apple-touch-icon" href="/logo.jpg" />
        <link rel="apple-touch-icon" sizes="400x400" href="/logo.jpg" />

        <link rel="icon" type="image/jpeg" sizes="400x400" href="/logo.jpg" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/logo.jpg" />

        <meta name="twitter:card" content="Wallet Connect for Chia blockchain" />
        <meta name="twitter:title" content="Wallet Connect" />
        <meta name="twitter:description" content="Wallet Connect for Chia blockchain" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Wallet Connect" />
        <meta property="og:description" content="Wallet Connect for Chia blockchain" />
        <meta property="og:site_name" content="Wallet Connect" />

        <link rel='apple-touch-startup-image' href='/logo.jpg' sizes='400x400' />
      </Head>
      <body className="bg-slate-100 dark:bg-zinc-900 dark:text-brandLight">
        <div className="container mx-auto">
          <Main />
        </div>
        <NextScript />
      </body>
    </Html>
  )
}
