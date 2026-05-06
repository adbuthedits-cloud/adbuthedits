import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faFacebook, faYoutube } from '@fortawesome/free-brands-svg-icons';
import SeoHead from '../components/SeoHead';
import useSeo from '../hooks/useSeo';

export default function ContactUs() {
    const { seoData } = useSeo('contact');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        city: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', msg: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Strict Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\d{10}$/;

        if (!formData.name || !formData.email || !formData.mobile || !formData.message) {
            setStatus({ type: 'error', msg: 'All fields are required.' });
            return;
        }

        if (!emailRegex.test(formData.email)) {
            setStatus({ type: 'error', msg: 'Please enter a valid email address.' });
            return;
        }

        if (!phoneRegex.test(formData.mobile)) {
            setStatus({ type: 'error', msg: 'Please enter a valid 10-digit mobile number.' });
            return;
        }

        setLoading(true);
        setStatus({ type: '', msg: '' });

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiUrl}/api/enquiry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: formData.name,
                    email: formData.email,
                    phone: formData.mobile,
                    city: formData.city,
                    service: 'General Inquiry',
                    requirementDesc: formData.message
                })
            });

            const data = await res.json();

            if (res.ok) {
                setStatus({ type: 'success', msg: 'Message sent successfully! We will contact you soon.' });
                setFormData({ name: '', email: '', mobile: '', city: '', message: '' });
            } else {
                setStatus({ type: 'error', msg: data.message || 'Failed to send message.' });
            }
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', msg: 'Something went wrong. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="font-sans overflow-x-hidden bg-white">
            <SeoHead
                title={seoData?.meta_title || seoData?.title || "Contact Us | Adbuth Verse"}
                description={seoData?.meta_description || seoData?.description || "Get in touch with us for your digital marketing needs."}
                image={seoData?.og_image || "/images/contact-bg.jpg"}
                data={seoData}
            />
            <Navbar highlight="contact" isdark={true} />

            {/* Hero / Header Section */}
            <section className="text-white md:h-[80vh] h-[65vh]  flex md:items-end items-center px-6 pb-24 lg:px-20 md:px-16 relative bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/contact/contact-header-bg.png')" }}>
                <div className="max-w-7xl lg:mx-20 mx-0">
                    <div className="max-w-xl">
                        <h1 className="text-4xl lg:text-6xl md:text-4xl font-bold mb-4">Contact Us</h1>
                        <p className="text-gray-400 text-sm md:text-base lg:mb-16 md:mb-16 mb-12">For all the Post video editing services</p>

                        <div className="flex gap-6 text-2xl">
                            <a href="#" className="hover:text-pink-500 transition-colors"><FontAwesomeIcon icon={faInstagram} /></a>
                            <a href="#" className="hover:text-blue-500 transition-colors"><FontAwesomeIcon icon={faFacebook} /></a>
                            <a href="#" className="hover:text-red-500 transition-colors"><FontAwesomeIcon icon={faYoutube} /></a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content Area (Overlap) */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pb-20">
                <div className="grid  gap-10 items-start">

                    {/* Left Side (Desktop) / Bottom (Mobile) - Text & Call Card */}
                    <div className="lg:col-span-5 flex flex-col justify-between h-full md:pt-56 pt-[450px] lg:pt-72 order-2 lg:order-1">
                        {/* Text Content */}
                        <div className="md:mb-20">
                            <h2 className="text-3xl md:text-xl lg:text-3xl font-bold text-black mb-6 leading-tight w-96">
                                You are one step closer<br /> to build your perfect product
                            </h2>
                            <p className="text-xl font-bold text-black">Just send a Message</p>
                        </div>


                    </div>

                    {/* Right Side - Form Card */}
                    <div className="lg:col-span-7 absolute left-0 right-0 mx-auto w-[90%] md:w-full md:max-w-[50%] lg:max-w-[55%] md:left-auto md:right-0 -lg:top-64 md:-top-44 -top-56 md:mr-10">
                        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
                            {/* Header Image */}
                            <div className="h-24 lg:h-48 md:h-28 w-full bg-cover bg-center flex items-center justify-center text-center px-4" style={{ backgroundImage: "url('https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/contact/contact-form-header.png')" }}>
                                <h3 className="text-white text-sm lg:text-2xl md:text-sm font-bold leading-relaxed">
                                    Write us a few words about your project and we’ll<br className="hidden md:block" /> prepare a proposal for you within 24 hours
                                </h3>
                            </div>

                            {/* Form Fields */}
                            <div className="p-8 lg:p-12 md:p-8">
                                <form onSubmit={handleSubmit} className="space-y-6 text-xs lg:text-base md:text-xs">
                                    <div className="grid grid-cols-2 md:grid-cols-2 gap-6 ">
                                        <div className="bg-gray-100 p-4 rounded">
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="Your Name"
                                                className="w-full bg-transparent outline-none text-black placeholder-gray-500"
                                            />
                                        </div>
                                        <div className="bg-gray-100 p-4 rounded">
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="Your Email"
                                                className="w-full bg-transparent outline-none text-black placeholder-gray-500"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="bg-gray-100 p-4 rounded">
                                            <input
                                                type="tel"
                                                name="mobile"
                                                value={formData.mobile}
                                                onChange={handleChange}
                                                maxLength={10}
                                                placeholder="Mobile Number"
                                                className="w-full bg-transparent outline-none text-black placeholder-gray-500"
                                            />
                                        </div>
                                        <div className="bg-gray-100 p-4 rounded">
                                            <input
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleChange}
                                                placeholder="City"
                                                className="w-full bg-transparent outline-none text-black placeholder-gray-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-gray-100 p-4 rounded md:h-40 h-28">
                                        <textarea
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            placeholder="Project Details"
                                            className="w-full h-full bg-transparent outline-none text-black resize-none placeholder-gray-500"
                                            required
                                        ></textarea>
                                    </div>

                                    {status.msg && (
                                        <div className={`text-center font-bold ${status.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                                            {status.msg}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-[#000B60] text-white font-bold md:py-4 py-3 rounded hover:bg-black transition-colors disabled:opacity-70"
                                    >
                                        {loading ? 'Sending...' : 'Send Message'}
                                    </button>

                                    <p className="text-center text-black font-bold lg:text-sm  text-[10px] mt-4">
                                        If you need more information contact us here @gmail.com
                                    </p>
                                </form>
                            </div>
                        </div>
                    </div>


                    {/* Mobile Only Call Card (Order 3) */}
                    <div className="md:hidden order-3 w-full ">
                        <div className="mt-12">
                            <h3 className="text-3xl font-bold text-black mb-8">You Can<br />Directly Call Us</h3>
                            <div className="bg-[#000B60] text-white p-8 rounded-2xl shadow-xl w-full">
                                <div className="flex flex-col md:flex-row md:justify-between justify-around md:items-center items-start h-32">
                                    <span className="text-base">Mobile number</span>
                                    <span className="text-base">Mail Us on</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
            {/* Call Card */}
            <div className="md:flex hidden lg:px-40 md:px-20 mb-24 mt-16 flex-row justify-around items-center gap-20">
                <h3 className="lg:text-3xl md:text-xl font-bold text-black mb-8">You Can<br />Directly Call Us</h3>
                <div className="bg-[#000B60] text-white p-10 rounded-2xl shadow-xl w-full lg:max-w-lg md:max-w-[350px]">
                    <div className="flex justify-between items-center ">
                        <span className="lg:text-lg md:text-xs mr-20">Mobile number</span>
                        <span className="lg:text-lg md:text-xs mr-20">Mail Us on</span>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
