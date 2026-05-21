import { Prisma, PrismaClient } from '@prisma/client'
import prisma from '@/lib/prisma'

interface UpdateLojaSettingsParams {
  pixKey?: string | null
  pixKeyType?: string | null
  whatsappNumber?: string | null
}

interface LojaSettings {
  id: string
  name: string
  slug: string
  pixKey: string | null
  pixKeyType: string | null
  whatsappNumber: string | null
}

/**
 * Get loja settings by lojaID
 */
export async function getLojaSettings(lojaID: string): Promise<LojaSettings | null> {
  try {
    const loja = await prisma.loja.findUnique({
      where: { id: lojaID },
      select: {
        id: true,
        name: true,
        slug: true,
        pixKey: true,
        pixKeyType: true,
        whatsappNumber: true,
      },
    })

    return loja
  } catch (error) {
    console.error('[GET_LOJA_SETTINGS]', error)
    return null
  }
}

/**
 * Update loja settings (pixKey, whatsappNumber, etc.)
 */
export async function updateLojaSettings(
  lojaID: string,
  params: UpdateLojaSettingsParams
): Promise<LojaSettings | null> {
  try {
    const updated = await prisma.loja.update({
      where: { id: lojaID },
      data: {
        ...(params.pixKey !== undefined && { pixKey: params.pixKey }),
        ...(params.pixKeyType !== undefined && { pixKeyType: params.pixKeyType }),
        ...(params.whatsappNumber !== undefined && { whatsappNumber: params.whatsappNumber }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        pixKey: true,
        pixKeyType: true,
        whatsappNumber: true,
      },
    })

    return updated
  } catch (error) {
    console.error('[UPDATE_LOJA_SETTINGS]', error)
    return null
  }
}

/**
 * Get loja info by slug (public endpoint)
 */
export async function getLojaBySlug(slug: string): Promise<LojaSettings | null> {
  try {
    const loja = await prisma.loja.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        pixKey: true,
        pixKeyType: true,
        whatsappNumber: true,
      },
    })

    return loja
  } catch (error) {
    console.error('[GET_LOJA_BY_SLUG]', error)
    return null
  }
}