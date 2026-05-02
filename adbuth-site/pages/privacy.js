import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SeoHead from '../components/SeoHead';
import useSeo from '../hooks/useSeo';

export default function Privacy() {
    const { seoData } = useSeo('privacy');
    return (
        <div className="bg-white min-h-screen font-sans">
            <SeoHead
                title={seoData?.meta_title || seoData?.title || "Privacy Policy | Adbuth"}
                description={seoData?.meta_description || seoData?.description || "Privacy Policy for Adbuth Media Works."}
                data={seoData}
            />
            <Navbar isdark={true} />

            <div className="max-w-4xl mx-auto px-6 py-20 text-gray-800">
                <h1 className="text-4xl font-bold mb-8 text-[#7D287E]">Privacy Policy</h1>
                <p className="mb-4 text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>

                <div className="space-y-6 leading-relaxed">
                    <p>At Adbuth Media Works, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">1. Information We Collect</h2>
                    <p>We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us. This may include your name, email address, phone number, and payment information.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">2. How We Use Your Information</h2>
                    <p>We use the information we collect to process your orders, provide customer support, and improve our services.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">3. Data Security</h2>
                    <p>We implement appropriate security measures to protect your personal information.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">4. Contact Us</h2>
                    <p>If you have questions about this policy, please contact us at adbuthdigitalsolutions@gmail.com.</p>
                </div>
            </div>

            <Footer />
        </div>
    );
}
