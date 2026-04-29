"use client";

import { Package, Calendar, ChevronRight } from "lucide-react";
import { UserOrder } from "../types";

interface OrderHistoryListProps {
  orders: UserOrder[];
}

export function OrderHistoryList({ orders }: OrderHistoryListProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-zinc-500" />
        </div>
        <h3 className="text-xl font-medium mb-2">Nenhum pedido encontrado</h3>
        <p className="text-zinc-400 max-w-sm">
          Você ainda não realizou nenhuma compra. Explore nossa loja para encontrar produtos incríveis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-6">Histórico de Pedidos</h2>
      
      <div className="space-y-4">
        {orders.map((order, index) => (
          <div 
            key={order.id} 
            className="flashlight-card p-6 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="font-medium text-lg">Pedido #{order.id.split('-')[0].toUpperCase()}</span>
                <span className="px-2.5 py-1 text-xs font-medium bg-green-500/10 text-green-400 rounded-full">
                  Concluído
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Calendar className="w-4 h-4" />
                <span>{new Date(order.updatedAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-zinc-400">{order.items?.length || 0} itens</p>
                <p className="font-medium text-white">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    order.items?.reduce((acc, item) => acc + (item.price * item.quantity), 0) || 0
                  )}
                </p>
              </div>
              
              <button className="p-2 hover:bg-[var(--primary)]/20 rounded-full transition-colors text-[var(--primary)]">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
