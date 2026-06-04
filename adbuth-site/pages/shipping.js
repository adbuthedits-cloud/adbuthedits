import { Download, Clock, Tag } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SeoHead from '../components/SeoHead';
import useSeo from '../hooks/useSeo';

const SECTIONS = [
    {
        id: "digital",
        title: "1. Digital Delivery",
        content: "All pre-made template purchases, graphics bundles, presets, and digital assets are delivered instantly. Upon successful payment verification, you will receive an automated email containing download links. You can also access all download links directly from your account orders dashboard.",
        icon: Download
    },
    {
        id: "service",
        title: "2. Service Delivery",
        content: "For customized editing, templates, and video projects, delivery will be completed according to the project timeline specified during checkout or outlined in the creative brief. Progress notifications will be sent to your registered email, and the final high-quality render files will be delivered digitally through your client dashboard.",
        icon: Clock
    },
    {
        id: "charges",
        title: "3. Shipping Charges",
        content: "Because all products and custom editing services provided by Adbuth Verse are delivered digitally, there are no physical shipping fees, packaging costs, or logistics charges associated with any transaction.",
        icon: Tag
    }
];

export default function Shipping() {
    const { seoData } = useSeo('shipping');
    return (
        <div className="bg-slate-50 min-h-screen text-slate-800 font-sans antialiased selection:bg-purple-100 selection:text-purple-900">
            <SeoHead
                title={seoData?.meta_title || seoData?.title || "Shipping Policy | Adbuth"}
                description={seoData?.meta_description || seoData?.description || "Shipping and Delivery Policy for Adbuth Verse."}
                data={seoData}
            />
            
            <Navbar isdark={false} highlight="" />

            {/* Header */}
            <div className="bg-white border-b border-slate-200 pt-32 pb-16">
                <div className="max-w-6xl mx-auto px-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 mb-3 uppercase tracking-wider">
                        Fulfillment Policy
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                        Shipping & Delivery Policy
                    </h1>
                    <p className="mt-2 text-slate-500 max-w-2xl text-sm sm:text-base leading-relaxed">
                        We deliver your design templates and customized creative projects quickly and securely. Review our digital shipping rules.
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
