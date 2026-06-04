import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

import { useRouter } from 'next/router'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faShoppingBag, faUser, faHeart, faBoxOpen, faCog, faSignOutAlt } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../context/AuthContext'

export default function Navbar({ highlight = '', isdark = true, headerClass = "", position = "absolute" }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [desktopServicesOpen, setDesktopServicesOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [videosOpen, setVideosOpen] = useState(false)
  const [designingOpen, setDesigningOpen] = useState(false)
  const [learningOpen, setLearningOpen] = useState(false)

  const { user, logout, isProfileComplete, openProfileModal } = useAuth()

  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    setImageError(false)
  }, [user])

  const handleLoginClick = () => {
    // router.asPath sometimes lags or is inconsistent during transitions
    // window.location provides the absolute source of truth for "current text in address bar"
    const currentPath = window.location.pathname + window.location.search;
    localStorage.setItem('intendedDestination', currentPath);
    console.log('Saved intended destination:', currentPath);
  }

  // Mobile submenu states
  const [expandedMenus, setExpandedMenus] = useState({})

  const toggleSubmenu = (key) => {
    setExpandedMenus(prev => {
      const newState = { ...prev }

      // Define sibling groups for accordion behavior
      const siblingGroups = [
        ['videos', 'designing', 'learning'],
        ['services', 'profile']
      ]

      const group = siblingGroups.find(g => g.includes(key))

      if (group) {
        // If we are opening this key (it was closed), close others in the group
        if (!prev[key]) {
          group.forEach(sibling => {
            if (sibling !== key) newState[sibling] = false
          })
        }
      }

      newState[key] = !prev[key]
      return newState
    })
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Lock body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  const menuVariants = {
    initial: {
      clipPath: "circle(30px at calc(100% - 40px) 40px)",
      opacity: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40
      }
    },
    animate: {
      clipPath: "circle(150% at calc(100% - 40px) 40px)",
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 20,
        restDelta: 2
      }
    },
    exit: {
      clipPath: "circle(150% at calc(100% - 40px) 40px)",
      opacity: 0,
      transition: {

        type: "spring",
        stiffness: 200,
        damping: 20
      }
    }
  }

  const linkVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  }

  const dropdownVariants = {
    hidden: {
      opacity: 0,
      y: 10,
      scale: 0.95,
      transition: {
        staggerChildren: 0.1,
        staggerDirection: -1
      }
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      y: 10,
      scale: 0.95,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  }

  const dropdownItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -10 }
  }

  return (
    <header className={`w-full top-0 left-0 z-50 transition-all duration-300 ${position} ${headerClass}`}>
      <div className="max-w-7xl md:mx-12 lg:mx-auto mx-auto flex items-center justify-between p-6 relative z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="https://assets.adbuthverse.com/website-assets/brand/logo.webp" alt="Logo" className='lg:w-36 md:w-28 sm:w-24 w-28 object-contain' width={280} height={280} priority />
          </Link>
        </div>

        {/* Desktop Menu */}
        <nav className={`hidden lg:flex items-center gap-8 text-sm font-medium ${isdark ? 'text-white' : 'text-black'}`}>
          <Link href="/about" className={`hover:text-purple-700 transition-colors ${highlight === 'about' ? 'text-purple-700' : ''}`}>About</Link>

          <div
            className="relative group h-full flex items-center"
            onMouseEnter={() => setDesktopServicesOpen(true)}
            onMouseLeave={() => setDesktopServicesOpen(false)}
          >
            <div className="flex items-center gap-1 hover:text-purple-700 transition-colors py-4 cursor-pointer h-full">
              <Link href="/services" className={`hover:text-purple-700 transition-colors ${highlight === 'services' ? 'text-purple-700' : ''}`}>
                Services <FontAwesomeIcon icon={faChevronDown} className={`text-xs transition-transform duration-300 ${desktopServicesOpen ? 'rotate-180' : ''}`} />
              </Link>
            </div>

            {/* Main Dropdown */}
            <AnimatePresence>
              {desktopServicesOpen && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={dropdownVariants}
                  className="absolute top-full left-0 mt-0 w-40 bg-white text-black rounded-md shadow-xl overflow-visible z-[60]"
                >
                  <div className="py-2 flex flex-col relative">

                    {/* Videos Submenu */}
                    <motion.div
                      variants={dropdownItemVariants}
                      className="group/item relative h-full"
                      onMouseEnter={() => setVideosOpen(true)}
                      onMouseLeave={() => setVideosOpen(false)}
                    >
                      <div className="w-full text-left px-4 py-2 hover:bg-gray-100 flex justify-between items-center text-sm cursor-pointer">
                        <Link href="/services/videos" className="w-full flex justify-between items-center">Videos <FontAwesomeIcon icon={faChevronDown} className={`text-[10px] transition-transform duration-300 ${videosOpen ? '-rotate-180' : '-rotate-90'}`} /></Link>
                      </div>
                      <AnimatePresence>
                        {videosOpen && (
                          <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={dropdownVariants}
                            className="absolute left-full top-0 w-56 bg-white text-black rounded-md shadow-xl overflow-visible ml-1 z-[60]"
                          >
                            <div className="py-2 flex flex-col text-sm">

                              <motion.div variants={dropdownItemVariants}><Link href="/services/videos/adbuth-edits" className="px-4 py-2 hover:bg-gray-100 block">Adbuth Edits</Link></motion.div>
                              <motion.div variants={dropdownItemVariants}><Link href="/services/videos/adbuth-corporate" className="px-4 py-2 hover:bg-gray-100 block">Adbuth Corporate</Link></motion.div>
                              <motion.div variants={dropdownItemVariants}><Link href="/services/videos/adbuth-ads" className="px-4 py-2 hover:bg-gray-100 block">Adbuth Ads</Link></motion.div>
                              <motion.div variants={dropdownItemVariants}><Link href="/services/videos/adbuth-politics" className="px-4 py-2 hover:bg-gray-100 block">Adbuth Politics</Link></motion.div>
                              <motion.div variants={dropdownItemVariants}><Link href="/services/videos/adbuth-music" className="px-4 py-2 hover:bg-gray-100 block">Adbuth Music</Link></motion.div>
                              <motion.div variants={dropdownItemVariants}><Link href="/services/videos/adbuth-movies" className="px-4 py-2 hover:bg-gray-100 block">Adbuth Movies</Link></motion.div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Designing Submenu */}
                    <motion.div
                      variants={dropdownItemVariants}
                      className="group/item relative h-full"
                      onMouseEnter={() => setDesigningOpen(true)}
                      onMouseLeave={() => setDesigningOpen(false)}
                    >
                      <div className="w-full text-left px-4 py-2 hover:bg-gray-100 flex justify-between items-center text-sm cursor-pointer">
                        <Link href="/services/designing" className="w-full flex justify-between items-center">Designing <FontAwesomeIcon icon={faChevronDown} className={`text-[10px] transition-transform duration-300 ${designingOpen ? '-rotate-180' : '-rotate-90'}`} /></Link>
                      </div>
                      <AnimatePresence>
                        {designingOpen && (
                          <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={dropdownVariants}
                            className="absolute left-full top-0 w-56 bg-white text-black rounded-md shadow-xl overflow-visible ml-1 z-[60]"
                          >
                            <div className="py-2 flex flex-col text-sm">
                              <motion.div variants={dropdownItemVariants}><Link href="/services/designing/adbuth-e-invitations" className="px-4 py-2 hover:bg-gray-100 block">Adbuth E-Invitations</Link></motion.div>
                              <motion.div variants={dropdownItemVariants}><Link href="/services/designing/adbuth-graphics" className="px-4 py-2 hover:bg-gray-100 block">Adbuth Graphics</Link></motion.div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Learning Submenu */}
                    <motion.div
                      variants={dropdownItemVariants}
                      className="group/item relative h-full"
                      onMouseEnter={() => setLearningOpen(true)}
                      onMouseLeave={() => setLearningOpen(false)}
                    >
                      <div className="w-full text-left px-4 py-2 hover:bg-gray-100 flex justify-between items-center text-sm cursor-pointer">
                        <Link href="/services/learning" className="w-full flex justify-between items-center">Learning <FontAwesomeIcon icon={faChevronDown} className={`text-[10px] transition-transform duration-300 ${learningOpen ? '-rotate-180' : '-rotate-90'}`} /></Link>
                      </div>
                      <AnimatePresence>
                        {learningOpen && (
                          <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={dropdownVariants}
                            className="absolute left-full top-0 w-56 bg-white text-black rounded-md shadow-xl overflow-visible ml-1 z-[60]"
                          >
                            <div className="py-2 flex flex-col text-sm">
                              <motion.div variants={dropdownItemVariants}><Link href="/services/learning/adbuth-dam" className="px-4 py-2 hover:bg-gray-100 block">Adbuth DAM</Link></motion.div>
                              <motion.div variants={dropdownItemVariants}><Link href="/services/learning/adbuth-e-learning" className="px-4 py-2 hover:bg-gray-100 block">Adbuth E-Learning</Link></motion.div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link href="/shop" className={`hover:text-purple-700 transition-colors ${highlight === 'shop' ? 'text-purple-700' : ''}`}>Shop</Link>
          <Link href="/blogs" className={`hover:text-purple-700 transition-colors ${highlight === 'blogs' ? 'text-purple-700' : ''}`}>Blogs</Link>

          <Link href="/contact-us" className={`${highlight === 'contact' ? 'text-purple-700' : ''} px-6 py-2  rounded-full border-2 border-purple-700/80 hover:border-accent hover:text-accent transition-all duration-300 backdrop-blur-sm`}>
            Contact Us
          </Link>

          {user ? (
            <div
              className="relative group h-full flex items-center"
              onMouseEnter={() => setProfileOpen(true)}
              onMouseLeave={() => setProfileOpen(false)}
            >
              {/* Smart Avatar: shows photo, initials, or icon */}
              <button
                aria-label={`Open profile menu for ${user.first_name || user.email || 'user'}`}
                aria-haspopup="true"
                aria-expanded={profileOpen}
                className={`${highlight === 'profile' ? 'ring-2 ring-purple-400' : ''} w-10 h-10 rounded-full border-2 border-purple-700 overflow-hidden flex items-center justify-center transition-all duration-300`}
              >
                {user.profile_picture && !imageError ? (
                  <img
                    src={user.profile_picture}
                    alt={user.name || 'Profile picture'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-purple-700 hover:bg-transparent hover:text-purple-700 flex items-center justify-center text-white text-sm font-bold transition-all duration-300" aria-hidden="true">
                    {user.first_name && user.last_name
                      ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
                      : user.first_name
                      ? user.first_name[0].toUpperCase()
                      : user.last_name
                      ? user.last_name[0].toUpperCase()
                      : <FontAwesomeIcon icon={faUser} aria-hidden="true" />}
                  </div>
                )}
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <>
                    {/* Hover Bridge to prevent menu closing */}
                    <div className="absolute top-full right-0 w-48 h-4 bg-transparent" />
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={dropdownVariants}
                      className="absolute top-full right-0 mt-2 w-48 bg-white text-black rounded-md shadow-xl overflow-visible z-[60]"
                    >
                      <div className="py-2 flex flex-col text-sm">
                        {/* User Email/Phone + Incomplete Profile Badge */}
                        <div className="px-4 py-2 border-b border-gray-100 mb-1">
                          <p className="text-xs text-gray-400 font-medium">Signed in as</p>
                          <p className="text-[10px] font-bold text-gray-900 truncate" title={user?.email || ''}>
                            {user?.email
                              ? user.email
                              : user?.phone_number
                              ? (() => { try { const p = typeof user.phone_number === 'string' ? JSON.parse(user.phone_number) : user.phone_number; return `${p.code} ${p.number}`; } catch { return 'Phone User'; } })()
                              : 'User'
                            }
                          </p>
                          {!isProfileComplete(user) && (
                            <button
                              onClick={() => { openProfileModal({}); }}
                              className="mt-1 text-[9px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full hover:bg-amber-100 transition-colors flex items-center gap-1 w-full justify-center"
                            >
                              ⚠ Complete Profile
                            </button>
                          )}
                        </div>
                        <motion.div variants={dropdownItemVariants}>
                          <Link href="/wishlist" className="px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
                            <FontAwesomeIcon icon={faHeart} className="text-gray-400" /> Wishlist
                          </Link>
                        </motion.div>
                        <motion.div variants={dropdownItemVariants}>
                          <Link href="/cart" className="px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
                            <FontAwesomeIcon icon={faShoppingBag} className="text-gray-400" /> Cart
                          </Link>
                        </motion.div>
                        <motion.div variants={dropdownItemVariants}>
                          <Link href="/orders" className="px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
                            <FontAwesomeIcon icon={faBoxOpen} className="text-gray-400" /> Orders
                          </Link>
                        </motion.div>
                        <motion.div variants={dropdownItemVariants}>
                          <Link href="/settings" className="px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
                            <FontAwesomeIcon icon={faCog} className="text-gray-400" /> Settings
                          </Link>
                        </motion.div>
                        <div className="border-t border-gray-100 my-1"></div>
                        <motion.div variants={dropdownItemVariants}>
                          <button type="button" onClick={logout} aria-label="Logout from your account" className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2">
                            <FontAwesomeIcon icon={faSignOutAlt} aria-hidden="true" /> Logout
                          </button>
                        </motion.div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={() => {
                handleLoginClick();
                router.push('/login');
              }}
              className={`${highlight === 'login' ? 'text-purple-700' : 'text-white'} px-6 py-2 rounded-full border-2 border-purple-700 bg-purple-700 hover:bg-transparent hover:text-purple-700 transition-all duration-300 backdrop-blur-sm`}
            >
              Login
            </button>
          )}

        </nav>

        {/* Mobile Toggle Button */}
        <div className="lg:hidden">
          <button
            className={`p-2 z-50 relative focus:outline-none ${open ? 'text-white' : (scrolled || !isdark ? 'text-black' : 'text-white')}`}
            onClick={() => setOpen(v => !v)}
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={open}
            aria-controls="mobile-nav-menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <motion.path
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                variants={{
                  closed: { d: "M 2 6 L 20 6" },
                  open: { d: "M 3 16.5 L 17 2.5" }
                }}
                initial="closed"
                animate={open ? "open" : "closed"}
              />
              <motion.path
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                d="M 2 12 L 20 12"
                variants={{
                  closed: { opacity: 1 },
                  open: { opacity: 0 }
                }}
                initial="closed"
                animate={open ? "open" : "closed"}
                transition={{ duration: 0.1 }}
              />
              <motion.path
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                variants={{
                  closed: { d: "M 2 18 L 20 18" },
                  open: { d: "M 3 2.5 L 17 16.5" }
                }}
                initial="closed"
                animate={open ? "open" : "closed"}
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Full Screen Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav-menu"
            variants={menuVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 bg-[#1a1025] z-40 flex flex-col pt-24 px-6 overflow-y-auto"
          >
            <motion.div
              variants={{
                open: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
                closed: { transition: { staggerChildren: 0.05, staggerDirection: -1 } }
              }}
              initial="closed"
              animate="open"
              className="flex flex-col gap-6 text-white text-lg font-medium"
            >
              <motion.div variants={linkVariants}>
                <Link href="/about" onClick={() => setOpen(false)}>About</Link>
              </motion.div>

              {/* Services Section */}
              <motion.div variants={linkVariants} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Link href="/services" onClick={() => setOpen(false)} className="flex-1">Services</Link>
                  <button
                    onClick={() => toggleSubmenu('services')}
                    className={`p-2 transition-transform duration-300 ${expandedMenus['services'] ? 'rotate-180' : ''}`}
                  >
                    <FontAwesomeIcon icon={faChevronDown} className="text-sm" />
                  </button>
                </div>


                <AnimatePresence>
                  {expandedMenus['services'] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden pl-4 flex flex-col gap-4 text-base text-gray-300"
                    >
                      {/* Videos */}
                      <div className="flex flex-col gap-2 pt-2">
                        <div className="flex items-center justify-between">
                          <Link href="/services/videos" onClick={() => setOpen(false)} className="flex-1">Videos</Link>
                          <button
                            onClick={() => toggleSubmenu('videos')}
                            className={`p-2 transition-transform duration-300 ${expandedMenus['videos'] ? 'rotate-180' : ''}`}
                          >
                            <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
                          </button>
                        </div>
                        <AnimatePresence>
                          {expandedMenus['videos'] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden pl-4 flex flex-col gap-3 text-sm text-gray-400 border-l border-purple-700/30"
                            >

                              <Link href="/services/videos/adbuth-edits" onClick={() => setOpen(false)}>Adbuth Edits</Link>
                              <Link href="/services/videos/adbuth-corporate" onClick={() => setOpen(false)}>Adbuth Corporate</Link>
                              <Link href="/services/videos/adbuth-ads" onClick={() => setOpen(false)}>Adbuth Ads</Link>
                              <Link href="/services/videos/adbuth-politics" onClick={() => setOpen(false)}>Adbuth Politics</Link>
                              <Link href="/services/videos/adbuth-music" onClick={() => setOpen(false)}>Adbuth Music</Link>
                              <Link href="/services/videos/adbuth-movies" onClick={() => setOpen(false)}>Adbuth Movies</Link>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Designing */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <Link href="/services/designing" onClick={() => setOpen(false)} className="flex-1">Designing</Link>
                          <button
                            onClick={() => toggleSubmenu('designing')}
                            className={`p-2 transition-transform duration-300 ${expandedMenus['designing'] ? 'rotate-180' : ''}`}
                          >
                            <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
                          </button>
                        </div>
                        <AnimatePresence>
                          {expandedMenus['designing'] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden pl-4 flex flex-col gap-3 text-sm text-gray-400 border-l border-purple-700/30"
                            >
                              <Link href="/services/designing/adbuth-e-invitations" onClick={() => setOpen(false)}>Adbuth E-Invitations</Link>
                              <Link href="/services/designing/adbuth-graphics" onClick={() => setOpen(false)}>Adbuth Graphics</Link>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Learning */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <Link href="/services/learning" onClick={() => setOpen(false)} className="flex-1">Learning</Link>
                          <button
                            onClick={() => toggleSubmenu('learning')}
                            className={`p-2 transition-transform duration-300 ${expandedMenus['learning'] ? 'rotate-180' : ''}`}
                          >
                            <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
                          </button>
                        </div>
                        <AnimatePresence>
                          {expandedMenus['learning'] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden pl-4 flex flex-col gap-3 text-sm text-gray-400 border-l border-purple-700/30"
                            >
                              <Link href="/services/learning/adbuth-dam" onClick={() => setOpen(false)}>Adbuth DAM</Link>
                              <Link href="/services/learning/adbuth-e-learning" onClick={() => setOpen(false)}>Adbuth E-Learning</Link>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div variants={linkVariants}>
                <Link href="/shop" onClick={() => setOpen(false)}>Shop</Link>
              </motion.div>

              <motion.div variants={linkVariants}>
                <Link href="/blogs" onClick={() => setOpen(false)}>Blogs</Link>
              </motion.div>

              <motion.div variants={linkVariants}>
                <Link href="/contact-us" onClick={() => setOpen(false)} className="text-purple-700">Contact Us</Link>
              </motion.div>

              {user ? (
                <motion.div variants={linkVariants} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between" onClick={() => toggleSubmenu('profile')}>
                    <div className="flex items-center gap-2 cursor-pointer">
                      {/* Smart Avatar (Mobile) */}
                      <div className="w-8 h-8 rounded-full border border-purple-700 overflow-hidden flex items-center justify-center">
                        {user.profile_picture && !imageError ? (
                          <img
                            src={user.profile_picture}
                            alt={user.name || 'Profile'}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={() => setImageError(true)}
                          />
                        ) : (
                          <div className="w-full h-full bg-purple-700 flex items-center justify-center text-white text-xs font-bold">
                            {user.first_name && user.last_name
                              ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
                              : user.first_name
                              ? user.first_name[0].toUpperCase()
                              : user.last_name
                              ? user.last_name[0].toUpperCase()
                              : <FontAwesomeIcon icon={faUser} className="text-xs" />}
                          </div>
                        )}
                      </div>
                      <span>{user.name || 'Profile'}</span>
                    </div>
                    <button
                      className={`p-2 transition-transform duration-300 ${expandedMenus['profile'] ? 'rotate-180' : ''}`}
                    >
                      <FontAwesomeIcon icon={faChevronDown} className="text-sm" />
                    </button>
                  </div>
                  <AnimatePresence>
                    {expandedMenus['profile'] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden pl-4 flex flex-col gap-4 text-base text-gray-300 border-l border-purple-700/30 pt-2"
                      >
                        <Link href="/wishlist" onClick={() => setOpen(false)} className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faHeart} className="text-sm" /> Wishlist
                        </Link>
                        <Link href="/cart" onClick={() => setOpen(false)} className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faShoppingBag} className="text-sm" /> Cart
                        </Link>
                        <Link href="/orders" onClick={() => setOpen(false)} className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faBoxOpen} className="text-sm" /> Orders
                        </Link>
                        <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faCog} className="text-sm" /> Settings
                        </Link>
                        <button onClick={() => { logout(); setOpen(false); }} className="text-left text-red-400 flex items-center gap-2">
                          <FontAwesomeIcon icon={faSignOutAlt} className="text-sm" /> Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <motion.div variants={linkVariants}>
                  <button
                    onClick={() => {
                      handleLoginClick();
                      setOpen(false);
                      router.push('/login');
                    }}
                    className="text-white bg-purple-700 px-6 py-2 rounded-full text-center block w-full"
                  >
                    Login
                  </button>
                </motion.div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
