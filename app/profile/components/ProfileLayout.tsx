"use client";

import { useState } from "react";
import { AvatarManager } from "./AvatarManager";
import { OrderHistoryList } from "./OrderHistoryList";
import { ProfileForm } from "./ProfileForm";
import { UserProfile, UserOrder } from "../types";

interface ProfileLayoutProps {
  user: UserProfile;
  orders: UserOrder[];
}

export function ProfileLayout({ user, orders }: ProfileLayoutProps) {
  const [activeTab, setActiveTab] = useState<"info" | "orders">("info");

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      {/* Sidebar */}
      <div className="md:col-span-1 glass-panel rounded-2xl p-6 h-fit space-y-6">
        <AvatarManager user={user} />
        
        <div className="flex flex-col space-y-2">
          <button 
            onClick={() => setActiveTab("info")}
            className={`text-left px-4 py-2 rounded-lg transition-colors ${activeTab === "info" ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
          >
            Informações Pessoais
          </button>
          <button 
            onClick={() => setActiveTab("orders")}
            className={`text-left px-4 py-2 rounded-lg transition-colors ${activeTab === "orders" ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
          >
            Meus Pedidos
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:col-span-3 glass-panel rounded-2xl p-8 fade-in">
        {activeTab === "info" && <ProfileForm user={user} />}
        
        {activeTab === "orders" && (
          <div className="animate-in">
            <OrderHistoryList orders={orders} />
          </div>
        )}
      </div>
    </div>
  );
}
