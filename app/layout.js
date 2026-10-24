import { Familjen_Grotesk } from "next/font/google";
import "./globals.css";

const font = Familjen_Grotesk({ subsets: ["latin"], variable: "--font" });

export const metadata = {
  title: "Queue",
  description: "Join the queue from your phone",
};

export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={font.variable}>{children}</body>
    </html>
  );
}
