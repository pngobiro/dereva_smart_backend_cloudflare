import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dereva Smart Admin",
  description: "Content management system for Dereva Smart",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
