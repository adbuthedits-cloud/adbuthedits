import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faFacebook, faYoutube, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import SeoHead from '../components/SeoHead';
import useSeo from '../hooks/useSeo';
import { cdnImage } from '../utils/cdn';


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
            <section className="text-white md:h-[50vh] lg:h-[80vh] h-[65vh]  flex md:items-end items-center px-6 pb-24 lg:px-20 md:px-16 relative bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('${cdnImage("https://assets.adbuthverse.com/website-assets/pages/contact/contact-header-bg.webp")}')` }}>
                <div className="max-w-7xl lg:mx-20 mx-0">
                    <div className="max-w-xl">
                        <h1 className="text-4xl lg:text-6xl md:text-4xl font-bold mb-4 md:mb-14 lg:mb-4">Contact Us</h1>
                        <p className="text-gray-400 text-sm md:text-base lg:mb-16 md:mb-16 mb-12">For all the Post video editing services</p>

                        <div className="flex gap-6 text-2xl">
                            <a target='_blank' href="https://www.instagram.com/adbuthproductions/" className="hover:text-pink-500 transition-colors"><FontAwesomeIcon icon={faInstagram} /></a>
                            <a target='_blank' href="https://www.facebook.com/jayasadbuthproductionsllp/" className="hover:text-blue-500 transition-colors"><FontAwesomeIcon icon={faFacebook} /></a>
                            <a target='_blank' href="https://www.youtube.com/@JayasAdbuth" className="hover:text-red-500 transition-colors"><FontAwesomeIcon icon={faYoutube} /></a>
                            <a target='_blank' href="https://www.linkedin.com/in/jayasadbuth/" className="hover:text-blue-500 transition-colors"><FontAwesomeIcon icon={faLinkedin} /></a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content Area (Overlap) */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pb-20">
                <div className="grid  gap-10 items-start">

                    {/* Left Side (Desktop) / Bottom (Mobile) - Text & Call Card */}
                    <div className="lg:col-span-5 flex flex-col justify-between h-full pt-[450px] lg:pt-72 order-2 lg:order-1">
                        {/* Text Content */}
                        <div className="lg:mb-20">
                            <h2 className="text-3xl lg:text-4xl font-bold text-black mb-6 leading-tight w-96">
                                You are one step closer<br /> to build your perfect stories
                            </h2>
                            <p className="text-xl font-bold text-black">Just send a Message</p>
                        </div>


                    </div>

                    {/* Right Side - Form Card */}
                    <div className="lg:col-span-7 absolute left-0 right-0 mx-auto w-[90%] lg:w-full lg:max-w-[55%] lg:left-auto lg:right-0 -top-56 lg:-top-64 lg:mr-10">
                        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
                            {/* Header Image */}
                            <div className="h-24 lg:h-48 w-full bg-cover bg-center flex items-center justify-center text-center px-4" style={{ backgroundImage: `url('${cdnImage("https://assets.adbuthverse.com/website-assets/pages/contact/contact-form-header.webp")}')` }}>
                                <h3 className="text-white text-sm lg:text-2xl font-bold leading-relaxed">
                                    Write us a few words about your project and we’ll<br className="hidden lg:block" /> prepare a proposal for you within 24 hours
                                </h3>
                            </div>

                            {/* Form Fields */}
                            <div className="p-8 lg:p-12">
                                <form onSubmit={handleSubmit} className="space-y-6 text-xs lg:text-base">
                                    <div className="grid grid-cols-2 gap-6 ">
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
                                    <div className="grid lg:grid-cols-2 gap-6">
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

                                    <div className="bg-gray-100 p-4 rounded h-28 lg:h-40">
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
                                        className="w-full bg-[#000B60] text-white font-bold py-3 lg:py-4 rounded hover:bg-black transition-colors disabled:opacity-70"
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


                    {/* Mobile/Tablet Only Call Card (Order 3) */}
                    <div className="lg:hidden order-3 w-full ">
                        <div className="mt-12">
                            <h3 className="text-3xl font-bold text-black mb-8">You Can<br />Directly Call Us</h3>
                            <div className="bg-[#000B60] text-white p-8 rounded-2xl shadow-xl w-full">
                                <div className="flex flex-col lg:flex-row lg:justify-between justify-around lg:items-center items-start h-32">
                                    <div className="flex flex-col mb-5">
                                        <span className="text-base">Mobile number</span>
                                        <a href="tel:+919182683055">+91 91826 83055</a>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-base">Mail Us on</span>
                                        <a href="mailto:[adbuthedits@gmail.com]">adbuthedits@gmail.com</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
            {/* Call Card Desktop */}
            <div className="hidden lg:flex px-40 mb-24 mt-16 flex-row justify-around items-center gap-20">
                <h3 className="text-3xl font-bold text-black mb-8">You Can<br />Directly Call Us</h3>
                <div className="bg-[#000B60] text-white p-10 rounded-2xl shadow-xl w-full max-w-lg">
                    <div className="flex flex-row justify-between items-center ">
                        <div className="mb-4 flex flex-col">
                            <span className="text-lg mr-20 mb-2">Mobile number </span>
                            <a href="tel:+919182683055">+91 91826 83055</a>
                        </div>
                        <div className="mb-4 flex flex-col">
                            <span className="text-lg mr-20 mb-2">Mail Us on</span>
                            <a href="mailto:[adbuthedits@gmail.com]">adbuthedits@gmail.com</a>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
