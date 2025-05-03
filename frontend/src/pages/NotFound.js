import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto">
        <div className="text-6xl font-bold text-primary-600 mb-4">404</div>
        <h1 className="text-3xl font-bold mb-6">Page Not Found</h1>
        <p className="text-secondary-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="btn-primary inline-flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
            <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-3.586l-3.707 3.707a1 1 0 01-1.414-1.414L11.586 10H5a1 1 0 110-2h6.586l-3.293-3.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;