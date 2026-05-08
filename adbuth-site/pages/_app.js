import { useState, useEffect } from 'react'
import '../styles/globals.css'
import { AnimatePresence } from 'framer-motion'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { AuthProvider } from '../context/AuthContext'
import { WishlistProvider } from '../context/WishlistContext'
import PageLoader from '../components/PageLoader'
import ComingSoon from '../components/ComingSoon'

import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
config.autoAddCss = false

import { inter, playfair, dmSans, montserrat } from '../lib/fonts'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from '../components/ErrorBoundary'
import PromoPopup from '../components/PromoPopup'

const MAINTENANCE_MODE = true;

function MyApp({ Component, pageProps }) {
  const router = useRouter()
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [showMaintenance, setShowMaintenance] = useState(MAINTENANCE_MODE)

  useEffect(() => {
    if (!MAINTENANCE_MODE) {
      setShowMaintenance(false);
      return;
    }

    // Check for bypass in URL or LocalStorage
    const searchParams = new URLSearchParams(window.location.search);
    const bypassToken = searchParams.get('bypass');

    if (bypassToken === 'adbuth2024') {
      localStorage.setItem('adbuth_bypass', 'true');
      setShowMaintenance(false);
      // Remove query param from URL
      router.replace(router.pathname, undefined, { shallow: true });
      return;
    } else if (bypassToken === 'false') {
      localStorage.removeItem('adbuth_bypass');
      setShowMaintenance(!router.pathname.startsWith('/admin'));
      router.replace(router.pathname, undefined, { shallow: true });
      return;
    }

    const isBypassed = localStorage.getItem('adbuth_bypass') === 'true';
    const isAdminRoute = router.pathname.startsWith('/admin');
    
    setShowMaintenance(!isBypassed && !isAdminRoute);
  }, [router.pathname, router.query]);

  useEffect(() => {
    const handleStart = () => setIsPageLoading(true)
    const handleComplete = () => setIsPageLoading(false)

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
    <AuthProvider>
      <WishlistProvider>
        <Head>
          <title>ADBUTH Verse</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>

        <div className={`${inter.variable} ${playfair.variable} ${dmSans.variable} ${montserrat.variable} font-sans`}>
          {isPageLoading && <PageLoader />}

          {showMaintenance ? (
            <ComingSoon />
          ) : (
            <>
              <ErrorBoundary>
                <AnimatePresence>
                  <Component {...pageProps} key={router.pathname} />
                </AnimatePresence>
              </ErrorBoundary>

              <Toaster
                position="bottom-center"
                toastOptions={{
                  className: '',
                  duration: 5000,
                  style: {
                    zIndex: 99999,
                  },
                }}
              />
              <PromoPopup />
            </>
          )}
        </div>
      </WishlistProvider>
    </AuthProvider>
  )
}

export default MyApp
