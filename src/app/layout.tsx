import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PrivateSpend Network — Mandates",
  description:
    "Create and edit procurement mandates with explicit constraints and a redacted audit trail.",
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
