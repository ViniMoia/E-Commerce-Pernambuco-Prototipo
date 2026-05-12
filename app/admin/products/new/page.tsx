import { Metadata } from "next";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata: Metadata = {
  title: "Novo Produto | Pernambuco Confecções",
  description: "Cadastro de novo produto no catálogo.",
};

export default function NewProductPage() {
  return (
    <div className="container mx-auto py-10 max-w-4xl fade-in">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-main)]">
          Cadastrar Novo Produto
        </h1>
        <p className="text-[var(--text-main)]/60">
          Preencha os dados do produto e suas variações de grade e cor.
        </p>
      </div>
      
      <ProductForm />
    </div>
  );
}
