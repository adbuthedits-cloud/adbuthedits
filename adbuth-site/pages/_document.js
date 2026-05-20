import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.ico" />

        {/* ── Preload LCP hero background image so it loads before React boots ── */}
        <link
          rel="preload"
          as="image"
          href="https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/home/hero-section.png"
          fetchPriority="high"
        />

        {/* ── Preconnect to CDN origins for faster image/video loading ── */}
        <link rel="preconnect" href="https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev" />

        {/* ── Preconnect to Google Fonts (used by next/font/google) ── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

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
