import { Calendar, CreditCard, RefreshCw, ShieldAlert, Mail } from 'lucide-react';
import Footer from '../components/Footer';
import SeoHead from '../components/SeoHead';
import useSeo from '../hooks/useSeo';

const SECTIONS = [
    {
        id: "refund-policy",
        title: "1. REFUND & CANCELLATION POLICY",
        content: (
            <div className="space-y-4">
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">General Rule</h3>
                    <p>Due to the digital and customized nature of our products, refunds are limited.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">Instant Download Products</h3>
                    <p>Once a digital product has been: Downloaded, Accessed, Delivered, Made available, it becomes non-refundable.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">Customized Products</h3>
                    <p>A customized order becomes non-refundable once: Production begins, Design work commences, Resources are allocated, Draft creation starts.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">Before Work Begins</h3>
                    <p>If cancellation is requested before work begins, Adbuthverse may issue a refund at its sole discretion after deducting: Gateway fees, Administrative costs, Processing charges.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">After Draft Creation</h3>
                    <p>No refunds shall be provided after: Draft creation, Preview delivery, Creative development, Design execution.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">After Approval</h3>
                    <p>No refunds shall be available after customer approval of any draft. Approval confirms customer acceptance of the design direction.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">After Final Delivery</h3>
                    <p>No refunds shall be issued after final files are delivered.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">Technical Defect Exception</h3>
                    <p>If a delivered file is: Corrupted, Unreadable, Inaccessible, and Adbuthverse cannot provide a functional replacement within a reasonable period, we may: Repair the file, Replace the file, Re-deliver the file. Refunds shall remain at Adbuthverse's discretion.</p>
                </div>
            </div>
        ),
        icon: CreditCard
    },
    {
        id: "chargeback-policy",
        title: "2. CHARGEBACK POLICY",
        content: (
            <div className="space-y-3">
                <p>Customers agree to contact Adbuthverse before initiating: Chargebacks, Payment disputes, Banking disputes, Payment gateway complaints.</p>
                <p>We reserve the right to submit evidence including: Order records, Communications, Draft approvals, Delivery records, Download logs, Customer acknowledgements.</p>
                <p>Fraudulent chargebacks may result in: Account suspension, Legal recovery efforts, Collection actions where legally permitted.</p>
            </div>
        ),
        icon: ShieldAlert
    },
    {
        id: "contact-info",
        title: "3. CONTACT INFORMATION",
        content: (
            <div className="space-y-3">
                <p>Jaya's Adbuth Productions LLP</p>
                <p>Email: support@adbuthverse.com</p>
                <p>Website: https://www.adbuthverse.com</p>
                <p>Address: Nellore, Andhra Pradesh, India</p>
            </div>
        ),
        icon: Mail
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
                    <aside className="hidden lg:block sticky top-28 self-start w-64 shrink-0">
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
                                    <div className="text-slate-600 leading-relaxed text-sm sm:text-base">
                                        {sec.content}
                                    </div>
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
