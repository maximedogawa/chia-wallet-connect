import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Wallet Connect - Demo</title>
      </Head>
    </>
  );
}

// Use SSR to avoid static generation issues with Redux
export async function getServerSideProps() {
  return { props: {} };
}
