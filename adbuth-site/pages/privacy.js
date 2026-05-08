import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SeoHead from '../components/SeoHead';
import useSeo from '../hooks/useSeo';

export default function Privacy() {
    const { seoData } = useSeo('privacy');
    return (
        <div className="bg-white min-h-screen font-sans pt-24">
            <SeoHead
                title={seoData?.meta_title || seoData?.title || "Privacy Policy | Adbuth"}
                description={seoData?.meta_description || seoData?.description || "Privacy Policy for Adbuth Verse."}
                data={seoData}
            />
            <Navbar isdark={false} />

            <div className="max-w-4xl mx-auto px-6 py-20 text-gray-800">
                <h1 className="text-4xl font-bold mb-8 text-[#7D287E]">Privacy Policy</h1>
                <p className="mb-4 text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>

                <div className="space-y-8 leading-relaxed text-gray-700">
                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-gray-900">1. Introduction</h2>
                        <p>Welcome to Adbuth Verse. We value your privacy and are committed to protecting your personal data. This policy outlines how we handle your information when you use our website and services, including Social Login features.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-gray-900">2. Information We Collect</h2>
                        <p>We collect information that you provide directly to us or via third-party services:</p>
                        <ul className="list-disc ml-6 mt-2 space-y-2">
                            <li><strong>Account Information:</strong> Name, email address, and profile details.</li>
                            <li><strong>Social Media Data:</strong> If you choose to log in via Facebook, Google, or X (Twitter), we receive your public profile information and email address as permitted by your privacy settings on those platforms.</li>
                            <li><strong>Usage Data:</strong> Information about how you interact with our site.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-gray-900">3. How We Use Your Information</h2>
                        <p>We use your data to:</p>
                        <ul className="list-disc ml-6 mt-2 space-y-2">
                            <li>Create and manage your user account.</li>
                            <li>Provide customer support and process transactions.</li>
                            <li>Improve our website performance and user experience.</li>
                            <li>Communicate updates, promotions, and service-related notices.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-gray-900">4. Data Deletion (Your Rights)</h2>
                        <p>In compliance with Facebook and other platform requirements, we provide a clear way for you to request the deletion of your data:</p>
                        <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 mt-4">
                            <p className="font-semibold text-[#7D287E]">To delete your account and associated data:</p>
                            <ol className="list-decimal ml-6 mt-2 space-y-2">
                                <li>Send an email to <strong>adbuthedits@gmail.com</strong> with the subject "Data Deletion Request".</li>
                                <li>Include your registered email address or Username.</li>
                                <li>We will process your request and permanently delete your data within 48-72 hours.</li>
                            </ol>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-gray-900">5. Data Sharing</h2>
                        <p>We do NOT sell your personal data to third parties. We only share information with service providers (like payment processors or authentication services) necessary to operate our business.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-gray-900">6. Cookies</h2>
                        <p>We use cookies to keep you logged in and remember your preferences. You can disable cookies in your browser settings, but some features may stop working.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-gray-900">7. Contact Us</h2>
                        <p>If you have any questions about this Privacy Policy or your data, please contact us at:</p>
                        <p className="mt-2 font-semibold">Email: adbuthedits@gmail.com</p>
                    </section>
                </div>
            </div>

            <Footer />
        </div>
    );
}
