import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        // Define a state variable to track whether is an error or not
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can use your own error logging service here
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        // Check if the error is thrown
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-xl m-4 border border-gray-200 shadow-sm">
                    <div className="mb-6 p-4 bg-red-100 text-red-600 rounded-full w-20 h-20 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Something went wrong</h2>
                    <p className="text-gray-600 mb-8 max-w-md text-lg leading-relaxed">We apologize for the inconvenience. Our system has automatically been notified of this issue.</p>
                    <button
                        type="button"
                        onClick={() => {
                            this.setState({ hasError: false });
                            window.location.reload();
                        }}
                        className="px-8 py-3 bg-[#A75CF2] text-white rounded-full font-medium shadow-md hover:bg-[#8e45d6] transition-colors focus:ring-4 focus:ring-purple-200"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        // Return children components in case of no error
        return this.props.children;
    }
}

export default ErrorBoundary;
