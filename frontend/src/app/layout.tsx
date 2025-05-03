import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/providers/AppProviders";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Chatbot",
  description: "Chat with your SQL databases and documents using AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
