import { useState, useEffect, useRef } from 'react'
import '../styles/globals.css'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { AuthProvider } from '../context/AuthContext'
import { WishlistProvider } from '../context/WishlistContext'
import PageLoader from '../components/PageLoader'
import dynamic from 'next/dynamic'

// ── Scroll Restoration ────────────────────────────────────────────────────────
// KEY INSIGHT: When the browser back button is pressed, `popstate` fires first
// and window.location IMMEDIATELY updates to the destination URL — BEFORE
// Next.js fires routeChangeStart. So using window.location.pathname inside
// routeChangeStart would save scrollY under the WRONG (destination) URL,
// overwriting the value we actually want to restore.
//
// Solution: We track the "current page URL" ourselves in a ref (`currentPageUrl`),
// and only update it AFTER routeChangeComplete. This ensures routeChangeStart
// always saves scroll under the correct source page, regardless of navigation type.
function useScrollRestoration(router) {
  // Our own tracker of what URL we're currently on — NOT window.location
  const currentPageUrl = useRef(
    typeof window !== 'undefined'
      ? window.location.pathname + window.location.search
      : '/'
  )
  const savedScrollPositions = useRef({})
  const shouldRestore = useRef(false)
  const retryTimers = useRef([])

  // Cancel any in-flight retry attempts from a previous navigation
  const clearRetries = () => {
    retryTimers.current.forEach(id => clearTimeout(id))
    retryTimers.current = []
  }

  // Scroll to target cleanly using requestAnimationFrame without layout thrashing
  const restoreScroll = (target) => {
    clearRetries()
    const attempt = () => {
      window.scrollTo({ top: target, behavior: 'instant' })
    }
    // Perform restoration on the next animation frame
    requestAnimationFrame(attempt)
  }

  useEffect(() => {
    // Disable browser's own scroll restoration — we manage it manually
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    // popstate fires when the user presses Back/Forward in the browser.
    // At this point window.location has ALREADY changed to the destination.
    // We just set a flag here — the actual save/restore happens in the
    // routeChange events where we have the correct URL context via our ref.
    const onPopState = () => {
      shouldRestore.current = true
    }
    window.addEventListener('popstate', onPopState)

    // ── Real-time scroll position tracking ──────────────────────────────────────
    // The critical insight: we CANNOT rely on routeChangeStart alone to capture
    // the correct scroll position. By the time a link click triggers routeChangeStart,
    // the scroll might still be mid-animation, or the user may have been scrolling
    // and clicked while the inertia was still running.
    //
    // Instead, we continuously track scroll position as the user scrolls, with a
    // short debounce (100ms) so we never save a stale/intermediate value.
    // This makes the saved position always the user's LAST ACTUAL resting point.
    let scrollDebounceTimer = null
    const onScroll = () => {
      if (scrollDebounceTimer) clearTimeout(scrollDebounceTimer)
      scrollDebounceTimer = setTimeout(() => {
        savedScrollPositions.current[currentPageUrl.current] = window.scrollY
      }, 100)
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    // routeChangeStart: do a final synchronous capture as a safety net
    // (in case the scroll debounce hasn't fired yet when the link is clicked)
    const onRouteChangeStart = () => {
      if (scrollDebounceTimer) clearTimeout(scrollDebounceTimer)
      clearRetries()
      savedScrollPositions.current[currentPageUrl.current] = window.scrollY
    }

    const onRouteChangeComplete = (destinationUrl) => {
      // Strip hash, keep pathname + search (same format as our keys)
      const url = destinationUrl.split('#')[0]

      if (shouldRestore.current) {
        shouldRestore.current = false
        const savedY = savedScrollPositions.current[url]
        if (savedY !== undefined) {
          restoreScroll(savedY)
        } else {
          // Back navigation but page never visited before — go to top
          window.scrollTo({ top: 0, behavior: 'instant' })
        }
      } else {
        // Normal forward link/button navigation — always go to top
        clearRetries()
        window.scrollTo({ top: 0, behavior: 'instant' })
      }

      // Update our URL tracker AFTER handling restoration
      currentPageUrl.current = url
    }

    const onRouteChangeError = () => {
      clearRetries()
      shouldRestore.current = false
    }

    router.events.on('routeChangeStart', onRouteChangeStart)
    router.events.on('routeChangeComplete', onRouteChangeComplete)
    router.events.on('routeChangeError', onRouteChangeError)


    return () => {
      clearRetries()
      if (scrollDebounceTimer) clearTimeout(scrollDebounceTimer)
      router.events.off('routeChangeStart', onRouteChangeStart)
      router.events.off('routeChangeComplete', onRouteChangeComplete)
      router.events.off('routeChangeError', onRouteChangeError)
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener('scroll', onScroll)
    }
  }, [router]) // eslint-disable-line react-hooks/exhaustive-deps
}

const GA_MEASUREMENT_ID = 'G-49661TWW9D'

// Helper: send a page_view event to GA4 on every route change
const pageview = (url) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, { page_path: url })
  }
}

import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
config.autoAddCss = false

import { inter, playfair, dmSans, montserrat } from '../lib/fonts'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from '../components/ErrorBoundary'
import Navbar from '../components/Navbar'

// Lazy-load heavy non-critical components — keeps initial JS bundle lean
const PromoPopup = dynamic(() => import('../components/PromoPopup'), { ssr: false })
const ZohoSalesIQ = dynamic(() => import('../components/ZohoSalesIQ'), { ssr: false })

// Route-based navbar configurations for persistent app layout
const LIGHT_PAGES = [
  '/shop',
  '/wishlist',
  '/cart',
  '/checkout',
  '/orders',
  '/order',
  '/settings',
  '/privacy',
  '/terms',
  '/refund',
  '/shipping',
  '/enquiry-form',
  '/services/designing/adbuth-e-invitations',
  '/services/designing/adbuth-graphics',
  '/services/learning',
  '/services/learning/adbuth-dam',
  '/services/videos/adbuth-ads',
  '/services/videos/adbuth-corporate',
]

const getNavbarConfig = (pathname) => {
  const isAuth = pathname === '/login' || pathname === '/signup'
  if (isAuth) return { hide: true }

  let highlight = ''
  if (pathname.startsWith('/shop') || pathname === '/wishlist') highlight = 'shop'
  else if (pathname.startsWith('/about')) highlight = 'about'
  else if (pathname.startsWith('/services')) highlight = 'services'
  else if (pathname.startsWith('/blogs')) highlight = 'blogs'
  else if (pathname.startsWith('/contact')) highlight = 'contact'

  const isLight =
    pathname === '/blogs' ||
    LIGHT_PAGES.some(p => pathname === p || pathname.startsWith(p + '/'))

  return {
    hide: false,
    isdark: !isLight,
    highlight,
    position: 'absolute',
    headerClass: '',
  }
}

function MyApp({ Component, pageProps }) {
  const router = useRouter()
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [loadDelayed, setLoadDelayed] = useState(false)

  // Dynamic navbar configuration based on route + page-level overrides
  const defaultNavbarConfig = getNavbarConfig(router.pathname)
  const navbarConfig = {
    ...defaultNavbarConfig,
    ...(Component.navbarConfig || {}),
    ...(pageProps.navbarConfig || {}),
  }
  const shouldHideNavbar = navbarConfig.hide || Component.hideNavbar || pageProps.hideNavbar

  // Restore scroll position on browser back/forward navigation
  useScrollRestoration(router)

  useEffect(() => {
    // Delay loading heavy components (PromoPopup, Zoho) by 4s to free main thread
    const timer = setTimeout(() => setLoadDelayed(true), 4000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleStart = () => setIsPageLoading(true)
    const handleComplete = (url) => {
      setIsPageLoading(false)
      pageview(url) // ── Track page view in GA4 on every navigation
    }

    router.events.on('routeChangeStart', handleStart)
    router.events.on('routeChangeComplete', handleComplete)
    router.events.on('routeChangeError', handleComplete)

    return () => {
      router.events.off('routeChangeStart', handleStart)
      router.events.off('routeChangeComplete', handleComplete)
      router.events.off('routeChangeError', handleComplete)
    }
  }, [router])

  return (
    <div className={`${inter.variable} ${playfair.variable} ${dmSans.variable} ${montserrat.variable} font-sans`}>
      <AuthProvider>
        <WishlistProvider>
          <Head>
            <title>ADBUTH Verse</title>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            {/* Pre-connect to CDNs to eliminate DNS + TLS latency for logo and assets */}
            <link rel="preconnect" href="https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev" />
            <link rel="preconnect" href="https://assets.adbuthverse.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://assets.adbuthverse.com" />
            {/* Preload the active brand logo so it's in the browser cache before Navbar renders */}
            <link
              rel="preload"
              as="image"
              href="https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/brand/logo-1785834385800-162717410.webp"
            />
          </Head>

          {isPageLoading && <PageLoader />}

          {/* Persistent Navbar — stays in DOM across route transitions without remounting or flickering */}
          {!shouldHideNavbar && <Navbar {...navbarConfig} />}

          <ErrorBoundary>
            <Component {...pageProps} />
          </ErrorBoundary>

          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 5000,
              style: { zIndex: 99999 },
            }}
          />
          {loadDelayed && (
            <>
              {router.pathname !== '/login' && <PromoPopup />}
              <ZohoSalesIQ />
            </>
          )}
        </WishlistProvider>
      </AuthProvider>
    </div>
  )
}

export default MyApp
