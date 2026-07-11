import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { cache } from "react";
import { unstable_cache } from "next/cache";

// Cache database query for tenant settings by host/slug (5 minutes TTL, tagged for admin revalidation)
const getCachedLojaBySlugOrDomain = unstable_cache(
  async (cleanHost: string) => {
    return await prisma.loja.findFirst({
      where: {
        OR: [
          { slug: cleanHost },
          { customDomain: cleanHost },
        ],
      },
    });
  },
  ["tenant-settings-host"],
  {
    revalidate: 300, // 5 minutes (in seconds)
    tags: ["tenant-settings"],
  }
);

const getCachedLojaBySlug = unstable_cache(
  async (slug: string) => {
    return await prisma.loja.findUnique({
      where: { slug },
    });
  },
  ["tenant-settings-slug"],
  {
    revalidate: 300, // 5 minutes
    tags: ["tenant-settings"],
  }
);

export const getLojaFromHeaders = cache(async () => {
  try {
    const headersList = headers();
    const host = headersList.get("host") || "";
    const cleanHost = host.split(":")[0];

    // Fallback de desenvolvimento local
    if (
      cleanHost === "localhost" ||
      cleanHost === "127.0.0.1" ||
      cleanHost === "localhost:3000"
    ) {
      const defaultSlug = process.env.NEXT_PUBLIC_DEFAULT_LOJA_SLUG || "loja-padrao";
      return await getCachedLojaBySlug(defaultSlug);
    }

    const platformDomain = process.env.PLATFORM_DOMAIN || "plataforma.com";
    if (cleanHost.endsWith(`.${platformDomain}`)) {
      const slug = cleanHost.replace(`.${platformDomain}`, "");
      return await getCachedLojaBySlug(slug);
    }

    // Busca por slug ou domínio personalizado no banco
    return await getCachedLojaBySlugOrDomain(cleanHost);
  } catch (error) {
    console.error("[GET_LOJA_FROM_HEADERS_ERROR]", error);
    return null;
  }
});
