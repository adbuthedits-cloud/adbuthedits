"use client";
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faArrowLeft, faEnvelope } from '@fortawesome/free-solid-svg-icons';

/**
 * AccessDenied Component
 * Shows a professional access denied screen when a user tries to access
 * a page or perform an action they don't have permission for.
 * Usage: <AccessDenied module="Staff Members" action="view" />
 */
export default function AccessDenied({ module = null, action = null, fullPage = true }) {
    const router = useRouter();

    const content = (
        <div className="flex flex-col items-center justify-center text-center px-6 py-16">
            <div className="relative mb-8">
                <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                    <FontAwesomeIcon icon={faShieldHalved} className="text-4xl text-red-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Access Denied</h1>
            <p className="text-gray-400 max-w-md mb-2">
                {module
                    ? <>You don&apos;t have permission to <strong className="text-gray-300">{action || 'access'}</strong> <strong className="text-gray-300">{module}</strong>.</>
                    : "You don't have permission to access this page or perform this action."
                }
            </p>
            <p className="text-gray-500 text-sm mb-8">Please contact your administrator to request access.</p>
            {module && (
                <div className="flex items-center gap-2 bg-[#2d1b4e] border border-[#3b2a5f] rounded-lg px-4 py-2 mb-8 text-sm">
                    <FontAwesomeIcon icon={faShieldHalved} className="text-[#a78bfa] text-xs" />
                    <span className="text-gray-400">Required: </span>
                    <span className="text-[#a78bfa] font-mono font-medium">{module}:{action || 'view'}</span>
                </div>
            )}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#2d1b4e] hover:bg-[#3b2a5f] border border-[#3b2a5f] text-gray-300 hover:text-white rounded-lg transition-all duration-200 text-sm font-medium"
                >
                    <FontAwesomeIcon icon={faArrowLeft} /> Go Back
                </button>
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#a78bfa] hover:bg-[#9061f9] text-[#1a1025] rounded-lg transition-all duration-200 text-sm font-bold"
                >
                    Dashboard
                </button>
            </div>
            <div className="mt-12 flex items-center gap-2 text-xs text-gray-600">
                <FontAwesomeIcon icon={faEnvelope} />
                <span>Contact your administrator at <span className="text-gray-500">admin@adbuth.com</span></span>
            </div>
        </div>
    );

    if (!fullPage) return content;

    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="bg-[#1a1025] border border-[#2d1b4e] rounded-2xl max-w-lg w-full shadow-2xl">
                {content}
            </div>
        </div>
    );
}
