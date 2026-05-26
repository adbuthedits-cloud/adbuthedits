"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import { getSafeImageSrc } from "../utils/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "./Animations";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faChartPie,
    faBox,
    faClipboardList,
    faPenNib,
    faUsers,
    faCog,
    faSignOutAlt,
    faBars,
    faTimes,
    faSearch,
    faSync,
    faWallet,
    faStar,
    faGlobe,
    faTags,
    faDatabase,
    faUserShield,
    faClockRotateLeft,
    faRoute,
    faClipboardCheck,
    faEnvelope,
    faCloudUploadAlt
} from "@fortawesome/free-solid-svg-icons";
import { getAuthToken, getAuthUser, canAccessModule } from "../utils/auth";
import setupAxiosInterceptors from "../utils/axiosConfig";
import AnalyticsPanel from "./AnalyticsPanel";

// Initialize global axios interceptors once
setupAxiosInterceptors();

const MenuItem = ({ href, icon, label, collapsed, badge }) => {
    const pathname = usePathname();
    const isActive = pathname === href || pathname?.startsWith(`${href}/`);

    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative mb-1 ${isActive
                ? "bg-[#2d1b4e] text-white font-medium shadow-[0_0_10px_rgba(139,92,246,0.15)] border border-[#3b2a5f]"
                : "text-gray-400 hover:bg-[#2d1b4e] hover:text-white"
                }`}
        >
            <FontAwesomeIcon icon={icon} className={`text-lg w-5 flex-shrink-0 ${isActive ? "text-[#a78bfa]" : "text-gray-500 group-hover:text-[#a78bfa]"}`} />

            <AnimatePresence>
                {!collapsed && (
                    <motion.span
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -4 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="whitespace-nowrap overflow-hidden flex-1"
                    >
                        {label}
                    </motion.span>
                )}
            </AnimatePresence>

            {!collapsed && badge && (
                <span className="bg-[#a78bfa] text-[#1a1025] font-bold text-[10px] px-1.5 py-0.5 rounded-full">{badge}</span>
            )}

            {collapsed && (
                <div className="absolute left-full ml-4 px-3 py-1 bg-[#2d1b4e] text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none border border-[#3b2a5f]">
                    {label}
                </div>
            )}
        </Link>
    );
};

export default function AdminLayout({ children }) {
    const [collapsed, setCollapsed] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [userContext, setUserContext] = useState(null);
    const router = useRouter();
    const [newOrdersCount, setNewOrdersCount] = useState(0);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const pathname = usePathname();

    const playNotificationSound = () => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            
            // First chime (higher tone)
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
            gain1.gain.setValueAtTime(0.08, ctx.currentTime);
            gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(ctx.currentTime);
            osc1.stop(ctx.currentTime + 0.15);
            
            // Second chime (slightly lower/warmer tone, delayed)
            setTimeout(() => {
                try {
                    const osc2 = ctx.createOscillator();
                    const gain2 = ctx.createGain();
                    osc2.type = 'sine';
                    osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
                    gain2.gain.setValueAtTime(0.08, ctx.currentTime);
                    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
                    osc2.connect(gain2);
                    gain2.connect(ctx.destination);
                    osc2.start(ctx.currentTime);
                    osc2.stop(ctx.currentTime + 0.25);
                } catch (e) {
                    // Ignore sound playback block errors
                }
            }, 80);
        } catch (error) {
            console.log("Audio play blocked or unsupported:", error.message);
        }
    };

    const fetchCounts = async () => {
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
        try {
            const token = getAuthToken();
            if (!token) return;

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const [ordersRes] = await Promise.all([
                axios.get(`${apiUrl}/api/admin/orders/new-count`, { 
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 5000 
                })
            ]);

            const newCount = ordersRes.data.count;
            setNewOrdersCount(prevCount => {
                if (newCount > prevCount && prevCount !== null && prevCount !== undefined) {
                    playNotificationSound();
                }
                return newCount;
            });
        } catch (error) {
            // Suppress error logging in console when polling, as network blips or Render cold starts shouldn't spam errors
            if (error.response?.status === 403) {
                console.warn("[Polling] 403 Forbidden - credentials may have expired.");
            }
        }
    };

    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            router.push("/login");
        } else {
            setIsAuthorized(true);
            const initialUser = getAuthUser();
            setUserContext(initialUser);

            // Silently verify user session to keep RBAC permissions perfectly synced
            const verifyUser = async () => {
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                    const res = await axios.get(`${apiUrl}/api/auth/verify`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.data && res.data.user) {
                        const updatedUser = res.data.user;
                        localStorage.setItem('admin_user', JSON.stringify(updatedUser)); // Keep global state synced
                        if (JSON.stringify(initialUser?.permissions) !== JSON.stringify(updatedUser.permissions)) {
                            setUserContext(updatedUser); // Force layout re-render for new sidebar links
                        }
                    }
                } catch (e) {
                    // Suppress network errors/cold starts from spamming console log
                    if (e.response?.status === 403 || e.response?.status === 401) {
                        console.warn("Silent session verification failed: unauthorized.");
                    }
                }
            };
            verifyUser();
        }
    }, [router]);

    useEffect(() => {
        if (isAuthorized) {
            fetchCounts();
            
            let interval;
            const startPolling = () => {
                if (interval) clearInterval(interval);
                interval = setInterval(() => {
                    if (document.visibilityState === 'visible') {
                        fetchCounts();
                    }
                }, 10000);
            };

            const handleVisibilityChange = () => {
                if (document.visibilityState === 'visible') {
                    fetchCounts();
                    startPolling();
                } else {
                    if (interval) clearInterval(interval);
                }
            };

            startPolling();
            document.addEventListener("visibilitychange", handleVisibilityChange);

            const handleBadgeReset = () => setNewOrdersCount(0);
            window.addEventListener("ordersViewed", handleBadgeReset);
            
            return () => {
                if (interval) clearInterval(interval);
                document.removeEventListener("visibilitychange", handleVisibilityChange);
                window.removeEventListener("ordersViewed", handleBadgeReset);
            };
        }
    }, [isAuthorized]);

    if (!isAuthorized) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#1a1025] gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a78bfa]"></div>
                <div className="text-gray-400 font-medium">Verifying Access...</div>
            </div>
        );
    }

    const currentDate = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });
    const user = userContext || getAuthUser();
    const canSee = (module) => canAccessModule(user, module);

    return (
        <div className="flex min-h-screen bg-[#130C1C] text-gray-100 font-sans">
            <aside
                className={`h-screen bg-[#1a1025] shadow-xl border-r border-[#2d1b4e] flex flex-col fixed left-0 top-0 z-50 ${collapsed ? "w-[80px]" : "w-[260px]"}`}
            >
                <div className="h-20 flex items-center px-6 mb-2 border-b border-[#2d1b4e]/50">
                    {!collapsed ? (
                        <div className="flex items-center gap-2">
                            <Image src="/images/logo.png" alt="Adbuth" width={120} height={32} className="h-8 w-auto object-contain" style={{ height: "auto" }} priority />
                        </div>
                    ) : (
                        <Image src="/images/logo.png" alt="Adbuth" width={32} height={32} className="w-8 h-8 mx-auto object-contain" style={{ height: "auto" }} priority />
                    )}
                </div>

                <nav className="flex-1 px-4 overflow-y-auto custom-scroll py-2">
                    {!collapsed && <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3 mt-2 px-2">Dashboard</div>}
                    <MenuItem href="/" icon={faChartPie} label="Dashboard" collapsed={collapsed} />

                    {canSee("seo") && (
                        <MenuItem href="/seo" icon={faGlobe} label="SEO Management" collapsed={collapsed} />
                    )}

                    {!collapsed && <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3 mt-6 px-2">Ecommerce</div>}

                    {canSee("orders") && (
                        <MenuItem href="/orders" icon={faClipboardList} label="All Orders" badge={newOrdersCount > 0 ? newOrdersCount : null} collapsed={collapsed} />
                    )}
                    {canSee("order_tracking") && (
                        <MenuItem href="/order-tracking" icon={faRoute} label="Order Tracking" collapsed={collapsed} />
                    )}
                    {canSee("my_tasks") && (
                        <MenuItem href="/my-tasks" icon={faClipboardCheck} label="My Tasks" collapsed={collapsed} />
                    )}

                    {canSee("products") && (
                        <MenuItem href="/products" icon={faBox} label="All Products" collapsed={collapsed} />
                    )}
                    {canSee("master_data") && (
                        <MenuItem href="/master-data" icon={faDatabase} label="Master Data" collapsed={collapsed} />
                    )}
                    {canSee("blogs") && (
                        <MenuItem href="/blogs" icon={faPenNib} label="Blogs" collapsed={collapsed} />
                    )}
                    {canSee("blog_categories") && (
                        <MenuItem href="/blog-categories" icon={faTags} label="Blog Categories" collapsed={collapsed} />
                    )}

                    {canSee("reviews") && <MenuItem href="/reviews" icon={faStar} label="Reviews" collapsed={collapsed} />}
                    {canSee("payments") && <MenuItem href="/payments" icon={faWallet} label="Payments" collapsed={collapsed} />}
                    {canSee("enquiries") && <MenuItem href="/enquiries" icon={faEnvelope} label="Enquiries" collapsed={collapsed} />}

                    {canSee("marketing") && (
                        <>
                            {!collapsed && <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3 mt-6 px-2">Marketing</div>}
                            <MenuItem href="/coupons" icon={faTags} label="Coupons & Promo" collapsed={collapsed} />
                        </>
                    )}

                    {!collapsed && <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3 mt-6 px-2">Management</div>}

                    {canSee("users") ? (
                        <MenuItem href="/users" icon={faUsers} label="Customers" collapsed={collapsed} />
                    ) : null}

                    {canSee("staff") && (
                        <>
                            <MenuItem href="/staff" icon={faUserShield} label="Staff Members" collapsed={collapsed} />
                            <MenuItem href="/roles" icon={faClockRotateLeft} label="Role Management" collapsed={collapsed} />
                        </>
                    )}

                    {canSee("media_manager") && (
                        <MenuItem href="/media-manager" icon={faCloudUploadAlt} label="Media Manager" collapsed={collapsed} />
                    )}

                    {canSee("settings") && (
                        <MenuItem href="/settings" icon={faCog} label="Settings" collapsed={collapsed} />
                    )}

                    <button
                        onClick={async () => {
                            try {
                                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                                await axios.post(`${apiUrl}/api/auth/admin/logout`, {}, {
                                    headers: { Authorization: `Bearer ${getAuthToken()}` }
                                });
                            } catch (e) { /* Proceed with logout even if API fails */ }
                            localStorage.removeItem("admin_token");
                            localStorage.removeItem("admin_user");
                            router.push("/logout");
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors ${collapsed ? "justify-center" : ""}`}
                    >
                        <FontAwesomeIcon icon={faSignOutAlt} className="text-lg" />
                        {!collapsed && <span className="font-medium">Logout</span>}
                    </button>
                    {!collapsed && (
                        <div className="text-xs text-gray-600 text-center mt-2">© 2025 Adbuth Admin</div>
                    )}
                </nav>
            </aside>

            <div
                className={`flex-1 flex flex-col min-h-screen min-w-0 ${collapsed ? "ml-[80px]" : "ml-[260px]"}`}
            >
                <header className="h-20 bg-[#1a1025] border-b border-[#2d1b4e] px-8 flex items-center justify-between sticky top-0 z-40 text-white">
                    <div className="flex items-center gap-6 flex-1">
                        <button onClick={() => setCollapsed(!collapsed)} className="text-gray-400 hover:text-white transition-colors">
                            <FontAwesomeIcon icon={collapsed ? faBars : faTimes} className="text-xl" />
                        </button>
                        <div className="bg-[#2d1b4e] flex items-center px-4 py-2.5 rounded-lg border border-[#3b2a5f] w-full max-w-md focus-within:border-[#a78bfa] focus-within:ring-2 focus-within:ring-[#a78bfa]/20 transition-all">
                            <FontAwesomeIcon icon={faSearch} className="text-gray-400 mr-3" />
                            <input type="text" placeholder="Search data..." className="bg-transparent outline-none text-sm w-full text-gray-200 placeholder-gray-500" />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-300 bg-[#2d1b4e] px-3 py-1.5 rounded-md border border-[#3b2a5f]">
                            <FontAwesomeIcon icon={faBox} className="text-gray-400" />
                            <span>{currentDate}</span>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="relative text-gray-400 hover:text-[#a78bfa] transition-colors group"
                            title="Refresh Data"
                        >
                            <FontAwesomeIcon icon={faSync} className="text-lg group-active:animate-spin" />
                        </button>

                        <button 
                            onClick={() => setShowAnalytics(true)}
                            className="relative text-gray-400 hover:text-[#a78bfa] transition-colors"
                            title="Analytics Overview"
                        >
                            <FontAwesomeIcon icon={faChartPie} className="text-lg" />
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#a78bfa] rounded-full border border-[#1a1025]"></span>
                        </button>
                        <button className="relative text-gray-400 hover:text-[#a78bfa] transition-colors">
                            <FontAwesomeIcon icon={faClipboardList} className="text-lg" />
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-[#1a1025]"></span>
                        </button>
                    </div>

                    <div className="flex items-center gap-3 cursor-pointer ml-4">
                        <div className="w-10 h-10 rounded-full bg-[#2d1b4e] overflow-hidden border-2 border-[#3b2a5f] shadow-sm relative">
                            <Image src={getSafeImageSrc(`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.first_name || "Admin")}+${encodeURIComponent(user?.last_name || "User")}&background=2d1b4e&color=fff`)} alt="Admin" fill className="object-cover" sizes="40px" />
                        </div>
                        <div className="hidden md:block leading-tight">
                            <div className="text-sm font-bold text-white capitalize">{user?.first_name || "Admin"} {user?.last_name || ""}</div>
                            <div className="text-xs text-gray-400 capitalize">{user?.role?.replace("_", " ") || "Staff"}</div>
                        </div>
                    </div>
                </header>

                <main className="p-8 min-h-screen relative">
                    <PageTransition key={pathname}>
                        {children}
                    </PageTransition>
                </main>
            </div>

            {/* Analytics Side Drawer */}
            <AnalyticsPanel isOpen={showAnalytics} onClose={() => setShowAnalytics(false)} />
        </div>
    );
}
