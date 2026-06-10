import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "R3 Tour Team",
  description: "Sign up to help with an upcoming tour",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-accent-50 text-gray-800 antialiased">
        {children}
      </body>
    </html>
  );
}
