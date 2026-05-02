import React from 'react';
import Link from 'next/link';

function Error({ statusCode }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
            <div className="mb-6 p-4 bg-red-100 text-red-600 rounded-full w-24 h-24 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <h1 className="text-6xl font-bold text-gray-900 mb-4">
                {statusCode ? statusCode : 'Oops!'}
            </h1>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                {statusCode
                    ? `An error ${statusCode} occurred on server`
                    : 'An unexpected error occurred on the client'}
            </h2>
            <p className="text-gray-500 mb-10 max-w-md mx-auto text-lg leading-relaxed">
                We're sorry for the inconvenience. Please try refreshing the page or navigating back home to continue.
            </p>
            <Link href="/">
                <button className="px-10 py-3.5 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors focus:ring-4 focus:ring-gray-300">
                    Return to Home
                </button>
            </Link>
        </div>
    );
}

Error.getInitialProps = ({ res, err }) => {
    const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
    return { statusCode };
};

export default Error;
