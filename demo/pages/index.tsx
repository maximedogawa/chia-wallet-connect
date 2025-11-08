import Head from 'next/head';

const Home: React.FC = () => {
  return (
    <>
      <Head>
        <title>Wallet Connect - Demo</title>
      </Head>
      <main className="max-w-[28rem] mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Chia Wallet Connect Demo</h1>
          <p className="text-gray-600 dark:text-gray-400">
            This is a demo page for testing the @chia/wallet-connect package
          </p>
        </div>
      </main>
    </>
  );
};

export default Home;
