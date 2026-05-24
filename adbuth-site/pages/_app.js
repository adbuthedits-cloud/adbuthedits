import { useState, useEffect } from 'react'
import '../styles/globals.css'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { AuthProvider } from '../context/AuthContext'
import { WishlistProvider } from '../context/WishlistContext'
import PageLoader from '../components/PageLoader'
import dynamic from 'next/dynamic'

import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
config.autoAddCss = false

import { inter, playfair, dmSans, montserrat } from '../lib/fonts'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from '../components/ErrorBoundary'

// Lazy-load heavy non-critical components — keeps initial JS bundle lean
const PromoPopup = dynamic(() => import('../components/PromoPopup'), { ssr: false })
const ZohoSalesIQ = dynamic(() => import('../components/ZohoSalesIQ'), { ssr: false })

function MyApp({ Component, pageProps }) {
  const router = useRouter()
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [loadDelayed, setLoadDelayed] = useState(false)

  useEffect(() => {
    // Delay loading heavy components (PromoPopup, Zoho) by 4s to free main thread
    const timer = setTimeout(() => setLoadDelayed(true), 4000)
    return () => clearTimeout(timer)
  }, [])

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

          <ErrorBoundary>
            <Component {...pageProps} key={router.pathname} />
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
              <PromoPopup />
              <ZohoSalesIQ />
            </>
          )}
        </div>
      </WishlistProvider>
    </AuthProvider>
  )
}

export default MyApp
