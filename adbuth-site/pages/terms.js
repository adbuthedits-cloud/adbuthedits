import { FileText, Shield, Scale, Gavel } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SeoHead from '../components/SeoHead';
import useSeo from '../hooks/useSeo';

const SECTIONS = [
    {
        id: "services",
        title: "1. Services",
        content: "We provide professional digital media design and video editing services, alongside downloadable content (templates, presets, etc.). All sales, subscriptions, and custom services are subject to availability, processing limitations, and acceptance of the creative briefs provided.",
        icon: FileText
    },
    {
        id: "intellectual-property",
        title: "2. Intellectual Property",
        content: "All source files, templates, designs, graphics, text, logo assets, and video content hosted on this website are the intellectual property of Adbuth Verse. Purchasing a template grants you a single-use commercial or personal license to customize and render the asset. Sharing, reselling, or distributing the raw source project files (such as After Effects templates or graphic source folders) is strictly prohibited.",
        icon: Shield
    },
    {
        id: "limitation",
        title: "3. Limitation of Liability",
        content: "Adbuth Verse and its creative contributors shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use our digital assets, service delays, or communication errors. We do not guarantee that template compatibility will extend to unverified third-party software releases.",
        icon: Scale
    },
    {
        id: "governing-law",
        title: "4. Governing Law",
        content: "These terms and conditions are governed by and construed in accordance with the laws of India. By using our website and placing an order, you agree that any legal action, dispute, or claim arising out of your purchase will be filed exclusively in the courts located in Mumbai, India.",
        icon: Gavel
    }
];

export default function Terms() {
    const { seoData } = useSeo('terms');
    return (
        <div className="bg-slate-50 min-h-screen text-slate-800 font-sans antialiased selection:bg-purple-100 selection:text-purple-900">
            <SeoHead
                title={seoData?.meta_title || seoData?.title || "Terms and Conditions | Adbuth"}
                description={seoData?.meta_description || seoData?.description || "Terms and Conditions for Adbuth Verse."}
                data={seoData}
            />
            
            <Navbar isdark={false} highlight="" />

            {/* Header */}
            <div className="bg-white border-b border-slate-200 pt-32 pb-16">
                <div className="max-w-6xl mx-auto px-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 mb-3 uppercase tracking-wider">
                        Legal Agreement
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                        Terms of Service
                    </h1>
                    <p className="mt-2 text-slate-500 max-w-2xl text-sm sm:text-base leading-relaxed">
                        Please read these terms carefully before accessing or using our services. By placing an order, you agree to be bound by these terms.
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
