import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReactQueryClientProvider } from "@/providers/react-query-provider";
import { TrustlessWorkProvider } from "@/trustless-work-provider";
import { WalletProvider } from "@/components/tw-blocks/providers/WalletProvider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Escrow Start — Trustless Work",
  description: "Plataforma de escrow educativa usando Trustless Work (Stellar testnet)",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ReactQueryClientProvider>
          <TrustlessWorkProvider>
            <WalletProvider>
              <TooltipProvider>{children}</TooltipProvider>
              <Toaster />
            </WalletProvider>
          </TrustlessWorkProvider>
        </ReactQueryClientProvider>
      </body>
    </html>
  );
}
