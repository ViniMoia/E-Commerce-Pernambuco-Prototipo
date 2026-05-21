import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata = {
  title: {
    template: "%s | Admin — Pernambuco Confecções",
    default: "Painel Admin | Pernambuco Confecções",
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Defense in depth: middleware handles the redirect, but we also
  // check here for cases where the middleware cache is stale.
  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-[#050505] text-[#e5e5e5]">
      <AdminSidebar
        adminName={user.name}
        adminInitials={initials}
        adminAvatarUrl={user.avatarImageUrl}
      />

      {/* Main content area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
