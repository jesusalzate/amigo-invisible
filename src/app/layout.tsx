import type { Metadata, Viewport } from "next";
import { Fraunces } from "next/font/google";
import { Garland, Scene } from "@/components/scene";
import "./globals.css";

// Display face for titles only; body and controls stay on the system font (HIG branding.md).
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Amigo invisible", template: "%s · Amigo invisible" },
  description: "Organiza el amigo invisible con tus amigos y descubre qué le gusta a quien te toca.",
  robots: { index: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#c9dceb" },
    { media: "(prefers-color-scheme: dark)", color: "#050d18" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${fraunces.variable} h-full`}>
      <body className="min-h-full">
        <Scene />
        <div className="pt-[env(safe-area-inset-top)]">
          <Garland />
        </div>
        <main className="mx-auto w-full max-w-lg px-4 pb-[max(10rem,calc(env(safe-area-inset-bottom)+8rem))]">
          {children}
        </main>
      </body>
    </html>
  );
}
