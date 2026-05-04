import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Skyerise — sunrise & sunset quality",
  description:
    "Tells you how good today's sunrise and sunset are going to be, with a transparent score and the reasons behind it.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Skyerise",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff7ed" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d1a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans">
        <div className="aurora min-h-screen">{children}</div>
      </body>
    </html>
  );
}
