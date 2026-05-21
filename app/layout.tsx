import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { ConditionalHeader } from "@/components/ConditionalHeader";
import { CartProvider } from "@/components/providers/CartProvider";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Pernambuco Confecções",
  description: "Construindo interfaces reais com movimento.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const loja = await prisma.loja.findFirst();

  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <CartProvider>
          <ConditionalHeader>
            <Header />
          </ConditionalHeader>
          {children}
          <WhatsAppButton phoneNumber={loja?.whatsappNumber} />
        </CartProvider>
      </body>
    </html>
  );
}
