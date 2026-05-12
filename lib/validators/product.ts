import { z } from "zod";

export const productVariantSchema = z.object({
  id: z.string().optional(),
  size: z.string().min(1, "Tamanho é obrigatório"),
  color: z.string().min(1, "Cor é obrigatória"),
  stock: z.number().int().min(0, "Estoque não pode ser negativo"),
});

export const productFiltersSchema = z.object({
  name: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  lojaId: z.string().optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  price: z.number().min(0.01, "Preço deve ser maior que zero"),
  imageUrl: z.string().url("URL da imagem inválida"),
  stock: z.number().int().min(0),
  lojaID: z.string().uuid("ID da loja inválido"),
  variants: z.array(productVariantSchema).min(1, "O produto deve ter pelo menos uma variação"),
});

export const updateProductSchema = createProductSchema.partial().extend({
  variants: z.array(productVariantSchema).optional(),
});
