import type { Metadata } from "next";
import { Lora, Lato} from "next/font/google";
import "./globals.css";
import { Providers } from "./provider";

const geistSans = Lora({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Lato({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: "400", // Add a valid weight value
});

export const metadata: Metadata = {
  title: "BuildBit",
  description: "Next Generation AI-Powered Website Builder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
        {children}
        </Providers>
      </body>
    </html>
  );
}