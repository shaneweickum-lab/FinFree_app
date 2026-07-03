import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { AccountGate } from "@/components/account-gate";
import { AppHeader } from "@/components/app-header";
import { TutorNudge } from "@/components/tutor-nudge";
import { TutorChat } from "@/components/tutor-chat";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinFree App — Building Your Financial House",
  description:
    "A gamified financial literacy and day trading learning platform. Build your financial house from the foundation up.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>
          <AccountGate>
            <AppHeader />
            <main className="flex-1">{children}</main>
            <TutorNudge />
            <TutorChat />
          </AccountGate>
        </AuthProvider>
      </body>
    </html>
  );
}
