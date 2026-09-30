import { Html, Head, Main, NextScript } from 'next/document'

const GA_MEASUREMENT_ID = 'G-49661TWW9D'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.png" />

        {/* ── Preconnect to CDN origin for images/assets ── */}
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
