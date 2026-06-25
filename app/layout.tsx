import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Whisper Caravan: Seven-Day Memory",
  description: "A game-oriented RAG memory demo with seven-day forgetting.",
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
