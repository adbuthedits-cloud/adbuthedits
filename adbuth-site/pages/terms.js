import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SeoHead from '../components/SeoHead';
import useSeo from '../hooks/useSeo';

export default function Terms() {
    const { seoData } = useSeo('terms');
    return (
        <div className="bg-white min-h-screen font-sans">
            <SeoHead
                title={seoData?.meta_title || seoData?.title || "Terms and Conditions | Adbuth"}
                description={seoData?.meta_description || seoData?.description || "Terms and Conditions for Adbuth Media Works."}
                data={seoData}
            />
            <Navbar isdark={true} />

            <div className="max-w-4xl mx-auto px-6 py-20 text-gray-800">
                <h1 className="text-4xl font-bold mb-8 text-[#7D287E]">Terms and Conditions</h1>

                <div className="space-y-6 leading-relaxed">
                    <p>Welcome to Adbuth Media Works. By accessing our website and purchasing our services, you agree to these terms and conditions.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">1. Services</h2>
                    <p>We provide digital media services and products. All sales are subject to availability and acceptance.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">2. Intellectual Property</h2>
                    <p>All content on this website is the property of Adbuth Media Works.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">3. Limitation of Liability</h2>
                    <p>We shall not be liable for any indirect or consequential loss.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">4. Governing Law</h2>
                    <p>These terms shall be governed by the laws of India.</p>
                </div>
            </div>

            <Footer />
        </div>
    );
}
