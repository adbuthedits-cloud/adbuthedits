import { Inter, Playfair_Display, DM_Sans, Montserrat } from 'next/font/google'

export const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    weight: ['300', '400', '500', '600', '700', '800', '900'],
    display: 'swap',  // Always render correctly — primary UI font
})

export const playfair = Playfair_Display({
    subsets: ['latin'],
    variable: '--font-playfair',
    weight: ['400', '500', '600', '700', '800', '900'],
    display: 'swap',  // Use swap so headings render with correct serif font
})

export const dmSans = DM_Sans({
    subsets: ['latin'],
    variable: '--font-dm-sans',
    weight: ['400', '500', '700', '900'],
    display: 'swap',  // Use swap to ensure font renders correctly (not optional)
})

export const montserrat = Montserrat({
    subsets: ['latin'],
    variable: '--font-montserrat',
    weight: ['400', '500', '600', '700', '800', '900'],
    display: 'swap',  // Use swap to ensure font renders correctly (not optional)
})
