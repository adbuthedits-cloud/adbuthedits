import { Inter } from "next/font/google";
import "./globals.css";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import { Toaster } from "react-hot-toast";


config.autoAddCss = false; // Tell Font Awesome to skip adding the css automatically since it's being imported above

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: "Adbuth Admin Panel",
    description: "Admin Dashboard for Adbuth Shop",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <Toaster position="top-right" />

                {children}

            </body>
        </html>
    );
}
