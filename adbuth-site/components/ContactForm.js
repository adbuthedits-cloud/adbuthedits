import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: numericValue }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.email.trim()) return 'Email is required';
    // Strict Email Validation
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      return 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) return 'Phone number is required';
    if (formData.phone.length !== 10) return 'Please enter a valid 10-digit phone number';
    if (!formData.message.trim()) return 'Message is required';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setIsSubmitting(true);
    try {
      const submissionData = {
        fullName: formData.name,
        email: formData.email,
        phone: formData.phone,
        requirementDesc: formData.message,
        service: 'General Inquiry',
      };

      const response = await axios.post('http://localhost:5000/api/enquiry', submissionData);

      if (response.data.success) {
        toast.success('Message sent successfully!');
        setFormData({ name: '', phone: '', email: '', message: '' });
      }
    } catch (error) {
      console.error('Contact Form Error:', error);
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="lg:py-24 py-12 bg-gray-100 text-black">
      <div className="max-w-6xl mx-auto px-12 md:px-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

        {/* Left Content */}
        <div className="pt-8">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight text-black">
            Let's<br className="md:hidden block" /> Create <br className="md:block hidden" /> Together!
          </h2>
          <p className="text-md md:text-xl text-gray-800 mb-5 leading-relaxed font-medium">
            Ready to bring your vision to life?
          </p>
          <p className="text-md md:text-xl text-gray-700 leading-relaxed max-w-md">
            Adbuth Media works is here to help
            you stand out in the crowd!
          </p>
        </div>

        {/* Right Form Card */}
        <div className="bg-white p-8 rounded-[2rem] shadow-xl max-w-md mx-auto lg:mx-0 lg:ml-auto w-full">
          <h4 className="text-2xl md:text-3xl font-bold mb-2 text-black">Get in Touch</h4>
          <p className="text-gray-500 text-sm mb-8">You can reach us anytime</p>

          <form onSubmit={handleSubmit} className="space-y-4 text-sm md:text-base">
            <div className="grid grid-cols-1 gap-4">
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Name"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-900 transition-colors"
                disabled={isSubmitting}
              />
              <input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone number"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-900 transition-colors"
                disabled={isSubmitting}
                maxLength={10}
              />
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email ID"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-900 transition-colors"
                disabled={isSubmitting}
              />
            </div>

            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Message"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 h-32 resize-none text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-900 transition-colors"
              disabled={isSubmitting}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-[#2c3e80] text-white font-medium py-3 rounded-lg hover:bg-[#1a2b6d] transition-colors shadow-md mt-4 flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Submitting...
                </>
              ) : 'Submit'}
            </button>
          </form>
        </div>

      </div>
    </section>
  );
}
