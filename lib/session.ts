import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

// 7 days expiration
const SESSION_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000;

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + SESSION_EXPIRATION_MS);

  // 1. Create a session in the database
  const session = await prisma.session.create({
    data: {
      userId,
      expiresAt,
    },
  });

  // 2. Set the HTTP-only cookie
  cookies().set("session_id", session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });

  return session;
}

export async function verifySession() {
  const sessionId = cookies().get("session_id")?.value;

  if (!sessionId) {
    return null;
  }

  // Find session in the database
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        select: {
          id: true,
          status: true,
        }
      }
    }
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }
  
  if (session.user.status === "BLOCKED") {
    return null;
  }

  return { 
    isAuth: true, 
    userId: session.userId,
    sessionId: session.id 
  };
}

export async function deleteSession() {
  const sessionId = cookies().get("session_id")?.value;
  
  if (sessionId) {
    // Remove from database
    await prisma.session.delete({
      where: { id: sessionId },
    }).catch(() => {}); // Ignore error if already deleted
  }

  // Clear cookie
  cookies().delete("session_id");
}

export async function getCurrentUser() {
  const session = await verifySession();
  
  if (!session) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatarImageUrl: true,
        lojaID: true,
      },
    });

    if (!user || user.status === "BLOCKED") {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return null;
  }
}
