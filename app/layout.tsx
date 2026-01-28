import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "FleetMaster Pro",
  description: "Gestion de flotte automobile professionnelle",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="flex min-h-screen">
          <AppSidebar />
          <main className="flex-1 ml-64 bg-slate-50 p-8">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
