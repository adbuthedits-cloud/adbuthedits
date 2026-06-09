import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faInstagram, faLinkedin, faYoutube } from '@fortawesome/free-brands-svg-icons';

export default function Footer() {
  return (
    <footer className="bg-white pt-16 pb-8 px-6 border-t border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 md:gap-10 gap-14 mb-6">

          {/* Brand Column */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 justify-center md:justify-start" aria-label="Adbuth Verse - Home">
              <span className="font-bold text-md md:text-lg lg:text-xl tracking-wide text-[#7D287E]">
                ADBUTH <span className="text-[#7D287E] font-bold text-[#FCD804]">VERSE</span>
              </span>
            </Link>
            <p className="text-xs text-gray-500 leading-relaxed w-full lg:px-0 lg:max-w-xs text-center md:text-left">
              Welcome to Adbuth Verse, a premier post
              production studio and your video editing partner!
            </p>
          </div>

          <div className="flex flex-col md:flex-row justify-between lg:grid-cols-3 text-center md:text-left gap-10">
            {/* Menu Column */}
            <div>
              <h6 className="font-bold text-[#7D287E] mb-4 text-sm uppercase tracking-wider">Menu</h6>
              <ul className="space-y-2 text-xs text-gray-600 font-medium">
                <li><Link href="/about" className="hover:text-[#7D287E] transition-colors">About</Link></li>
                <li><Link href="/services" className="hover:text-[#7D287E] transition-colors">Services</Link></li>
                <li><Link href="/blogs" className="hover:text-[#7D287E] transition-colors">Blogs</Link></li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h6 className="font-bold text-[#7D287E] mb-4 text-sm uppercase tracking-wider">Resources</h6>
              <ul className="space-y-2 text-xs text-gray-600 font-medium">
                <li><Link href="/contact-us" className="hover:text-[#7D287E] transition-colors">Contact Us</Link></li>
                <li><Link href="/blogs" className="hover:text-[#7D287E] transition-colors">Blogs</Link></li>
              </ul>
            </div>

            {/* Contact Column */}
            <div>
              <h6 className="font-bold text-[#7D287E] mb-4 text-sm uppercase tracking-wider">Get in touch</h6>
              <div className="space-y-2 text-xs text-gray-600 font-medium">
                {/* Fixed: removed square brackets from email href */}
                <p><a href="mailto:contact@adbuthverse.com">contact@adbuthverse.com</a></p>
                <p><a href="tel:+918886689789">+91 88866 89789</a></p>
              </div>

              {/* Social links — fixed: aria-label on each, aria-hidden on icons, rel=noopener */}
              <div className="flex gap-4 mt-10 md:mt-6 justify-center md:justify-start">
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://www.facebook.com/jayasadbuthproductionsllp/"
                  aria-label="Follow Adbuth Verse on Facebook"
                  className="w-8 h-8 rounded-full bg-[#7D287E] text-white flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <FontAwesomeIcon icon={faFacebook} className="text-xs" aria-hidden="true" />
                </a>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://www.instagram.com/adbuthproductions/"
                  aria-label="Follow Adbuth Verse on Instagram"
                  className="w-8 h-8 rounded-full bg-[#7D287E] text-white flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <FontAwesomeIcon icon={faInstagram} className="text-xs" aria-hidden="true" />
                </a>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://www.youtube.com/@JayasAdbuth"
                  aria-label="Subscribe to Adbuth Verse on YouTube"
                  className="w-8 h-8 rounded-full bg-[#7D287E] text-white flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <FontAwesomeIcon icon={faYoutube} className="text-xs" aria-hidden="true" />
                </a>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://www.linkedin.com/in/jayasadbuth/"
                  aria-label="Connect with Adbuth Verse on LinkedIn"
                  className="w-8 h-8 rounded-full bg-[#7D287E] text-white flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <FontAwesomeIcon icon={faLinkedin} className="text-xs" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row flex-start items-center gap-4 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
          <p>© 2025 Adbuth Verse. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-[#7D287E]">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#7D287E]">Terms of Use</Link>
            <Link href="/refund" className="hover:text-[#7D287E]">Refund Policy</Link>
            <Link href="/shipping" className="hover:text-[#7D287E]">Shipping Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
