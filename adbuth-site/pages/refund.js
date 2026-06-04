import { Calendar, CreditCard, RefreshCw } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SeoHead from '../components/SeoHead';
import useSeo from '../hooks/useSeo';

const SECTIONS = [
    {
        id: "cancellation",
        title: "1. Cancellation Policy",
        content: "Cancellations will be considered only if the request is submitted within 24 hours of placing the order. However, please note that cancellation requests cannot be entertained once the order has been assigned to our editing/rendering team or is already marked as completed/delivered.",
        icon: Calendar
    },
    {
        id: "refund-policy",
        title: "2. Refund Policy",
        content: "For digital products (such as templates and custom project downloads), due to the non-tangible and instantly downloadable nature of the assets, we do not issue refunds once the download link has been accessed or generated. If you experience technical defects, compatibility problems, or file corruption, please contact our support team. Service-based creative orders are reviewed case-by-case; partial refunds may be approved if work hasn't begun or is in early stages.",
        icon: CreditCard
    },
    {
        id: "processing",
        title: "3. Processing Refunds",
        content: "If your refund request is approved, it will be automatically processed and credited back to your original payment method (via Razorpay secure gateway). The refunded amount usually takes 5-7 business days to reflect in your bank account, depending on your bank's clearance times.",
        icon: RefreshCw
    }
];

export default function Refund() {
    const { seoData } = useSeo('refund');
    return (
        <div className="bg-slate-50 min-h-screen text-slate-800 font-sans antialiased selection:bg-purple-100 selection:text-purple-900">
            <SeoHead
                title={seoData?.meta_title || seoData?.title || "Refund Policy | Adbuth"}
                description={seoData?.meta_description || seoData?.description || "Refund and Cancellation Policy for Adbuth Verse."}
                data={seoData}
            />
            
            <Navbar isdark={false} highlight="" />

            {/* Header */}
            <div className="bg-white border-b border-slate-200 pt-32 pb-16">
                <div className="max-w-6xl mx-auto px-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 mb-3 uppercase tracking-wider">
                        Store Policy
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                        Refund and Cancellation Policy
                    </h1>
                    <p className="mt-2 text-slate-500 max-w-2xl text-sm sm:text-base leading-relaxed">
                        Our policy is designed to be fair to both our customers and our business operations. Please review our refund guidelines.
                    </p>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="max-w-6xl mx-auto px-6 py-12">
                <div className="flex flex-col lg:flex-row gap-10">
                    {/* Sticky Sidebar Nav (Desktop) */}
                    <aside className="hidden lg:block sticky top-28 self-start w-56 shrink-0">
                        <nav className="space-y-1">
                            {SECTIONS.map((sec) => (
                                <a
                                    key={sec.id}
                                    href={`#${sec.id}`}
                                    className="block px-3 py-2 text-sm font-medium text-slate-600 rounded-md hover:text-slate-950 hover:bg-slate-100 transition-colors"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        document.getElementById(sec.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }}
                                >
                                    {sec.title}
                                </a>
                            ))}
                        </nav>
                    </aside>

                    {/* Content Section */}
                    <div className="flex-1 min-w-0 space-y-8">
                        {SECTIONS.map((sec) => {
                            const IconComponent = sec.icon;
                            return (
                                <div
                                    key={sec.id}
                                    id={sec.id}
                                    className="scroll-mt-28 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm transition-shadow hover:shadow-md duration-300"
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                                            <IconComponent size={20} />
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-950">
                                            {sec.title}
                                        </h2>
                                    </div>
                                    <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                                        {sec.content}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
