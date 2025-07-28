const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center h-full py-16">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
    </div>
  );
};

export default LoadingSpinner;