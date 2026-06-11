import { FileText, Shield, Scale, Gavel, Users, CheckSquare, Award, Package, Eye, ShoppingCart, HelpCircle, FileCheck, RefreshCw, AlertTriangle, HelpCircle as HelpIcon, Mail } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SeoHead from '../components/SeoHead';
import useSeo from '../hooks/useSeo';

const SECTIONS = [
    {
        id: "definitions",
        title: "1. DEFINITIONS",
        content: (
            <div className="space-y-3">
                <p>For the purposes of these Terms and related policies:</p>
                <p><strong>"Adbuthverse", "Company", "we", "our", and "us"</strong> refer to Jaya's Adbuth Productions LLP and all affiliated brands, websites, platforms, services, products, employees, contractors, and representatives.</p>
                <p><strong>"Customer", "Client", "User", and "You"</strong> refer to any person or organization accessing the Website, purchasing Products, submitting information, or using our Services.</p>
                <p><strong>"Digital Products"</strong> include but are not limited to:</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li>Digital wedding invitations</li>
                    <li>Save-the-date invitations</li>
                    <li>Animated invitations</li>
                    <li>Event invitations</li>
                    <li>Video invitations</li>
                    <li>Invitation templates</li>
                    <li>Creative assets</li>
                    <li>Downloadable graphics</li>
                    <li>Motion graphics</li>
                    <li>Personalized digital designs</li>
                    <li>Digital media products</li>
                    <li>Other electronically delivered content</li>
                </ul>
                <p><strong>"Custom Product"</strong> means any product created, edited, modified, personalized, or customized based on customer requirements.</p>
                <p><strong>"Draft"</strong> means any preview, sample, concept, watermark version, review version, low-resolution version, or approval version provided to the customer before final delivery.</p>
                <p><strong>"Final Deliverable"</strong> means the completed digital file delivered to the customer after approval.</p>
                <p><strong>"Third-Party Assets"</strong> means any graphics, fonts, templates, stock elements, illustrations, animations, creative resources, plugins, software components, or licensed materials obtained from third-party providers.</p>
                <p><strong>"Platform"</strong> means the Adbuthverse website, applications, portals, payment systems, communication systems, and associated services.</p>
            </div>
        ),
        icon: FileText
    },
    {
        id: "acceptance",
        title: "2. ACCEPTANCE OF TERMS",
        content: (
            <div className="space-y-3">
                <p>By accessing the Website, creating an account, submitting an inquiry, making a purchase, or using any Adbuthverse product or service, you acknowledge that:</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li>You have read these Terms</li>
                    <li>You understand these Terms</li>
                    <li>You agree to be legally bound by these Terms</li>
                    <li>You agree to all related policies incorporated herein by reference</li>
                </ul>
                <p>If you do not agree with any part of these Terms, you must discontinue use of the Website immediately.</p>
            </div>
        ),
        icon: Shield
    },
    {
        id: "eligibility",
        title: "3. ELIGIBILITY",
        content: (
            <div className="space-y-3">
                <p>You represent and warrant that:</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li>You are at least eighteen (18) years of age</li>
                    <li>You possess legal capacity to enter into binding agreements</li>
                    <li>Any information you provide is accurate and complete</li>
                    <li>You are authorized to make purchases using the selected payment method</li>
                </ul>
                <p>We reserve the right to refuse service, suspend access, or cancel orders if eligibility requirements are not satisfied.</p>
            </div>
        ),
        icon: Users
    },
    {
        id: "nature-of-products",
        title: "4. NATURE OF PRODUCTS",
        content: (
            <div className="space-y-3">
                <p>Adbuthverse exclusively offers digital products and digital creative services.</p>
                <p>No physical products are shipped.</p>
                <p>Customers acknowledge that all products are delivered electronically and may include:</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li>Download links</li>
                    <li>Cloud delivery</li>
                    <li>Email delivery</li>
                    <li>Secure file transfer</li>
                    <li>Other electronic delivery methods</li>
                </ul>
                <p>Customers understand that product appearance may vary slightly depending on:</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li>Device screens</li>
                    <li>Operating systems</li>
                    <li>Software versions</li>
                    <li>Platform limitations</li>
                    <li>Display settings</li>
                </ul>
                <p>Such variations shall not constitute defects.</p>
            </div>
        ),
        icon: Package
    },
    {
        id: "product-descriptions",
        title: "5. PRODUCT DESCRIPTIONS",
        content: (
            <div className="space-y-3">
                <p>We make reasonable efforts to accurately describe products</p>
                <p>However:</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li>Colors may vary across devices</li>
                    <li>Preview images may be illustrative</li>
                    <li>Certain fonts may render differently</li>
                    <li>Animated content may perform differently on various platforms</li>
                </ul>
                <p>We do not guarantee exact visual consistency across all devices or applications.</p>
            </div>
        ),
        icon: Eye
    },
    {
        id: "order-acceptance",
        title: "6. ORDER ACCEPTANCE",
        content: (
            <div className="space-y-3">
                <p>Submission of an order does not guarantee acceptance.</p>
                <p>We reserve the right to:</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li>Accept or reject any order</li>
                    <li>Cancel suspicious transactions</li>
                    <li>Refuse service</li>
                    <li>Request identity verification</li>
                    <li>Request additional information</li>
                </ul>
                <p>An order becomes accepted only when payment has been successfully processed and confirmed.</p>
            </div>
        ),
        icon: ShoppingCart
    },
    {
        id: "pricing-payments",
        title: "7. PRICING AND PAYMENTS",
        content: (
            <div className="space-y-3">
                <p>All prices displayed are subject to change without prior notice.</p>
                <p>Prices may be displayed in multiple currencies.</p>
                <p>Applicable taxes, fees, duties, conversion fees, gateway charges, and banking charges may apply depending upon customer location and payment method.</p>
                <p>Customers are solely responsible for any charges imposed by:</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li>Banks</li>
                    <li>Payment gateways</li>
                    <li>Card issuers</li>
                    <li>Currency conversion providers</li>
                </ul>
                <p>Failure of payment authorization may result in order cancellation.</p>
            </div>
        ),
        icon: Scale
    },
    {
        id: "digital-delivery",
        title: "8. DIGITAL PRODUCT DELIVERY",
        content: (
            <div className="space-y-3">
                <p>All products are delivered electronically.</p>
                <p>Delivery methods may include:</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li>Email</li>
                    <li>Cloud storage</li>
                    <li>Secure download portals</li>
                    <li>Customer dashboard access</li>
                    <li>Third-party delivery platforms</li>
                </ul>
                <p>Customers are responsible for providing accurate contact information.</p>
                <p>We shall not be responsible for delivery issues caused by:</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li>Incorrect email addresses</li>
                    <li>Spam filters</li>
                    <li>Full inboxes</li>
                    <li>Network restrictions</li>
                    <li>Customer device limitations</li>
                </ul>
            </div>
        ),
        icon: Package
    },
    {
        id: "custom-services",
        title: "9. CUSTOM DESIGN SERVICES",
        content: (
            <div className="space-y-3">
                <p>For customized orders:</p>
                <p>Production begins only after:</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li>Payment confirmation</li>
                    <li>Submission of required information</li>
                    <li>Submission of required content</li>
                    <li>Receipt of customer instructions</li>
                </ul>
                <p>Customers must provide:</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li>Correct spelling</li>
                    <li>Correct dates</li>
                    <li>Accurate event information</li>
                    <li>Necessary photographs</li>
                    <li>Other requested materials</li>
                </ul>
                <p>The customer bears full responsibility for the accuracy of submitted information.</p>
            </div>
        ),
        icon: Award
    },
    {
        id: "customer-responsibilities",
        title: "10. CUSTOMER RESPONSIBILITIES",
        content: (
            <div className="space-y-3">
                <p>Customers agree to:</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li>Provide accurate information</li>
                    <li>Respond promptly to requests</li>
                    <li>Review drafts carefully</li>
                    <li>Verify spelling, dates, names, and details</li>
                    <li>Maintain copies of delivered files</li>
                </ul>
                <p>Failure to review drafts carefully shall not create liability for Adbuthverse.</p>
            </div>
        ),
        icon: CheckSquare
    },
    {
        id: "draft-review",
        title: "11. DRAFT REVIEW AND APPROVAL",
        content: (
            <div className="space-y-3">
                <p>Drafts are provided solely for review purposes.</p>
                <p>Upon approving a draft, the customer confirms that:</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li>The design direction is acceptable</li>
                    <li>All information has been verified</li>
                    <li>Required corrections have been communicated</li>
                </ul>
                <p>Draft approval constitutes acceptance of the approved content.</p>
                <p>Once approval is granted, any subsequent corrections may be treated as additional revisions and may incur additional charges.</p>
            </div>
        ),
        icon: FileCheck
    },
    {
        id: "revision-policy",
        title: "12. REVISION POLICY",
        content: (
            <div className="space-y-3">
                <p>Unless otherwise stated:</p>
                <p>Each customized order includes:</p>
                <p>Up to two (2) minor revisions.</p>
                <p>Minor revisions may include:</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li>Text corrections</li>
                    <li>Date changes</li>
                    <li>Minor color adjustments</li>
                    <li>Small layout refinements</li>
                </ul>
                <p>Major revisions include:</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li>Complete redesigns</li>
                    <li>New concepts</li>
                    <li>Theme changes</li>
                    <li>Structural modifications</li>
                    <li>Additional animation sequences</li>
                </ul>
                <p>Major revisions may incur additional fees.</p>
                <p>Determination of whether a revision is minor or major shall be made reasonably by Adbuthverse.</p>
            </div>
        ),
        icon: RefreshCw
    },
    {
        id: "project-delays",
        title: "13. PROJECT DELAYS CAUSED BY CUSTOMER",
        content: (
            <div className="space-y-3">
                <p>Delivery timelines are dependent upon customer cooperation.</p>
                <p>If the customer delays:</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li>Providing materials</li>
                    <li>Approvals</li>
                    <li>Feedback</li>
                    <li>Required information</li>
                </ul>
                <p>all delivery timelines shall automatically extend by the duration of such delay.</p>
                <p>Adbuthverse shall not be responsible for resulting scheduling impacts.</p>
            </div>
        ),
        icon: AlertTriangle
    },
    {
        id: "project-abandonment",
        title: "14. PROJECT ABANDONMENT",
        content: (
            <div className="space-y-3">
                <p>A project may be deemed abandoned if the customer becomes unresponsive for thirty (30) consecutive days.</p>
                <p>In such cases:</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li>Work may be suspended</li>
                    <li>Files may be archived</li>
                    <li>Delivery commitments may be terminated</li>
                </ul>
                <p>No refund shall be issued for abandoned projects.</p>
                <p>Reactivation may require additional fees.</p>
            </div>
        ),
        icon: AlertTriangle
    },
    {
        id: "warranties",
        title: "15. DISCLAIMER OF WARRANTIES",
        content: (
            <div className="space-y-3">
                <p>Products and services are provided on an "AS IS" and "AS AVAILABLE" basis.</p>
                <p>To the fullest extent permitted by law, Adbuthverse disclaims all warranties including:</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li>Merchantability</li>
                    <li>Fitness for a particular purpose</li>
                    <li>Non-infringement</li>
                    <li>Continuous availability</li>
                </ul>
                <p>We do not guarantee:</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li>Uninterrupted service</li>
                    <li>Error-free operation</li>
                    <li>Compatibility with every device or platform</li>
                </ul>
            </div>
        ),
        icon: HelpIcon
    },
    {
        id: "limitation-liability",
        title: "16. LIMITATION OF LIABILITY",
        content: (
            <div className="space-y-3">
                <p>To the maximum extent permitted by law:</p>
                <p>Adbuthverse shall not be liable for:</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li>Indirect damages</li>
                    <li>Consequential damages</li>
                    <li>Lost profits</li>
                    <li>Lost opportunities</li>
                    <li>Emotional distress</li>
                    <li>Reputational harm</li>
                    <li>Business interruption</li>
                </ul>
                <p>Our maximum liability shall never exceed the amount paid by the customer for the specific order giving rise to the claim.</p>
            </div>
        ),
        icon: Scale
    },
    {
        id: "governing-law",
        title: "17. GOVERNING LAW",
        content: (
            <div className="space-y-3">
                <p>These Terms shall be governed by the laws of India.</p>
                <p>Subject to applicable consumer protection laws, disputes shall be subject to the exclusive jurisdiction of courts located in Nellore, Andhra Pradesh, India.</p>
            </div>
        ),
        icon: Gavel
    },
    {
        id: "contact-info",
        title: "18. CONTACT INFORMATION",
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
