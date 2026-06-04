import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.png" />

        {/* ── Preload LCP hero background image so it loads before React boots ── */}
        <link
          rel="preload"
          as="image"
          href="https://assets.adbuthverse.com/website-assets/pages/home/hero-section.webp"
          fetchpriority="high"
        />

        {/* ── Preconnect to CDN origins for faster image/video loading ── */}
        <link rel="preconnect" href="https://assets.adbuthverse.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://assets.adbuthverse.com" />


        {/* ── Meta charset / theme ── */}
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#0a0118" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
