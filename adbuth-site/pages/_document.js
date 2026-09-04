import { Html, Head, Main, NextScript } from 'next/document'

const GA_MEASUREMENT_ID = 'G-49661TWW9D'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.png" />

        {/* ── Google Fonts CDN Fallback (ensures Inter, Montserrat, DM Sans, Playfair always load) ── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..900;1,9..40,400..900&family=Inter:wght@300;400;500;600;700;800;900&family=Montserrat:ital,wght@0,300..900;1,300..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />

        {/* ── Preconnect to CDN origins for faster image/video loading ── */}
        <link rel="preconnect" href="https://assets.adbuthverse.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://assets.adbuthverse.com" />

        {/* ── Google Analytics GA4 ── */}
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />

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
