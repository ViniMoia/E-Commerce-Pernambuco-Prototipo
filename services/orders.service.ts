import prisma from "@/lib/prisma";
import { UserOrder } from "@/app/profile/types";

export async function getUserOrders(userId: string, limit = 10, skip = 0): Promise<UserOrder[]> {
  try {
    const orders = await prisma.cart.findMany({
      where: {
        userID: userId,
        status: "COMPLETED",
      },
      select: {
        id: true,
        updatedAt: true,
        items: {
          select: {
            price: true,
            quantity: true,
          }
        }
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: limit,
      skip: skip,
    });
    
    return orders;
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return [];
  }
}
