import Footer from '../../../../components/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import SeoHead from '../../../../components/SeoHead';
import { cdnImage } from '../../../../utils/cdn';

const featuredRow1 = [
    {
        title: "Baby Shower Video Invite",
        image: "https://assets.adbuthverse.com/products/DigitalInvitations/VI/WO/PE/BS/VER/JAP-VI-WO-PE-BS-VER-1001/1778929506038-341233628.webp",
        url: "/shop/category/digital-invitations/personal-events/baby-shower-video-invite"
    },
    {
        title: "Birthday Celebration Video Invitation",
        image: "https://assets.adbuthverse.com/products/DigitalInvitations/VI/WI/PE/BIR/HOR/JAP-VI-WI-PE-BIR-HOR-1001/1778929857872-857416054.webp",
        url: "/shop/category/digital-invitations/personal-events/birthday-celebration-video-invitation"
    },
    {
        title: "Anniversary Video",
        image: "https://assets.adbuthverse.com/products/DigitalInvitations/VI/WO/PE/AN/VER/JAP-VI-WO-PE-AN-VER-1001/1778929481645-558305760.webp",
        url: "/shop/category/digital-invitations/personal-events/anniversary-video"
    },
    {
        title: "Business Anniversary Video Invitation",
        image: "https://assets.adbuthverse.com/products/DigitalInvitations/VI/WI/PE/AN/HOR/JAP-VI-WI-PE-AN-HOR-1001/1778929579175-791346400.webp",
        url: "/shop/category/digital-invitations/personal-events/business-anniversary-video-invitation"
    },
    {
        title: "Baby Shower Video Invite With Photo",
        image: "https://assets.adbuthverse.com/products/DigitalInvitations/VI/WI/PE/BS/VER/JAP-VI-WI-PE-BS-VER-1002/1778929697383-299736538.webp",
        url: "/shop/category/digital-invitations/personal-events/baby-shower-video-invite-with-photo-1"
    },
    {
        title: "Engagement Video Template",
        image: "https://assets.adbuthverse.com/products/DigitalInvitations/VI/WI/PE/EN/HOR/JAP-VI-WI-PE-EN-HOR-1004/1779000697823-254912672.webp",
        url: "/shop/category/digital-invitations/personal-events/engagement-video-template-1"
    },
    {
        title: "Floral Baby Shower",
        image: "https://assets.adbuthverse.com/products/DigitalInvitations/VI/WO/PE/BS/HOR/JAP-VI-WO-PE-BS-HOR-1001/1778929753977-424058315.webp",
        url: "/shop/category/digital-invitations/personal-events/floral-baby-shower"
    },
    {
        title: "Wedding Reception Bloom Video Invitation",
        image: "https://assets.adbuthverse.com/products/DigitalInvitations/VI/WI/PE/RE/VER/JAP-VI-WI-PE-RE-VER-1001/1779171577888-405739536.webp",
        url: "/shop/category/digital-invitations/personal-events/wedding-reception-bloom-video-invitation"
    },
    {
        title: "Traditional Dhoti Function Video Invitation",
        image: "https://assets.adbuthverse.com/products/DigitalInvitations/VI/WO/PE/DF/HOR/JAP-VI-WO-PE-DF-HOR-1001/1778944944769-430596473.webp",
        url: "/shop/category/digital-invitations/personal-events/traditional-dhoti-function-video-invitation"
    },
    {
        title: "Floral Engagement Invitation",
        image: "https://assets.adbuthverse.com/products/DigitalInvitations/VI/WO/PE/EN/VER/JAP-VI-WO-PE-EN-VER-1004/1778949373921-699955436.webp",
        url: "/shop/category/digital-invitations/personal-events/floral-engagement-invitation"
    }
];

const featuredRow2 = [
    {
        title: "Birthday Video Invitation",
        image: "https://assets.adbuthverse.com/products/DigitalInvitations/VI/WI/PE/BIR/VER/JAP-VI-WI-PE-BIR-VER-1001/1778929835222-56379326.webp",
        url: "/shop/category/digital-invitations/personal-events/birthday-video-invitation"
    },
    {
        title: "Baby Shower Video Invite With Photo",
        image: "https://assets.adbuthverse.com/products/DigitalInvitations/VI/WI/PE/BS/VER/JAP-VI-WI-PE-BS-VER-1001/1778929679930-938559156.webp",
        url: "/shop/category/digital-invitations/personal-events/baby-shower-video-invite-with-photo"
    },
    {
        title: "Birthday Celebration Video Invitation",
        image: "https://assets.adbuthverse.com/products/DigitalInvitations/VI/WI/PE/BIR/HOR/JAP-VI-WI-PE-BIR-HOR-1005/1778928929722-355397396.webp",
        url: "/shop/category/digital-invitations/personal-events/birthday-celebration-video-invitation-1"
    },
    {
        title: "Birthday Video Template",
        image: "https://assets.adbuthverse.com/products/DigitalInvitations/VI/WI/PE/BIR/HOR/JAP-VI-WI-PE-BIR-HOR-1004/1778929935126-251444520.webp",
        url: "/shop/category/digital-invitations/personal-events/birthday-video-template-1"
    },
    {
        title: "Engagement Video Invitation Template",
        image: "https://assets.adbuthverse.com/products/DigitalInvitations/VI/WO/PE/EN/VER/JAP-VI-WO-PE-EN-VER-1001/1778945483521-576361946.webp",
        url: "/shop/category/digital-invitations/personal-events/engagement-video-invitation-template"
    },
    {
        title: "Haldi Video Invitation",
        image: "https://assets.adbuthverse.com/products/DigitalInvitations/VI/WI/PE/HA/HOR/JAP-VI-WI-PE-HA-HOR-1001/1779168428671-485384668.webp",
        url: "/shop/category/digital-invitations/personal-events/haldi-video-invitation-1"
    },
    {
        title: "Elegant Floral Baby Shower",
        image: "https://assets.adbuthverse.com/products/DigitalInvitations/VI/WI/PE/BS/HOR/JAP-VI-WI-PE-BS-HOR-1002/1778929553049-126981970.webp",
        url: "/shop/category/digital-invitations/personal-events/elegant-floral-baby-shower"
    },
    {
        title: "Celebration Birthday Video Invitation",
        image: "https://assets.adbuthverse.com/products/DigitalInvitations/VI/WO/PE/BIR/HOR/JAP-VI-WO-PE-BIR-HOR-1001/1778929815309-998835378.webp",
        url: "/shop/category/digital-invitations/personal-events/celebration-birthday-video-invitation"
    },
    {
        title: "Dhoti Ceremony Video Invitation",
        image: "https://assets.adbuthverse.com/products/DigitalInvitations/VI/WI/PE/DF/HOR/JAP-VI-WI-PE-DF-HOR-1001/1778943327933-361500429.webp",
        url: "/shop/category/digital-invitations/personal-events/dhoti-ceremony-video-invitation-1"
    },
    {
        title: "South Indian Dhoti Function Video",
        image: "https://assets.adbuthverse.com/products/DigitalInvitations/VI/WI/PE/DF/VER/JAP-VI-WI-PE-DF-VER-1002/1778937365702-715979019.webp",
        url: "/shop/category/digital-invitations/personal-events/south-indian-dhoti-function-video"
    }
];

function FeaturedTemplateCard({ product }) {
    if (!product) return null;

    const parentSlug = product.parentCategory?.slug || 'digital-invitations';
    const eventSlug = product.assetCategory?.slug || 'personal-events';
    const productSlug = product.slug || product.products_id;
    const productUrl = product.url || `/shop/category/${parentSlug}/${eventSlug}/${productSlug}`;

    const categoryName = product.assetSubCategory?.name || product.assetCategory?.name || product.category || 'Template';
    const rawImage = product.thumbnail || product.image || (product.files && product.files[0]?.file_url) || '';
    const imageSrc = cdnImage(rawImage);

    return (
        <Link
            href={productUrl}
            className="w-full aspect-[9/16] md:aspect-[3/4] block relative overflow-hidden rounded-2xl group shadow-md hover:shadow-xl transition-all duration-300 bg-gray-100"
        >
            {imageSrc ? (
                <img
                    src={imageSrc}
                    alt={product.title || 'Template'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=2070&auto=format&fit=crop";
                    }}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
                    No Preview
                </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4 md:p-6">
                <div className="text-white w-full">
                    <p className="text-[10px] md:text-xs uppercase tracking-widest text-[#E188E2] mb-1 font-semibold">
                        {categoryName}
                    </p>
                    <h4 className="text-sm md:text-lg font-bold whitespace-normal leading-tight line-clamp-2">
                        {product.title}
                    </h4>
                </div>
            </div>
        </Link>
    );
}

const DigitalInvitations = ({ masterData, initialProducts }) => {
    const [activeOccasion, setActiveOccasion] = useState(0);
    const [duration, setDuration] = useState(35);

    useEffect(() => {
        if (typeof window !== "undefined" && window.innerWidth < 768) {
            setDuration(16); // Speed up cards on mobile (16 seconds instead of 35)
        }
    }, []);

    const defaultOccasions = [
        {
            title: "Birthday Invitations",
            desc: "Make every year unforgettable with templates for him, her, kids, or friends from classic elegance to playful fun.",
            image: "https://assets.adbuthverse.com/website-assets/pages/services/designing/adbuth-e-invitations/occation-birthday-invitation.webp"
        },
        {
            title: "Anniversary Invitations",
            desc: "Celebrate timeless love with beautifully crafted digital invitations for every milestone.",
            image: "https://assets.adbuthverse.com/website-assets/pages/services/designing/adbuth-e-invitations/occation-annivarsary-invitations.webp"
        },
        {
            title: "Expression Cards",
            desc: "Say it your way love, thanks, sorry, or just because.",
            image: "https://assets.adbuthverse.com/website-assets/pages/services/designing/adbuth-e-invitations/occation-expression-cards.webp"
        },
        {
            title: "Event Invitations",
            desc: "Professional and creative designs for any corporate or social gathering.",
            image: "https://assets.adbuthverse.com/website-assets/pages/services/designing/adbuth-e-invitations/occation-event-invitations.webp"
        }
    ];

    const occasions = masterData?.parentCategories?.length > 0
        ? masterData.parentCategories.map(cat => ({
            title: cat.category_name,
            desc: cat.description || `Explore our amazing ${cat.category_name} collection.`,
            image: cat.category_image || cat.banner_image || "https://assets.adbuthverse.com/website-assets/pages/services/designing/adbuth-e-invitations/occation-birthday-invitation.webp",
            slug: cat.slug
        }))
        : defaultOccasions;

    // Group digital invitation products by subcategory
    const digitalProducts = initialProducts?.filter(p => p.parentCategory?.slug === 'digital-invitations') || [];
    const digitalSubCategoryMap = {};
    digitalProducts.forEach(p => {
        const subSlug = p.assetSubCategory?.slug;
        const subName = p.assetSubCategory?.name;
        if (subSlug) {
            if (!digitalSubCategoryMap[subSlug]) {
                digitalSubCategoryMap[subSlug] = {
                    slug: subSlug,
                    name: subName,
                    products: []
                };
            }
            digitalSubCategoryMap[subSlug].products.push(p);
        }
    });

    const topDigitalSubCategories = Object.values(digitalSubCategoryMap)
        .sort((a, b) => b.products.length - a.products.length)
        .slice(0, 4);

    let digitalTemplates = topDigitalSubCategories.map(sub => sub.products[0]).filter(Boolean);
    if (digitalTemplates.length < 4 && digitalProducts.length > 0) {
        const existingIds = new Set(digitalTemplates.map(p => p.products_id));
        for (const p of digitalProducts) {
            if (!existingIds.has(p.products_id)) {
                digitalTemplates.push(p);
                existingIds.add(p.products_id);
                if (digitalTemplates.length >= 4) break;
            }
        }
    }

    // Group greetings products by subcategory
    const greetingsProducts = initialProducts?.filter(p => p.parentCategory?.slug === 'greetings') || [];
    const greetingsSubCategoryMap = {};
    greetingsProducts.forEach(p => {
        const subSlug = p.assetSubCategory?.slug;
        const subName = p.assetSubCategory?.name;
        if (subSlug) {
            if (!greetingsSubCategoryMap[subSlug]) {
                greetingsSubCategoryMap[subSlug] = {
                    slug: subSlug,
                    name: subName,
                    products: []
                };
            }
            greetingsSubCategoryMap[subSlug].products.push(p);
        }
    });

    const topGreetingsSubCategories = Object.values(greetingsSubCategoryMap)
        .sort((a, b) => b.products.length - a.products.length)
        .slice(0, 4);

    let greetingsTemplates = topGreetingsSubCategories.map(sub => sub.products[0]).filter(Boolean);
    if (greetingsTemplates.length < 4 && greetingsProducts.length > 0) {
        const existingIds = new Set(greetingsTemplates.map(p => p.products_id));
        for (const p of greetingsProducts) {
            if (!existingIds.has(p.products_id)) {
                greetingsTemplates.push(p);
                existingIds.add(p.products_id);
                if (greetingsTemplates.length >= 4) break;
            }
        }
    }

    const templateCategories = [
        {
            title: "Digital Invitations",
            tagline: "Celebrate life’s special moments with personalized e-invites that speak your heart.",
            templates: digitalTemplates,
            viewMoreLink: "/shop?parentCategory=digital-invitations"
        },
        {
            title: "Greetings",
            tagline: "Send warmth, love, and professional wishes with our custom greeting card templates.",
            templates: greetingsTemplates,
            viewMoreLink: "/shop?parentCategory=greetings"
        }
    ];

    return (
        <div className="bg-white min-h-screen font-sans text-gray-900">
            <SeoHead page="service-design-invitations" title="Digital Invitations | Adbuth Verse" />
            {/* Hero Section */}
            <div className="relative w-full h-[80vh] min-h-[750px] flex flex-col items-start justify-center text-left px-4  mb-10 overflow-hidden"
            >
                {/* Background */}
                <div className="mt-24 absolute inset-0 bg-[#B1B1B1]">
                    <Image
                        src="https://assets.adbuthverse.com/website-assets/pages/services/designing/adbuth-e-invitations/banner.webp"
                        alt="e-design hero"
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover object-left lg:object-center  "
                    />
                </div>

                {/* Content */}
                <div className="lg:leading-normal relative z-10 max-w-4xl md:mx-10 lg:mx-24 text-white text-center md:text-start">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-semibold mb-8 mt-24 "
                    >
                        <span className='leading-[1.2]'>Your Moments</span><br />
                        <span className='leading-[1.2]'>Your Style.</span> <br />
                        <span className=" leading-[1.2]">Your Digital Invitation</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg md:text-lg text-gray-200 mb-8 max-w-2xl capitalize "
                    >
                        Celebrate life’s special moments with personalized
                        <br />e-invites that speak your heart.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col items-center md:items-start justify-start gap-3"
                    >
                        <Link href="/shop" className="bg-white text-black px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap">
                            Explore Templates
                        </Link>
                        <div className="flex items-center gap-2 text-gray-200 text-lg md:text-2xl font-bold mt-1 select-none">

                            <span>2K+ Happy Customers</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Explore By Occasion */}
            {false && (
                <section className="py-10 md:py-24 px-6 lg:px-0 lg:pl-20 mx-auto overflow-x-clip">
                    <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent max-w-xl">
                        Explore By Occasion
                    </h2>
                    <p className="text-gray-600 mb-12 text-lg">
                        Choose your moment, and we'll help you say it in style.
                    </p>

                    {/* Desktop View: Sticky titles & scrolling images */}
                    <div className="hidden lg:flex gap-32 items-start">
                        {/* Left side: Sticky Titles and Descriptions */}
                        <div className="w-[450px] sticky top-32">
                            <div className="flex flex-col space-y-2">
                                {occasions.map((item, idx) => (
                                    <div key={idx} className="py-6 border-b border-gray-100 last:border-0">
                                        <h3
                                            className={`text-3xl font-semibold transition-all duration-500 cursor-pointer ${activeOccasion === idx ? 'text-black opacity-100' : 'text-gray-300 opacity-40'
                                                }`}
                                        >
                                            {item.title}
                                        </h3>
                                        <AnimatePresence>
                                            {activeOccasion === idx && (
                                                <motion.p
                                                    initial={{ height: 0, opacity: 0, y: 10 }}
                                                    animate={{ height: 'auto', opacity: 1, y: 0 }}
                                                    exit={{ height: 0, opacity: 0, y: 10 }}
                                                    className="text-gray-500 text-lg leading-relaxed mt-4 pr-4 overflow-hidden"
                                                >
                                                    {item.desc}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right side: Scrolling Images */}
                        <div className="flex-1 space-y-32 py-32">
                            {occasions.map((item, idx) => (
                                <ScrollTriggerImage
                                    key={idx}
                                    item={item}
                                    index={idx}
                                    onInView={() => setActiveOccasion(idx)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Mobile & Tablet View: Stacked layout */}
                    <div className="flex flex-col gap-16 lg:hidden">
                        {occasions.map((item, idx) => (
                            <div key={idx} className="flex flex-col gap-6">
                                <div>
                                    <h3 className="text-3xl font-semibold text-black mb-3">{item.title}</h3>
                                    <p className="text-gray-500 text-md leading-relaxed">{item.desc}</p>
                                </div>
                                <div className="w-full aspect-[5/4] max-w-xl mx-auto  rounded-2xl overflow-hidden shadow-xl">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-cover object-right"
                                        onError={(e) => {
                                            e.target.src = "https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=2070&auto=format&fit=crop";
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Template Sections */}
            {
                templateCategories.filter(cat => cat.templates.length > 0).map((cat, categoryIdx) => (
                    <section key={categoryIdx} className="py-6 md:py-10 px-6 max-w-7xl mx-auto">
                        <div className="flex flex-col mb-12">
                            <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent w-fit">{cat.title}</h2>
                            <p className="text-gray-600 text-lg font-normal max-w-4xl">{cat.tagline}</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                            {cat.templates.map((product, idx) => (
                                <FeaturedTemplateCard key={product.products_id || idx} product={product} />
                            ))}
                        </div>

                        <div className="flex justify-end mt-4">
                            <Link href={cat.viewMoreLink} className="flex items-center text-black text-sm font-semibold hover:translate-x-1 transition-transform">
                                View More <span className="ml-2 text-xs">→</span>
                            </Link>
                        </div>
                    </section>
                ))
            }

            {/* Featured Templates Marquee */}
            <section className="py-10 md:py-16 bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto mb-16 text-center">
                    <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent">Featured Templates</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto text-lg">Hundreds of ready-to-edit templates designed for every mood, every moment.</p>
                </div>

                <div className="flex flex-col gap-8">
                    {/* Row 1 - Left to Right */}
                    <div className="relative flex overflow-hidden">
                        <motion.div
                            animate={{ x: ["0%", "-50%"] }}
                            transition={{
                                duration: duration,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            className="flex gap-4 md:gap-6 whitespace-nowrap min-w-full"
                        >
                            {[...featuredRow1, ...featuredRow1].map((item, i) => (
                                <Link
                                    key={`row1-${i}`}
                                    href={item.url}
                                    className="w-[180px] h-[320px] md:w-[300px] md:h-[400px] flex-shrink-0 block relative overflow-hidden rounded-2xl group shadow-md hover:shadow-xl transition-all duration-300"
                                >
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4 md:p-6">
                                        <div className="text-white">
                                            <p className="text-[10px] md:text-xs uppercase tracking-widest text-[#E188E2] mb-1 font-semibold">Template</p>
                                            <h4 className="text-sm md:text-lg font-bold whitespace-normal leading-tight">{item.title}</h4>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </motion.div>
                    </div>

                    {/* Row 2 - Right to Left */}
                    <div className="relative flex overflow-hidden">
                        <motion.div
                            animate={{ x: ["-50%", "0%"] }}
                            transition={{
                                duration: duration,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            className="flex gap-4 md:gap-6 whitespace-nowrap min-w-full"
                        >
                            {[...featuredRow2, ...featuredRow2].map((item, i) => (
                                <Link
                                    key={`row2-${i}`}
                                    href={item.url}
                                    className="w-[180px] h-[320px] md:w-[300px] md:h-[400px] flex-shrink-0 block relative overflow-hidden rounded-2xl group shadow-md hover:shadow-xl transition-all duration-300"
                                >
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4 md:p-6">
                                        <div className="text-white">
                                            <p className="text-[10px] md:text-xs uppercase tracking-widest text-[#E188E2] mb-1 font-semibold">Template</p>
                                            <h4 className="text-sm md:text-lg font-bold whitespace-normal leading-tight">{item.title}</h4>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Why Choose Adbuth */}
            <section className="py-10 md:py-16 px-6 max-w-7xl mx-auto">
                <div className="text-left mb-16">
                    <h2 className="text-4xl lg:text-5xl font-semibold mb-2 bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent">Why Choose Adbuth</h2>
                    <p className="text-gray-700 text-lg">Templates for Every Emotion</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 lg:gap-8">
                    {[
                        { title: "Templates for Every Emotion", icon: "https://assets.adbuthverse.com/website-assets/pages/services/designing/adbuth-e-invitations/every-emotion.svg" },
                        { title: "Instant Customization", icon: "https://assets.adbuthverse.com/website-assets/pages/services/designing/adbuth-e-invitations/instant-customization.svg" },
                        { title: "Seamless Sharing", icon: "https://assets.adbuthverse.com/website-assets/pages/services/designing/adbuth-e-invitations/seamless-sharing.svg" },
                        { title: "Cloud Storage & Access", icon: "https://assets.adbuthverse.com/website-assets/pages/services/designing/adbuth-e-invitations/storage-and-access.svg" }
                    ].map((feature, idx) => (
                        <div
                            key={idx}
                            className="flex flex-col items-center text-center group"
                        >
                            <div className="w-16 h-16 md:w-24 md:h-24 mb-4 md:mb-6 flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
                                <img src={feature.icon} alt={feature.title} className="w-full h-full object-contain" />
                            </div>
                            <h3 className="text-sm md:text-lg font-medium text-gray-800 max-w-[160px] leading-snug">
                                {feature.title}
                            </h3>
                        </div>
                    ))}
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="py-12 md:py-16 px-6 lg:px-24 bg-[#7D287E]">

                <div className="relative z-10 text-left max-w-7xl mx-auto">
                    <h2 className="text-4xl lg:text-5xl font-bold mb-6  bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent">
                        Start Your Invitation Journey Today!
                    </h2>
                    <p className="text-xl text-white mb-16 max-w-4xl font-normal leading-relaxed">
                        Bring your celebrations to life with digital cards that are beautiful, meaningful, and uniquely yours.
                    </p>
                    <div className="flex flex-col md:flex-row items-left justify-start gap-6">
                        <Link href="/shop">
                            <button className="bg-white text-black px-12 py-5 rounded-full text-xl font-semibold hover:bg-[#b0aaaa] transition-all">
                                Explore Templates
                            </button>
                        </Link>
                    </div>
                </div>

            </section>

            <Footer />
        </div >
    );
};

const ScrollTriggerImage = ({ item, index, onInView }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, {
        margin: "-45% 0px -45% 0px",
        once: false
    });

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "start start"]
    });

    // Animation values for the image slide-in
    // Subtle slide from the right
    const opacity = useTransform(scrollYProgress, [0.1, 0.9], [0, 1]);
    const x = useTransform(scrollYProgress, [0, 1], [80, 0]); // Subtle offset
    const scale = useTransform(scrollYProgress, [0, 1], [0.95, 1]);

    useEffect(() => {
        if (isInView) {
            onInView();
        }
    }, [isInView]);

    return (
        <div ref={ref} className="relative aspect-[5/4] lg:aspect-[4/3] w-full ml-auto">
            <motion.div
                style={{ opacity, x, scale }}
                className="w-full h-full rounded-l-2xl shadow-2xl overflow-hidden shadow-black/5"
            >
                <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=2070&auto=format&fit=crop";
                    }}
                />

            </motion.div>
        </div>
    );
};

export async function getStaticProps(context) {
    const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
    try {
        const [masterRes, productsRes] = await Promise.all([
            fetch(`${API_URL}/api/products/master-data`),
            fetch(`${API_URL}/api/products`)
        ]);

        if (!masterRes.ok || !productsRes.ok) throw new Error('API fetch failed');

        const masterData = await masterRes.json();
        const initialProducts = await productsRes.json();

        const trimmedProducts = (initialProducts || []).map(p => ({
            products_id: p.products_id || null,
            title: p.title || null,
            description: p.description ? p.description.replace(/<[^>]*>?/gm, '').substring(0, 80) : null,
            price: p.price || null,
            compared_price: p.compared_price || null,
            slug: p.slug || null,
            thumbnail: p.thumbnail || null,
            video: p.video || null,
            video_url: p.video_url || null,
            updatedAt: p.updatedAt || p.updated_at || null,
            averageRating: p.averageRating || null,
            reviewCount: p.reviewCount || null,
            parentCategory: p.parentCategory ? { slug: p.parentCategory.slug } : null,
            assetCategory: p.assetCategory ? { slug: p.assetCategory.slug } : null,
            assetSubCategory: p.assetSubCategory ? { slug: p.assetSubCategory.slug, name: p.assetSubCategory.name } : null,
        }));

        return {
            props: {
                masterData: masterData || {},
                initialProducts: trimmedProducts || [],
            },
            revalidate: 60,
        };
    } catch (err) {
        console.error('DigitalInvitations getStaticProps error:', err);
        return {
            props: { masterData: {}, initialProducts: [] },
            revalidate: 60,
        };
    }
}

export default DigitalInvitations;
