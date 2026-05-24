import { Inter, Playfair_Display, DM_Sans, Montserrat } from 'next/font/google'

export const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',  // Primary UI font — always render correctly
})

export const playfair = Playfair_Display({
    subsets: ['latin'],
    variable: '--font-playfair',
    display: 'optional',  // Non-critical — fall back to system if not cached
})

export const dmSans = DM_Sans({
    subsets: ['latin'],
    variable: '--font-dm-sans',
    weight: ['400', '500', '700', '900'],
    display: 'optional',  // Non-critical — fall back to system if not cached
})

export const montserrat = Montserrat({
    subsets: ['latin'],
    variable: '--font-montserrat',
    weight: ['400', '500', '700', '900'],
    display: 'optional',  // Non-critical — fall back to system if not cached
})
