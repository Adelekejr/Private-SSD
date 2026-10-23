import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PrivateSpend Network",
  description:
    "Foundation for a constrained, evidence-led procurement and settlement workflow.",
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
