import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "PropCopy AI — Real Estate Marketing Copy Generator",
  description:
    "Generate MLS descriptions, Instagram scripts, email blasts, and Facebook ads for Indian real estate listings in seconds using AI.",
  keywords:
    "real estate marketing, AI copy generator, property listing, MLS description, Indian real estate, Mumbai, Bangalore",
  openGraph: {
    title: "PropCopy AI",
    description: "AI-powered property marketing copy for Indian real estate agents",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--surface-2)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              fontSize: "14px",
              fontFamily: "var(--font-sans)",
            },
            success: {
              iconTheme: { primary: "var(--success)", secondary: "var(--surface)" },
            },
            error: {
              iconTheme: { primary: "var(--danger)", secondary: "var(--surface)" },
            },
          }}
        />
      </body>
    </html>
  );
}
