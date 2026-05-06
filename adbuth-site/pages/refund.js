import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SeoHead from '../components/SeoHead';
import useSeo from '../hooks/useSeo';

export default function Refund() {
    const { seoData } = useSeo('refund');
    return (
        <div className="bg-white min-h-screen font-sans">
            <SeoHead
                title={seoData?.meta_title || seoData?.title || "Refund Policy | Adbuth"}
                description={seoData?.meta_description || seoData?.description || "Refund and Cancellation Policy for Adbuth Verse."}
                data={seoData}
            />
            <Navbar isdark={true} />

            <div className="max-w-4xl mx-auto px-6 py-20 text-gray-800">
                <h1 className="text-4xl font-bold mb-8 text-[#7D287E]">Refund and Cancellation Policy</h1>

                <div className="space-y-6 leading-relaxed">
                    <p>Our policy is designed to be fair to both our customers and our business.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">1. Cancellation Policy</h2>
                    <p>Cancellations will be considered only if the request is made within 24 hours of placing the order. However, the cancellation request may not be entertained if the orders have been communicated to the processing team or have already been completed/shipped.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">2. Refund Policy</h2>
                    <p>For digital products, due to the nature of the content (instant download), we do not generally offer refunds once the files have been downloaded. However, if you face technical issues, please contact our support.</p>
                    <p>For service-based orders, refunds are processed on a case-by-case basis depending on the work completed.</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">3. Processing Refunds</h2>
                    <p>If approved, your refund will be processed within 5-7 working days and credited to your original payment method.</p>
                </div>
            </div>

            <Footer />
        </div>
    );
}
