import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { ChevronRight, ChevronDown, Check, Upload, X, Paperclip, ArrowRight, ArrowLeft } from 'lucide-react';

const STEPS = [
    { id: 1, title: 'Contact Details' },
    { id: 2, title: 'Service Category' },
    { id: 3, title: 'Project Details' },
    { id: 4, title: 'Review & Submit' }
];

const SERVICES = [
    {
        id: 'videos',
        title: 'Videos',
        subServices: ['Adbuth Edits', 'Adbuth Corporate', 'Adbuth Ads', 'Adbuth Politics', 'Adbuth Music Videos', 'Custom Video Project', 'Adbuth Movies']
    },
    {
        id: 'designing',
        title: 'Designing',
        subServices: ['Adbuth E-Invitations', 'Adbuth Graphics']
    },
    {
        id: 'learning',
        title: 'Learning',
        subServices: ['Adbuth DAM', 'Adbuth E-Learning ']
    }
];

export default function EnquiryForm() {
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        companyName: '',
        service: '',
        subService: '',
        requirementType: '',
        requirementDesc: '',
        timeline: '',
        driveLink: '',
        customService: '',
        customRequirementType: ''
    });
    const [attachments, setAttachments] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const fileInputRef = useRef(null);

    const [dialCode, setDialCode] = useState('91');

    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (user) {
            if (!isInitialized) {
                setFormData(prev => ({
                    ...prev,
                    firstName: user.first_name || '',
                    lastName: user.last_name || '',
                    email: user.email || '',
                    phone: user.phone_number || ''
                }));
                if (user.phone_number) {
                    if (user.phone_number.startsWith('91')) {
                        setDialCode('91');
                    } else if (user.phone_number.startsWith('+91')) {
                        setDialCode('91');
                    }
                }
                setIsInitialized(true);
            }
        } else {
            setFormData(prev => ({
                ...prev,
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                companyName: '',
                service: '',
                subService: '',
                requirementType: '',
                requirementDesc: '',
                timeline: '',
                driveLink: '',
                customService: '',
                customRequirementType: ''
            }));
            setIsInitialized(false);
        }
    }, [user, isInitialized]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Reset sub-service if service changes
        if (name === 'service') {
            setFormData(prev => ({ ...prev, service: value, subService: '' }));
        }
    };

    const handlePhoneChange = (value, country) => {
        // country.dialCode is only the numeric part, e.g. "91"
        setDialCode(country.dialCode);
        setFormData(prev => ({ ...prev, phone: value }));
    };

    const handleManualPhoneChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Numeric only
        setFormData(prev => ({ ...prev, phone: dialCode + value }));
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        const validFiles = selectedFiles.filter(file => {
            const isValidSize = file.size <= 50 * 1024 * 1024;
            if (!isValidSize) toast.error(`${file.name} is too large (>50MB)`);
            return isValidSize;
        });

        if (attachments.length + validFiles.length > 5) {
            toast.error('Maximum 5 attachments allowed');
            return;
        }
        setAttachments(prev => [...prev, ...validFiles]);
    };

    const removeFile = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const validateStep = (step) => {
        switch (step) {
            case 1:
                if (!formData.firstName.trim()) return 'First Name is required';
                if (!formData.lastName.trim()) return 'Last Name is required';
                if (!formData.email.trim()) return 'Email is required';
                // Strict Email Validation
                if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
                    return 'Please enter a valid email address';
                }
                if (!formData.phone || formData.phone.length < 8) return 'Valid phone number is required';
                return null;
            case 2:
                if (!formData.service) return 'Please select a service';
                if (formData.service === 'other') {
                    if (!formData.customService?.trim()) return 'Please specify the service you want';
                } else {
                    if (!formData.subService) return 'Please select a sub-service';
                }
                return null;
            case 3:
                if (!formData.requirementDesc.trim()) return 'Description is required';
                if (formData.requirementDesc.length < 10) return 'Please provide more details (min 10 chars)';
                if (formData.requirementType === 'Others' && !formData.customRequirementType?.trim()) {
                    return 'Please specify your requirement type or idea';
                }
                return null;
            default:
                return null;
        }
    };

    const nextStep = () => {
        const error = validateStep(currentStep);
        if (error) {
            toast.error(error);
            return;
        }
        setCurrentStep(prev => Math.min(prev + 1, 4));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const data = new FormData();

        // Object.keys(formData).forEach(key => {
        //     data.append(key, formData[key]);
        // });
        // Manually appending to include first/last name explicitly if needed, or just iterate
        Object.keys(formData).forEach(key => {
            data.append(key, formData[key]);
        });

        // Add full name for backward compatibility or backend preference if needed
        data.append('fullName', `${formData.firstName} ${formData.lastName}`);

        attachments.forEach(file => {
            data.append('attachments', file);
        });

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const response = await axios.post(`${apiUrl}/api/enquiry`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                setIsSuccess(true);
            }
        } catch (error) {
            console.error('Submission error:', error);
            toast.error(error.response?.data?.message || 'Failed to submit enquiry');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#7D287E]">
            <Head>
                <title>Start Your Project - Adbuth</title>
            </Head>

            <Navbar isdark={false} />

            <main className="pt-28 md:pt-40 lg:pt-44 pb-10 md:pb-20 px-3 md:px-8">
                <div className='bg-white pt-24 absolute top-0 left-0 w-full'></div>
                <div className="max-w-6xl mx-auto">
                    <div className="bg-white rounded-2xl md:rounded-[25px] shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[500px] lg:min-h-[600px] border-4 md:border-[12px] border-white/10">

                        {/* LEFT SIDEBAR - STEP INDICATOR */}
                        <div className="w-full lg:w-[360px] bg-[#F6E2F6] p-4 md:p-8 lg:p-8 flex flex-col">
                            <h1 className="text-lg md:text-2xl lg:text-2xl font-bold text-[#1A1A1A] mb-1.5 lg:mb-4 leading-[1.1] font-jakarta">
                                Start Your<br className="hidden lg:block" /> Project With Us
                            </h1>
                            <p className="text-gray-500 text-[10px] leading-relaxed mb-4 lg:mb-8 font-medium pr-4 hidden sm:block">
                                Have a project in mind? Video, Design, Learning? Fill the form below and we will get back to you within 24–48 hours.
                            </p>

                            <div className="w-full flex flex-row lg:flex-col justify-between lg:justify-start lg:space-y-10 gap-2 lg:gap-0 relative mt-1 lg:mt-0">
                                {/* Vertical Progress Line (Desktop) */}
                                <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-gray-200 hidden lg:block" />
                                <motion.div
                                    className="absolute left-[15px] top-4 w-0.5 bg-[#1FAF65] hidden lg:block"
                                    initial={{ height: 0 }}
                                    animate={{
                                        height: currentStep === 1 ? '0%' :
                                            currentStep === 2 ? '33%' :
                                                currentStep === 3 ? '66%' : '100%'
                                    }}
                                    transition={{ duration: 0.5, ease: "easeInOut" }}
                                />

                                {/* Horizontal Progress Line (Mobile/Tablet) */}
                                <div className="absolute left-[12.5%] right-[12.5%] top-[14px] lg:top-4 h-0.5 bg-gray-200 block lg:hidden" />
                                <motion.div
                                    className="absolute left-[12.5%] top-[14px] lg:top-4 h-0.5 bg-[#1FAF65] block lg:hidden"
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: currentStep === 1 ? '0%' :
                                            currentStep === 2 ? '25%' :
                                                currentStep === 3 ? '50%' : '75%'
                                    }}
                                    transition={{ duration: 0.5, ease: "easeInOut" }}
                                />

                                {STEPS.map((step) => {
                                    const isActive = currentStep === step.id;
                                    const isCompleted = currentStep > step.id;

                                    return (
                                        <div key={step.id} className="flex flex-col lg:flex-row items-center lg:items-start gap-1 md:gap-2 lg:gap-6 relative z-10 flex-1 lg:flex-none">
                                            <div className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs lg:text-sm font-bold transition-all duration-300 ${isCompleted ? 'bg-[#1FAF65] text-white shadow-lg' :
                                                isActive ? 'bg-[#7D287E] text-white shadow-lg scale-110' :
                                                    'bg-white text-gray-400 border border-gray-100'
                                                }`}>
                                                {isCompleted ? <Check className="w-3.5 h-3.5 lg:w-4 lg:h-4" strokeWidth={3} /> : step.id}
                                            </div>
                                            <span className={`text-[10px] md:text-xs lg:text-sm font-bold text-center lg:text-left transition-colors duration-300 ${isActive || isCompleted ? 'text-[#7D287E]' : 'text-gray-400'
                                                } hidden sm:block`}>
                                                {step.title}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* RIGHT SIDE - FORM CONTENT */}
                        <div className="flex-grow p-4 md:p-8 bg-white">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentStep}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full flex flex-col"
                                >
                                    {/* STEP 1: CONTACT DETAILS */}
                                    {currentStep === 1 && (
                                        <div className="space-y-4 md:space-y-6">
                                            <h2 className="text-base md:text-xl lg:text-2xl font-bold text-[#1A1A1A] mb-4 md:mb-8 font-jakarta">Your Contact Information</h2>

                                            <div className="space-y-4 md:space-y-6">
                                                {/* Full Name */}
                                                <div className="space-y-1.5 md:space-y-3">
                                                    <label className="text-xs lg:text-sm font-bold text-[#1A1A1A]">Full Name</label>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 lg:gap-10">
                                                        <input
                                                            type="text" name="firstName" value={formData.firstName} onChange={handleChange}
                                                            placeholder="First Name"
                                                            className="w-full bg-white border border-[#7D287E]/60 rounded-xl px-3 py-2 lg:px-5 lg:py-4 focus:ring-1 focus:ring-[#7D287E] outline-none transition-all placeholder:text-gray-400 text-xs md:text-sm font-medium text-black h-10 md:h-[52px] lg:h-[56px]"
                                                        />
                                                        <input
                                                            type="text" name="lastName" value={formData.lastName} onChange={handleChange}
                                                            placeholder="Last Name"
                                                            className="w-full bg-white border border-[#7D287E]/60 rounded-xl px-3 py-2 lg:px-5 lg:py-4 focus:ring-1 focus:ring-[#7D287E] outline-none transition-all placeholder:text-gray-400 text-xs md:text-sm font-medium text-black h-10 md:h-[52px] lg:h-[56px]"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Email Address */}
                                                <div className="space-y-1.5 md:space-y-3">
                                                    <label className="text-xs lg:text-sm font-bold text-[#1A1A1A]">Email Address</label>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 lg:gap-10">
                                                        <input
                                                            type="email" name="email" value={formData.email} onChange={handleChange}
                                                            placeholder="Your Email Address"
                                                            className="w-full bg-white border border-[#7D287E]/60 rounded-xl px-3 py-2 lg:px-5 lg:py-4 focus:ring-1 focus:ring-[#7D287E] outline-none transition-all placeholder:text-gray-400 text-xs md:text-sm font-medium text-black h-10 md:h-[52px] lg:h-[56px]"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Contact Details */}
                                                <div className="space-y-1.5 md:space-y-3">
                                                    <label className="text-xs lg:text-sm font-bold text-[#1A1A1A]">Contact Details</label>
                                                    <div className="flex gap-3 md:gap-4 max-w-2xl">
                                                        <div className="w-[80px] md:w-[100px] border border-[#7D287E] rounded-xl flex items-center bg-white h-10 md:h-[52px] lg:h-[56px] px-2 md:px-3 shrink-0 group transition-all">
                                                            <div className="relative w-full flex items-center gap-2">
                                                                <PhoneInput
                                                                    country={'in'}
                                                                    value={formData.phone}
                                                                    onChange={handlePhoneChange}
                                                                    containerClass="!w-auto"
                                                                    inputClass="!hidden"
                                                                    buttonClass="!bg-transparent !border-none !p-0 !h-auto !flex !items-center"
                                                                    dropdownClass="!bg-white !rounded-xl !shadow-2xl !border-gray-100"
                                                                />
                                                                <span className="text-xs md:text-sm font-bold ml-auto text-black">+{dialCode}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex-grow">
                                                            <input
                                                                type="tel" name="phone_num"
                                                                value={formData.phone.startsWith(dialCode) ? formData.phone.slice(dialCode.length) : formData.phone}
                                                                onChange={handleManualPhoneChange}
                                                                placeholder="Your Phone Number"
                                                                className="w-full h-10 md:h-[52px] lg:h-[56px] bg-white border border-[#7D287E]/60 rounded-xl px-3 py-2 lg:px-5 lg:py-4 focus:ring-1 focus:ring-[#7D287E] outline-none transition-all placeholder:text-gray-400 text-xs md:text-sm font-medium text-black"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Company/Brand Name */}
                                                <div className="space-y-1.5 md:space-y-3">
                                                    <label className="text-xs lg:text-sm font-bold text-[#1A1A1A]">Company/Brand Name (Optional)</label>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 lg:gap-10">
                                                        <input
                                                            type="text" name="companyName" value={formData.companyName} onChange={handleChange}
                                                            placeholder="Your Company Name"
                                                            className="w-full bg-white border border-[#7D287E]/60 rounded-xl px-3 py-2 lg:px-5 lg:py-4 focus:ring-1 focus:ring-[#7D287E] outline-none transition-all placeholder:text-gray-300 text-xs md:text-sm font-medium text-black h-10 md:h-[52px] lg:h-[56px]"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-4 md:pt-8">
                                                <hr className="border-gray-200" />
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 2: SERVICE CATEGORY */}
                                    {currentStep === 2 && (
                                        <div className="space-y-4 md:space-y-6">
                                            <h2 className="text-base md:text-xl lg:text-2xl font-bold text-[#1A1A1A] mb-4 md:mb-8 font-jakarta">Our Services</h2>

                                            <div className="space-y-5 md:space-y-8">
                                                <div className="space-y-1.5 md:space-y-3">
                                                    <label className="text-xs lg:text-sm font-bold text-[#1A1A1A]">Choose Your Service</label>
                                                    <div className="relative max-w-2xl">
                                                        <select
                                                            name="service" value={formData.service} onChange={handleChange}
                                                            className="w-full bg-white border border-[#7D287E]/60 rounded-xl px-3 py-2 lg:px-5 lg:py-4 focus:ring-1 focus:ring-[#7D287E] outline-none transition-all appearance-none cursor-pointer text-xs md:text-sm font-medium text-black h-10 md:h-[52px] lg:h-[56px]"
                                                        >
                                                            <option value="">Choose Your Service</option>
                                                            {SERVICES.map(s => (
                                                                <option key={s.id} value={s.id}>{s.title}</option>
                                                            ))}
                                                            <option value="other">Other</option>
                                                        </select>
                                                        <ChevronDown className="absolute right-4 lg:right-5 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-[#7D287E] pointer-events-none" />
                                                    </div>
                                                </div>

                                                {formData.service === 'other' && (
                                                    <div className="space-y-1.5 md:space-y-3 max-w-2xl">
                                                        <label className="text-xs lg:text-sm font-bold text-[#1A1A1A]">Specify Service Name</label>
                                                        <input
                                                            type="text"
                                                            name="customService"
                                                            value={formData.customService || ''}
                                                            onChange={handleChange}
                                                            placeholder="What service do you exactly want?"
                                                            className="w-full bg-white border border-[#7D287E]/60 rounded-xl px-3 py-2 lg:px-5 lg:py-4 focus:ring-1 focus:ring-[#7D287E] outline-none transition-all placeholder:text-gray-400 text-xs md:text-sm font-medium text-black h-10 md:h-[52px] lg:h-[56px]"
                                                        />
                                                    </div>
                                                )}

                                                <div className="space-y-1.5 md:space-y-3">
                                                    <label className="text-xs lg:text-sm font-bold text-[#1A1A1A]">Sub Service</label>
                                                    <div className="relative max-w-2xl">
                                                        <select
                                                            name="subService" 
                                                            value={formData.subService} 
                                                            onChange={handleChange}
                                                            disabled={formData.service === 'other'}
                                                            className="w-full bg-white border border-[#7D287E]/60 rounded-xl px-3 py-2 lg:px-5 lg:py-4 focus:ring-1 focus:ring-[#7D287E] outline-none transition-all appearance-none cursor-pointer text-xs md:text-sm font-medium text-black h-10 md:h-[52px] lg:h-[56px] disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <option value="">
                                                                {formData.service === 'other' ? 'N/A (Other Service selected)' : 'Choose Sub Service'}
                                                            </option>
                                                            {formData.service && formData.service !== 'other' && SERVICES.find(s => s.id === formData.service)?.subServices.map(sub => (
                                                                <option key={sub} value={sub}>{sub}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown className="absolute right-4 lg:right-5 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-[#7D287E] pointer-events-none" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-4 md:pt-8">
                                                <hr className="border-gray-200" />
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 3: PROJECT DETAILS */}
                                    {currentStep === 3 && (
                                        <div className="space-y-4 md:space-y-6">
                                            <h2 className="text-base md:text-xl lg:text-2xl font-bold text-[#1A1A1A] mb-4 md:mb-8 font-jakarta">Project Details</h2>

                                            <div className="space-y-4 md:space-y-6">
                                                <div className="space-y-1.5 md:space-y-3">
                                                    <label className="text-xs lg:text-sm font-bold text-[#1A1A1A]">Tell Us About Your Requirement</label>
                                                    <div className="relative max-w-2xl">
                                                        <select
                                                            name="requirementType" value={formData.requirementType} onChange={handleChange}
                                                            className="w-full bg-white border border-[#7D287E]/60 rounded-xl px-3 py-2 lg:px-5 lg:py-4 focus:ring-1 focus:ring-[#7D287E] outline-none transition-all appearance-none cursor-pointer text-xs md:text-sm font-medium text-black h-10 md:h-[52px] lg:h-[56px]"
                                                        >
                                                            <option value="">Specific Service</option>
                                                            <option value="New Project">New Project</option>
                                                            <option value="Ongoing Project">Ongoing Project</option>
                                                            <option value="Others">Others</option>
                                                        </select>
                                                        <ChevronDown className="absolute right-4 lg:right-5 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-[#7D287E] pointer-events-none" />
                                                    </div>
                                                </div>

                                                {formData.requirementType === 'Others' && (
                                                    <div className="space-y-1.5 md:space-y-3 max-w-2xl">
                                                        <label className="text-xs lg:text-sm font-bold text-[#1A1A1A]">Your Requirement Type / Idea</label>
                                                        <input
                                                            type="text"
                                                            name="customRequirementType"
                                                            value={formData.customRequirementType || ''}
                                                            onChange={handleChange}
                                                            placeholder="Briefly describe your idea or custom requirement..."
                                                            className="w-full bg-white border border-[#7D287E]/60 rounded-xl px-3 py-2 lg:px-5 lg:py-4 focus:ring-1 focus:ring-[#7D287E] outline-none transition-all placeholder:text-gray-400 text-xs md:text-sm font-medium text-black h-10 md:h-[52px] lg:h-[56px]"
                                                        />
                                                    </div>
                                                )}

                                                <div className="space-y-1.5 md:space-y-3">
                                                    <label className="text-xs lg:text-sm font-bold text-[#1A1A1A]">Describe your requirement</label>
                                                    <textarea
                                                        name="requirementDesc" value={formData.requirementDesc} onChange={handleChange}
                                                        placeholder="Tell us about your project, goals, and any references..."
                                                        className="w-full bg-white border border-[#7D287E]/60 rounded-xl px-3 py-2 lg:px-5 lg:py-4 focus:ring-1 focus:ring-[#7D287E] outline-none transition-all placeholder:text-gray-300 min-h-[100px] md:min-h-[160px] text-xs md:text-sm font-medium text-black"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 lg:gap-10">
                                                    <div className="space-y-1.5 md:space-y-3">
                                                        <label className="text-xs lg:text-sm font-bold text-[#1A1A1A]">Expected Timeline</label>
                                                        <input
                                                            type="text" name="timeline" value={formData.timeline} onChange={handleChange}
                                                            placeholder="e.g., 2 weeks, 1 month"
                                                            className="w-full bg-white border border-[#7D287E]/60 rounded-xl px-3 py-2 lg:px-5 lg:py-4 focus:ring-1 focus:ring-[#7D287E] outline-none transition-all placeholder:text-gray-300 text-xs md:text-sm font-medium text-black h-10 md:h-[52px] lg:h-[56px]"
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5 md:space-y-3">
                                                        <label className="text-xs lg:text-sm font-bold text-[#1A1A1A]">Any Attachments (Optional)</label>
                                                        <div
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className="w-full h-10 md:h-[52px] lg:h-[56px] bg-white border border-[#7D287E]/60 border-dashed rounded-xl px-3 lg:px-5 flex items-center justify-between cursor-pointer hover:bg-[#F6E2F6]/30 transition-all group"
                                                        >
                                                            <span className="text-xs md:text-sm text-gray-400 font-medium truncate pr-2">
                                                                {attachments.length > 0 ? `${attachments.length} file(s) selected` : 'Upload references/brief'}
                                                            </span>
                                                            <Paperclip className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-[#7D287E]" />
                                                            <input
                                                                type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden"
                                                                accept="image/*,video/*,.pdf,.doc,.docx,.zip,.rar"
                                                            />
                                                        </div>
                                                        <span className="block text-[10px] md:text-[11px] text-gray-400 font-medium mt-1">
                                                            Max 5 files, up to 50MB each
                                                        </span>
                                                        {attachments.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 mt-2">
                                                                {attachments.map((file, i) => (
                                                                    <div key={i} className="flex items-center gap-2 bg-[#F6E2F6]/30 px-3 py-1.5 rounded-full border border-[#7D287E]/10">
                                                                        <span className="text-[10px] font-bold text-[#7D287E] truncate max-w-[100px]">{file.name}</span>
                                                                        <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="text-[#7D287E] hover:text-red-500 transition-colors">
                                                                            <X className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Or Paste Drive Link */}
                                                <div className="space-y-1.5 md:space-y-3 mt-4 md:mt-6">
                                                    <label className="text-xs lg:text-sm font-bold text-[#1A1A1A]">Or Paste Shareable Link (Google Drive / Dropbox / OneDrive)</label>
                                                    <input
                                                        type="url"
                                                        name="driveLink"
                                                        value={formData.driveLink || ''}
                                                        onChange={handleChange}
                                                        placeholder="https://drive.google.com/..."
                                                        className="w-full bg-white border border-[#7D287E]/60 rounded-xl px-3 py-2 lg:px-5 lg:py-4 focus:ring-1 focus:ring-[#7D287E] outline-none transition-all placeholder:text-gray-400 text-xs md:text-sm font-medium text-black h-10 md:h-[52px] lg:h-[56px]"
                                                    />
                                                </div>
                                            </div>

                                            <div className="pt-4 md:pt-8">
                                                <hr className="border-gray-200" />
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 4: REVIEW & SUBMIT */}
                                    {currentStep === 4 && (
                                        <div className="space-y-4 md:space-y-12">
                                            <h2 className="text-base md:text-xl lg:text-2xl font-bold text-[#1A1A1A] mb-4 md:mb-10 font-jakarta">Review & Submit</h2>

                                            <div className="bg-[#FBF9F5]/50 rounded-2xl md:rounded-[32px] p-3 md:p-8 lg:p-12 space-y-2 md:space-y-5 border border-gray-100/50">
                                                {[
                                                    { label: 'Full Name', value: `${formData.firstName} ${formData.lastName}` },
                                                    { label: 'Email ID', value: formData.email },
                                                    { label: 'Contact Details', value: `+${formData.phone}` },
                                                    { label: 'Company/Brand Name', value: formData.companyName || 'Not Provided' },
                                                    { label: 'Service', value: formData.service === 'other' ? `Other: ${formData.customService}` : (SERVICES.find(s => s.id === formData.service)?.title || 'Not Specified') },
                                                    { label: 'Sub Service', value: formData.service === 'other' ? 'N/A' : (formData.subService || 'Not Specified') },
                                                    { label: 'Requirement Type', value: formData.requirementType === 'Others' ? `Other: ${formData.customRequirementType}` : (formData.requirementType || 'Not Specified') },
                                                    { label: 'Describe your requirement', value: formData.requirementDesc },
                                                    { label: 'Expected Timeline', value: formData.timeline || 'Not Specified' },
                                                    { label: 'Shareable Drive Link', value: formData.driveLink || 'Not Provided' },
                                                    { label: 'Any Attachments', value: attachments.length > 0 ? 'Yes' : 'No' }
                                                ].map((item, i) => (
                                                    <div key={i} className="flex flex-col md:flex-row md:items-start gap-1 md:gap-6 py-1 group cursor-default">
                                                        <span className="text-xs lg:text-[13px] font-bold text-[#1A1A1A] w-full md:w-[180px] lg:w-[240px] shrink-0">{item.label}</span>
                                                        <span className="hidden md:block text-gray-300 font-bold">-</span>
                                                        <span className="text-xs lg:text-[13px] font-medium text-gray-500 break-words flex-grow leading-relaxed">
                                                            {item.value}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* BUTTONS */}
                                    <div className="mt-auto pt-6 md:pt-16 flex justify-between items-center">
                                        {currentStep > 1 ? (
                                            <button
                                                onClick={prevStep}
                                                className="flex items-center gap-1.5 md:gap-2 text-gray-400 font-bold text-xs md:text-sm hover:text-[#7D287E] transition-all group"
                                            >
                                                <div className="w-7 h-7 md:w-9 h-9 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-[#7D287E] group-hover:text-white transition-all group-active:scale-95">
                                                    <ArrowLeft className="w-3.5 h-3.5 md:w-4 h-4" />
                                                </div>
                                                Back
                                            </button>
                                        ) : (
                                            <div />
                                        )}
                                        <div className="flex gap-3 md:gap-4">
                                            {currentStep < 4 ? (
                                                <button
                                                    onClick={nextStep}
                                                    className="bg-[#1FAF65] text-white px-6 py-2 md:px-12 md:py-4 rounded-full font-bold text-xs md:text-sm hover:bg-[#1a9354] hover:shadow-xl hover:shadow-[#1FAF65]/30 active:scale-95 transition-all flex items-center gap-1.5 md:gap-2"
                                                >
                                                    Next
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={handleSubmit}
                                                    disabled={isSubmitting}
                                                    className="bg-[#1FAF65] text-white px-7 py-2 md:px-14 md:py-4 rounded-full font-bold text-xs md:text-sm hover:bg-[#1a9354] hover:shadow-xl hover:shadow-[#1FAF65]/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isSubmitting ? 'Submitting...' : 'Submit Now'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </main>

            {/* SUCCESS MODAL */}
            <AnimatePresence>
                {isSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#000]/70 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-2xl md:rounded-[32px] p-6 md:p-16 max-w-lg w-full text-center shadow-2xl relative overflow-hidden"
                        >
                            {/* Animated Checkmark */}
                            <div className="mb-8 flex justify-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 260,
                                        damping: 20,
                                        delay: 0.2
                                    }}
                                    className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#1FAF65] flex items-center justify-center shadow-lg shadow-[#1FAF65]/30"
                                >
                                    <motion.div
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.5, delay: 0.5 }}
                                    >
                                        <Check className="w-10 h-10 md:w-12 md:h-12 text-white" strokeWidth={4} />
                                    </motion.div>
                                </motion.div>
                            </div>

                            <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-4 font-jakarta">Thank You!</h2>
                            <p className="text-gray-500 font-medium mb-6 md:mb-10 leading-relaxed text-sm md:text-base">
                                Your enquiry has been submitted successfully.<br />
                                We will contact you shortly to discuss your project.
                            </p>

                            <button
                                onClick={() => window.location.href = '/'}
                                className="w-full bg-[#1FAF65] text-white py-3.5 md:py-5 rounded-xl md:rounded-2xl font-bold text-base md:text-lg hover:bg-[#1a9354] hover:shadow-xl hover:shadow-[#1FAF65]/30 active:scale-95 transition-all outline-none"
                            >
                                Back to Home
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Footer />

            <style jsx global>{`
                .react-tel-input .form-control {
                    width: 100% !important;
                    background: transparent !important;
                    border: none !important;
                    font-size: 16px !important;
                    font-weight: 500 !important;
                }
                .react-tel-input .selected-flag {
                    background: transparent !important;
                }
                .react-tel-input .flag-dropdown {
                    background: transparent !important;
                    border: none !important;
                }
            `}</style>
        </div>
    );
}
