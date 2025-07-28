import Header from './Header';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
