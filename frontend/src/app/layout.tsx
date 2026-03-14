import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Canopy — AI-Powered HR Intelligence",
  description: "Know every employee like you only have ten. Canopy builds a Relationship Memory Layer on top of your HR data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <a href="#main-content" className="skip-to-content">Skip to content</a>
          {children}
        </Providers>
      </body>
    </html>
  );
}
