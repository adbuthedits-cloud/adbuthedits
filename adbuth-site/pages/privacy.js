import { Lock, Database, FileText, Share2, Cookie, Mail, ShieldCheck, Clipboard, Globe } from 'lucide-react';
import Footer from '../components/Footer';
import SeoHead from '../components/SeoHead';
import useSeo from '../hooks/useSeo';

const SECTIONS = [
    {
        id: "intro",
        title: "1. INTRODUCTION",
        content: (
            <div className="space-y-3">
                <p>At Adbuthverse, we respect and protect your privacy.</p>
                <p>This Privacy Policy explains:</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li>What information we collect</li>
                    <li>How we collect it</li>
                    <li>Why we collect it</li>
                    <li>How we use it</li>
                    <li>How we protect it</li>
                    <li>Your rights regarding your personal information</li>
                </ul>
                <p>This Privacy Policy applies to:</p>
                <ul className="list-disc ml-5 space-y-1 mb-3">
                    <li>Website visitors</li>
                    <li>Customers</li>
                    <li>Prospective customers</li>
                    <li>Business partners</li>
                    <li>Service users worldwide</li>
                </ul>
                <p>By using our Website or Services, you acknowledge that you have read and understood this Privacy Policy.</p>
            </div>
        ),
        icon: Lock
    },
    {
        id: "data-controller",
        title: "2. DATA CONTROLLER",
        content: (
            <div className="space-y-3">
                <p>For the purposes of applicable privacy laws, the data controller is:</p>
                <p>Jaya's Adbuth Productions LLP<br />Nellore, Andhra Pradesh, India<br />Email: privacy@adbuthverse.com<br />Support Email: support@adbuthverse.com</p>
            </div>
        ),
        icon: ShieldCheck
    },
    {
        id: "info-collect",
        title: "3. INFORMATION WE COLLECT",
        content: (
            <div className="space-y-4">
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">A. Information You Provide</h3>
                    <p>We may collect: Full name, Email address, Phone number, Billing address, Event information, Customer preferences, Uploaded photographs, Uploaded videos, Uploaded graphics, Uploaded logos, Uploaded design materials, Communication records, Support requests.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">B. Payment Information</h3>
                    <p>Payments are processed through third-party payment providers. We generally do not store: Full credit card numbers, Debit card numbers, CVV information. Payment processors may collect information necessary to process transactions.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">C. Account Information</h3>
                    <p>Where applicable, we may collect: Login credentials, User preferences, Saved settings, Purchase history.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">D. Technical Information</h3>
                    <p>We may automatically collect: IP address, Browser type, Device information, Operating system, Referral URLs, Website activity, Session information, Time zone, Geographic region.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">E. Analytics Information</h3>
                    <p>We may collect: Website usage statistics, Page views, Click patterns, Conversion data, Marketing performance information.</p>
                </div>
            </div>
        ),
        icon: Database
    },
    {
        id: "how-collect",
        title: "4. HOW WE COLLECT INFORMATION",
        content: (
            <p>We collect information when: You visit our Website, You create an account, You place an order, You submit forms, You upload content, You subscribe to newsletters, You contact support, You participate in promotions, You interact with our advertising.</p>
        ),
        icon: Database
    },
    {
        id: "purposes",
        title: "5. PURPOSES OF PROCESSING",
        content: (
            <div className="space-y-4">
                <p>We process personal information for legitimate business purposes including:</p>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">Order Fulfillment</h3>
                    <p>Processing orders, Delivering digital products, Providing customer support, Managing revisions, Managing downloads.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">Communication</h3>
                    <p>Customer support, Service notifications, Order updates, Security notices, Legal notices.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">Payment Processing</h3>
                    <p>Transaction verification, Fraud prevention, Billing management, Refund administration.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">Website Improvement</h3>
                    <p>Analytics, User experience optimization, Technical improvements, Error diagnostics.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">Marketing</h3>
                    <p>Where permitted by law: Promotional emails, Newsletters, Product announcements, Special offers. You may opt out at any time.</p>
                </div>
            </div>
        ),
        icon: FileText
    },
    {
        id: "legal-basis",
        title: "6. LEGAL BASIS FOR PROCESSING (GDPR / UK GDPR)",
        content: (
            <div className="space-y-4">
                <p>For users located in the European Economic Area (EEA) or United Kingdom, we process personal information based on:</p>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">Contract Performance</h3>
                    <p>To: Deliver purchased products, Process payments, Provide support, Fulfill contractual obligations.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">Legitimate Interests</h3>
                    <p>To: Improve services, Prevent fraud, Secure systems, Analyze business performance.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">Consent</h3>
                    <p>For: Marketing communications, Optional cookies, Promotional activities.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">Legal Obligations</h3>
                    <p>To: Maintain accounting records, Comply with laws, Respond to lawful requests.</p>
                </div>
            </div>
        ),
        icon: ShieldCheck
    },
    {
        id: "customer-content",
        title: "7. CUSTOMER CONTENT",
        content: (
            <div className="space-y-3">
                <p>Customers may upload: Photographs, Videos, Event details, Names, Graphics, Logos, Design assets.</p>
                <p>Such content is processed solely for: Product creation, Product customization, Product delivery.</p>
                <p>We do not claim ownership of customer-uploaded content. However, customers grant Adbuthverse a limited license necessary to perform requested services.</p>
            </div>
        ),
        icon: Clipboard
    },
    {
        id: "third-party",
        title: "8. THIRD-PARTY SERVICE PROVIDERS",
        content: (
            <p>We may use third-party providers for: Payment processing, Website hosting, Cloud storage, Analytics, Email delivery, Customer support, Security monitoring. These providers may access information only as necessary to provide services.</p>
        ),
        icon: Share2
    },
    {
        id: "international-transfers",
        title: "9. INTERNATIONAL DATA TRANSFERS",
        content: (
            <p>Because Adbuthverse serves customers globally, personal information may be transferred to and processed in: India, United States, European Union countries, United Kingdom, Canada, Australia, Other jurisdictions where service providers operate. By using our Services, you acknowledge such transfers. Where legally required, appropriate safeguards will be implemented.</p>
        ),
        icon: Globe
    },
    {
        id: "security",
        title: "10. DATA SECURITY",
        content: (
            <p>We implement commercially reasonable safeguards including: SSL encryption, Secure payment processing, Access controls, Password protections, Firewall protections, Internal confidentiality procedures. No method of transmission or storage can be guaranteed as completely secure.</p>
        ),
        icon: Lock
    },
    {
        id: "children",
        title: "11. CHILDREN'S PRIVACY",
        content: (
            <p>Our services are not directed toward individuals under eighteen (18) years of age. We do not knowingly collect personal information from children. If such information is discovered, it will be deleted.</p>
        ),
        icon: ShieldCheck
    },
    {
        id: "marketing",
        title: "12. MARKETING COMMUNICATIONS",
        content: (
            <p>You may receive marketing communications if: You subscribe voluntarily, Applicable laws permit communication. You may unsubscribe at any time through: Email links, Contact requests, Account settings where available.</p>
        ),
        icon: Mail
    },
    {
        id: "rights",
        title: "13. YOUR PRIVACY RIGHTS",
        content: (
            <div className="space-y-4">
                <p>Depending upon your jurisdiction, you may have rights including:</p>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">Right of Access</h3>
                    <p>Request access to personal information.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">Right of Correction</h3>
                    <p>Request correction of inaccurate information.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">Right of Deletion</h3>
                    <p>Request deletion of personal information.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">Right of Restriction</h3>
                    <p>Request restricted processing.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">Right of Portability</h3>
                    <p>Request data transfer where applicable.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">Right to Object</h3>
                    <p>Object to certain processing activities.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">Right to Withdraw Consent</h3>
                    <p>Withdraw consent at any time.</p>
                </div>
            </div>
        ),
        icon: ShieldCheck
    },
    {
        id: "gdpr-rights",
        title: "14. GDPR RIGHTS",
        content: (
            <p>For EEA and UK users: You may request: Access, Rectification, Erasure, Restriction, Portability, Objection. Requests should be directed to: privacy@adbuthverse.com</p>
        ),
        icon: ShieldCheck
    },
    {
        id: "response-period",
        title: "15. RESPONSE PERIOD",
        content: (
            <p>We generally respond to privacy requests within: Thirty (30) days, unless additional time is permitted by law.</p>
        ),
        icon: Clipboard
    },
    {
        id: "complaints",
        title: "16. COMPLAINTS",
        content: (
            <p>EEA and UK residents may file complaints with their applicable supervisory authority. Nothing in this Policy limits such rights.</p>
        ),
        icon: ShieldCheck
    },
    {
        id: "what-cookies",
        title: "17. WHAT ARE COOKIES",
        content: (
            <p>Cookies are small text files stored on your device. They help: Website functionality, Security, Analytics, User preferences.</p>
        ),
        icon: Cookie
    },
    {
        id: "cookie-types",
        title: "18. TYPES OF COOKIES WE USE",
        content: (
            <div className="space-y-4">
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">Essential Cookies</h3>
                    <p>Required for: Website operation, Security, Checkout functionality, Session management. These cannot generally be disabled.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">Analytics Cookies</h3>
                    <p>Used to: Measure traffic, Analyze performance, Improve functionality.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">Functional Cookies</h3>
                    <p>Used to: Remember preferences, Improve user experience.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">Marketing Cookies</h3>
                    <p>Used to: Deliver advertisements, Measure campaign performance, Personalize content. Marketing cookies are deployed only where permitted by law.</p>
                </div>
            </div>
        ),
        icon: Cookie
    },
    {
        id: "cookie-consent",
        title: "19. COOKIE CONSENT",
        content: (
            <p>Where required by applicable laws: Visitors will be provided options to: Accept all cookies, Reject non-essential cookies, Customize preferences. Consent may be withdrawn at any time.</p>
        ),
        icon: Cookie
    },
    {
        id: "third-party-cookies",
        title: "20. THIRD-PARTY COOKIES",
        content: (
            <p>Third-party services may set cookies including: Analytics providers, Advertising providers, Payment processors, Social media integrations. Such providers maintain their own privacy policies.</p>
        ),
        icon: Cookie
    },
    {
        id: "retention-principles",
        title: "21. RETENTION PRINCIPLES",
        content: (
            <p>We retain information only as long as reasonably necessary for: Service delivery, Legal compliance, Accounting obligations, Security purposes, Business operations.</p>
        ),
        icon: Clipboard
    },
    {
        id: "retention-periods",
        title: "22. RETENTION PERIODS",
        content: (
            <div className="space-y-4">
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">Customer Orders</h3>
                    <p>Retained for up to seven (7) years.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">Invoices</h3>
                    <p>Retained for up to seven (7) years.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">Support Communications</h3>
                    <p>Retained for up to three (3) years.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">Marketing Information</h3>
                    <p>Retained until: Consent withdrawal, Opt-out request, Business necessity ends.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">Analytics Information</h3>
                    <p>Retained according to applicable analytics settings and legal requirements.</p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 mb-1">Customer Files</h3>
                    <p>Customer files may be archived, deleted, or removed after project completion. Customers are responsible for maintaining backups of delivered files. Adbuthverse does not guarantee indefinite file storage.</p>
                </div>
            </div>
        ),
        icon: Clipboard
    },
    {
        id: "deletion-requests",
        title: "23. DATA DELETION REQUESTS",
        content: (
            <p>Customers may request deletion of personal information. Certain information may be retained where necessary for: Legal compliance, Tax obligations, Fraud prevention, Contract enforcement.</p>
        ),
        icon: Clipboard
    },
    {
        id: "india",
        title: "24. INDIA",
        content: (
            <p>For Indian users, personal data is processed in accordance with applicable Indian laws, including the Digital Personal Data Protection Act, 2023 and related regulations.</p>
        ),
        icon: Globe
    },
    {
        id: "eu",
        title: "25. EUROPEAN UNION",
        content: (
            <p>For EU residents: Processing is performed in accordance with GDPR requirements where applicable.</p>
        ),
        icon: Globe
    },
    {
        id: "uk",
        title: "26. UNITED KINGDOM",
        content: (
            <p>For UK residents: Processing is performed in accordance with UK GDPR and related laws.</p>
        ),
        icon: Globe
    },
    {
        id: "canada",
        title: "27. CANADA",
        content: (
            <p>For Canadian residents: Information handling practices are designed to align with the principles of PIPEDA and applicable provincial privacy legislation.</p>
        ),
        icon: Globe
    },
    {
        id: "australia",
        title: "28. AUSTRALIA",
        content: (
            <p>For Australian residents: Information handling practices are designed to align with the Australian Privacy Act and Australian Privacy Principles where applicable.</p>
        ),
        icon: Globe
    },
    {
        id: "us",
        title: "29. UNITED STATES",
        content: (
            <p>Residents of certain U.S. states may possess additional privacy rights under applicable state laws. Such rights may include: Access requests, Deletion requests, Correction requests, Opt-out rights.</p>
        ),
        icon: Globe
    },
    {
        id: "changes",
        title: "30. CHANGES TO THIS POLICY",
        content: (
            <p>We may modify this Privacy Policy periodically. Changes become effective when published on the Website. Continued use of our Services constitutes acceptance of the revised Policy.</p>
        ),
        icon: Clipboard
    },
    {
        id: "contact-officer",
        title: "31. CONTACT INFORMATION",
        content: (
            <div className="space-y-3">
                <p>Privacy Officer<br />Jaya's Adbuth Productions LLP<br />Email: privacy@adbuthverse.com<br />Support Email: support@adbuthverse.com<br />Website: https://www.adbuthverse.com<br />Nellore, Andhra Pradesh, India</p>
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
