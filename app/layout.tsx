import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IBI Store",
  description: "Construindo interfaces reais com movimento.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
