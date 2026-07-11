import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Afterlife Link",
  description: "Cyberpunk 2077 inspired LLM agent cockpit built with Next.js and Shadcn-style UI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
