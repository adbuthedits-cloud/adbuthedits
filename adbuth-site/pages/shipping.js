import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SeoHead from '../components/SeoHead';
import useSeo from '../hooks/useSeo';

export default function Shipping() {
    const { seoData } = useSeo('shipping');
    return (
        <div className="bg-white min-h-screen font-sans">
            <SeoHead
                title={seoData?.meta_title || seoData?.title || "Shipping Policy | Adbuth"}
                description={seoData?.meta_description || seoData?.description || "Shipping and Delivery Policy for Adbuth Verse."}
                data={seoData}
            />
            <Navbar isdark={true} />

            <div className="max-w-4xl mx-auto px-6 py-20 text-gray-800">
                <h1 className="text-4xl font-bold mb-8 text-[#7D287E]">Shipping and Delivery Policy</h1>

                <div className="space-y-6 leading-relaxed">
                    <p>For Digital Products & Services:</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">1. Digital Delivery</h2>
                    <p>All digital products (templates, presets, etc.) are delivered instantly via email or download link upon successful payment.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">2. Service Delivery</h2>
                    <p>Service-based orders will be delivered according to the timeline agreed upon at the time of purchase. You will receive updates via email/phone.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">3. Shipping Charges</h2>
                    <p>We do not charge any shipping fees for digital goods.</p>
                </div>
            </div>

            <Footer />
        </div>
    );
}
