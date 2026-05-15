'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useCart } from '@/lib/store/cart.store'
import { Button, EmptyState } from '@/components/ui'

export function CartDrawer() {
  const { items, isOpen, total, toggleCart, updateQty, removeItem } = useCart()
  const router = useRouter()

  if (!isOpen) return null

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in duration-300" 
        onClick={toggleCart} 
      />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-zinc-950 shadow-2xl z-[101] flex flex-col animate-in slide-in-from-right duration-500 border-l border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-900/50">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">Seu Carrinho</h2>
          <button 
            onClick={toggleCart}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {items.length === 0 ? (
            <div className="h-full flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <EmptyState 
                title="Carrinho vazio"
                description="Você ainda não adicionou nenhum produto ao carrinho."
                icon={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div 
                  key={item.id} 
                  className="flex gap-4 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/30 animate-in fade-in slide-in-from-right-4 duration-500 transition-all hover:border-[#dbb501]/30 group"
                >
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 relative">
                    {item.imageUrl ? (
                      <Image 
                        src={item.imageUrl} 
                        alt={item.name} 
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2 pr-4">{item.name}</h3>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                        </button>
                      </div>
                      {(item.color || item.size) && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          {item.color} {item.color && item.size ? '/' : ''} {item.size}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-1 border border-zinc-200 dark:border-zinc-700/50">
                        <button 
                          onClick={() => updateQty(item.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-700 transition-all shadow-sm active:scale-95"
                        >
                          -
                        </button>
                        <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-700 transition-all shadow-sm active:scale-95"
                        >
                          +
                        </button>
                      </div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                        R$ {(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-zinc-100 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-900/50">
            <div className="flex justify-between items-center mb-6">
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">Subtotal</span>
              <span className="text-xl font-bold text-[#dbb501]">R$ {total.toFixed(2)}</span>
            </div>
            <Button 
              className="w-full bg-[#dbb501] hover:bg-[#dbb501]/90 text-zinc-950 font-semibold text-base py-6 shadow-[0_0_20px_rgba(219,181,1,0.3)] transition-all hover:shadow-[0_0_25px_rgba(219,181,1,0.4)]"
              onClick={() => {
                toggleCart()
                router.push('/checkout')
              }}
            >
              Finalizar Pedido
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
