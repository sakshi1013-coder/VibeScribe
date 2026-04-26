import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VibeScribe - Premium AI Audio Transcription",
  description: "Experience lightning-fast audio transcription with VibeScribe's state-of-the-art AI.",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen selection:bg-iris/30 overflow-x-hidden`}>
        <div className="noise"></div>
        {children}
      </body>
    </html>



  );
}
