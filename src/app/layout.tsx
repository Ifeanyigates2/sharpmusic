import type { Metadata } from "next";
import { Manrope, Syne } from "next/font/google";
import { AudioPlayer } from "@/components/AudioPlayer";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PlayerProvider } from "@/components/PlayerProvider";
import "./globals.css";

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "sharpmusic.com — Download music from around the world",
    template: "%s · sharpmusic.com",
  },
  description:
    "Browse, stream, buy, and download tracks shared by artists worldwide. Free library and marketplace on sharpmusic.com.",
  metadataBase: new URL("https://sharpmusic.com"),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="has-player flex min-h-full flex-col antialiased">
        <PlayerProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <AudioPlayer />
        </PlayerProvider>
      </body>
    </html>
  );
}
