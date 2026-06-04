import { Lock, Database, FileText, Trash2, Share2, Cookie, Mail } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SeoHead from '../components/SeoHead';
import useSeo from '../hooks/useSeo';

const SECTIONS = [
    {
        id: "intro",
        title: "1. Introduction",
        content: "Welcome to Adbuth Verse. We respect your privacy and are committed to safeguarding your personal data. This Privacy Policy details how we handle and protect your information when you use our website, services, and associated social media logins.",
        icon: Lock
    },
    {
        id: "collect",
        title: "2. Information We Collect",
        content: (
            <div className="space-y-3">
                <p>We collect personal information directly provided by you, automatically when visiting our site, or via linked third-party authentication services:</p>
                <ul className="list-disc ml-5 space-y-1.5">
                    <li><strong className="text-slate-900">Account profile credentials:</strong> First name, last name, email address, phone contact details, and brand name preferences.</li>
                    <li><strong className="text-slate-900">Social Login Authentication Data:</strong> If you connect via Facebook, Google, or X (Twitter) logins, we receive your public profile name, verified email, and profile avatar as authorized by your platform permissions.</li>
                    <li><strong className="text-slate-900">Customization Briefs:</strong> Form answers, text details, and uploaded media attachments (photos/videos) that you submit to customize templates.</li>
                </ul>
            </div>
        ),
        icon: Database
    },
    {
        id: "use",
        title: "3. How We Use Your Information",
        content: (
            <div className="space-y-3">
                <p>Adbuth Verse uses your collected data for the following essential business purposes:</p>
                <ul className="list-disc ml-5 space-y-1.5">
                    <li>To create, verify, and manage user accounts securely.</li>
                    <li>To process transactions, complete customizations, and render template orders.</li>
                    <li>To send automated notifications (such as sign-up OTP codes, order updates, and receipts).</li>
                    <li>To improve website performance, monitor page loading times, and prevent bot abuse.</li>
                </ul>
            </div>
        ),
        icon: FileText
    },
    {
        id: "deletion",
        title: "4. Data Deletion (Your Rights)",
        content: (
            <div className="space-y-4">
                <p>In strict compliance with Facebook, Google, and global privacy standards, you have the absolute right to request the permanent deletion of your account and all associated profile, transaction, and customization files from our servers.</p>
                <div className="bg-purple-50 border border-purple-200 p-5 sm:p-6 rounded-xl mt-2">
                    <p className="font-bold text-purple-700 mb-2 flex items-center gap-2">
                        <Trash2 size={16} /> How to Request Permanent Data Deletion:
                    </p>
                    <ol className="list-decimal ml-5 space-y-2 text-sm sm:text-base">
                        <li>Send an email to <strong className="text-slate-900 font-medium">adbuthedits@gmail.com</strong> with the subject line <strong className="text-slate-900 font-mono font-medium">"Data Deletion Request"</strong>.</li>
                        <li>Include your registered email address or account username in the email body.</li>
                        <li>Our system administrators will process your request and permanently delete all your data and account records within <strong className="text-purple-700">48 to 72 hours</strong>. We will send a final email confirmation once complete.</li>
                    </ol>
                </div>
            </div>
        ),
        icon: Trash2
    },
    {
        id: "sharing",
        title: "5. Data Sharing",
        content: "We do not sell, rent, or trade your personal data to marketing brokers or third parties. We share information only with trusted service providers necessary to run our platform operations (such as Razorpay for secure payments, Firebase for mobile authentication, and AWS for transactional email delivery).",
        icon: Share2
    },
    {
        id: "cookies",
        title: "6. Cookies",
        content: "We use essential functional cookies and local session storage keys to keep you logged in, preserve your active shopping cart state, and remember your dashboard settings. You can manage, disable, or delete cookies via your browser preferences, though doing so may limit your ability to access secure areas of our website.",
        icon: Cookie
    },
    {
        id: "contact",
        title: "7. Contact Us",
        content: (
            <div>
                <p>If you have any questions, compliance concerns, or general comments regarding this Privacy Policy or data storage practices, please reach out to our privacy officer:</p>
                <p className="mt-4 font-bold text-slate-900 flex items-center gap-2">
                    <Mail size={16} className="text-purple-700" /> Email: adbuthedits@gmail.com
                </p>
            </div>
        ),
        icon: Mail
    }
];

export default function Privacy() {
    const { seoData } = useSeo('privacy');
    return (
        <div className="bg-slate-50 min-h-screen text-slate-800 font-sans antialiased selection:bg-purple-100 selection:text-purple-900">
            <SeoHead
                title={seoData?.meta_title || seoData?.title || "Privacy Policy | Adbuth"}
                description={seoData?.meta_description || seoData?.description || "Privacy Policy for Adbuth Verse."}
                data={seoData}
            />
            
            <Navbar isdark={false} highlight="" />

            {/* Header */}
            <div className="bg-white border-b border-slate-200 pt-32 pb-16">
                <div className="max-w-6xl mx-auto px-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 mb-3 uppercase tracking-wider">
                        Data Protection
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                        Privacy Policy
                    </h1>
                    <p className="mt-2 text-slate-500 max-w-2xl text-sm sm:text-base leading-relaxed">
                        We value your privacy and are committed to protecting your personal data. This policy outlines how we handle and delete your information.
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
