"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/cart.store";
import { useCart } from "@/components/providers/CartProvider";

// Types
interface ProductVariant {
  id: string;
  size: string;
  color: string;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  stock: number;
  galleryUrls?: string[];
  productVariants?: ProductVariant[];
}

// SVG Icons
const Icons = {
  ArrowLeft: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  ),
  ShoppingBag: ({ className = "" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <path d="M16 10a4 4 0 0 1-8 0"></path>
    </svg>
  )
};

export default function EcommerceHomepage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { addToCart, isLoading: isAddingToCart } = useCartStore();
  const { setIsOpen } = useCart();

  // 1. Fetching Products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Falha ao carregar produtos");
        const data = await res.json();
        
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erro ao carregar os produtos:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // 2. Hero Carousel Rotation
  useEffect(() => {
    if (products.length === 0 || selectedProduct) return;
    
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % Math.min(5, products.length));
    }, 5000);
    
    return () => clearInterval(interval);
  }, [products.length, selectedProduct]);

  // Sync active image when product opens
  useEffect(() => {
    if (selectedProduct) {
      setActiveImage(selectedProduct.imageUrl);
    } else {
      setActiveImage(null);
    }
  }, [selectedProduct]);

  // Sync selected variant based on size and color
  useEffect(() => {
    if (selectedProduct && selectedSize && selectedColor) {
      const variant = selectedProduct.productVariants?.find(
        (v) => v.size === selectedSize && v.color === selectedColor
      );
      if (variant && variant.stock > 0) {
        setSelectedVariantId(variant.id);
      } else {
        setSelectedVariantId(null);
      }
    } else {
      setSelectedVariantId(null);
    }
  }, [selectedSize, selectedColor, selectedProduct]);

  // Flashlight Effect Tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleBuy = async (e: React.MouseEvent, product?: Product) => {
    e.stopPropagation();
    const prod = product || selectedProduct;
    if (!prod) return;

    if (prod.productVariants && prod.productVariants.length > 0 && !selectedVariantId) {
      if (!selectedProduct) {
        setSelectedProduct(prod);
        return;
      }
      alert("Por favor, selecione um tamanho e uma cor válidos antes de prosseguir.");
      return;
    }

    const variantIdToUse = selectedVariantId || (prod.productVariants?.[0]?.id);

    if (!variantIdToUse) {
      alert("Produto indisponível (sem variantes).");
      return;
    }

    try {
      await addToCart(variantIdToUse, prod.id, 1);
      setIsOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
            <div className="absolute inset-0 rounded-full border-4 border-[#DDAF02] border-t-transparent animate-spin"></div>
          </div>
          <span className="text-[#DDAF02] font-mono tracking-[0.2em] text-xs uppercase animate-pulse">Carregando experiências</span>
        </div>
      </div>
    );
  }

  // --- PRODUCT DETAILED VIEW ---
  if (selectedProduct) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#e5e5e5] px-6 pt-24 pb-6 md:px-12 md:pt-28 md:pb-12 fade-in selection:bg-[#DDAF02]/30">
        <div className="max-w-7xl mx-auto">

          {/* Navigation */}
          <button 
            onClick={() => {
              setSelectedProduct(null);
              setSelectedVariantId(null);
              setSelectedSize(null);
              setSelectedColor(null);
            }}
            className="flex items-center text-neutral-400 hover:text-white transition-colors mb-8 md:mb-12 group w-min"
          >
            <span className="group-hover:-translate-x-1 transition-transform duration-300">
              <Icons.ArrowLeft />
            </span>
            <span className="ml-2 tracking-widest uppercase text-xs font-bold whitespace-nowrap">Voltar às compras</span>
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center">
            {/* Image & Gallery Column */}
            <div className="flex flex-col gap-4 animate-in" style={{ animationDelay: '0.1s' }}>
              {/* Main Image Glass Panel */}
              <div className="glass-panel p-8 md:p-12 rounded-[2rem] flex justify-center shadow-2xl relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#DDAF02]/10 to-transparent rounded-[2rem] pointer-events-none" />
                <img 
                  src={activeImage || selectedProduct.imageUrl} 
                  alt={selectedProduct.name}
                  className="max-h-[50vh] md:max-h-[60vh] object-contain drop-shadow-[0_20px_50px_rgba(255,255,255,0.1)] mix-blend-screen bg-white rounded-2xl p-6 transition-opacity duration-300"
                />
              </div>

              {/* Gallery Thumbnails */}
              {selectedProduct.galleryUrls && selectedProduct.galleryUrls.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  <button
                    onClick={() => setActiveImage(selectedProduct.imageUrl)}
                    className={`shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                      (activeImage || selectedProduct.imageUrl) === selectedProduct.imageUrl 
                        ? 'border-[#DDAF02] opacity-100 scale-100 shadow-lg shadow-[#DDAF02]/20' 
                        : 'border-white/10 opacity-50 hover:opacity-100 scale-95'
                    }`}
                  >
                    <img 
                      src={selectedProduct.imageUrl} 
                      alt="Principal"
                      className="w-20 h-20 object-cover bg-white"
                    />
                  </button>
                  {selectedProduct.galleryUrls.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(url)}
                      className={`shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                        activeImage === url 
                          ? 'border-[#DDAF02] opacity-100 scale-100 shadow-lg shadow-[#DDAF02]/20' 
                          : 'border-white/10 opacity-50 hover:opacity-100 scale-95'
                      }`}
                    >
                      <img 
                        src={url} 
                        alt={`Galeria ${idx + 1}`}
                        className="w-20 h-20 object-cover bg-white"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Product Info */}
            <div className="space-y-6 md:space-y-8 animate-in" style={{ animationDelay: '0.2s' }}>
              <div>
                <span className="text-[#DDAF02] bg-[#DDAF02]/10 px-3 py-1 rounded-full border border-[#DDAF02]/20 uppercase tracking-[0.2em] text-xs font-bold inline-block mb-4 md:mb-6">
                  Catálogo
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-white leading-tight">
                  {selectedProduct.name}
                </h1>
              </div>
              
              <p className="text-neutral-400 text-base md:text-lg leading-relaxed font-light">
                {selectedProduct.description}
              </p>
              
              {/* Product Variants Selector */}
              {selectedProduct.productVariants && selectedProduct.productVariants.length > 0 && (() => {
                const sizes = Array.from(new Set(selectedProduct.productVariants!.map(v => v.size)));
                const colors = Array.from(new Set(selectedProduct.productVariants!.map(v => v.color)));

                return (
                  <div className="pt-2 pb-2 space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-widest mb-3">Selecione o Tamanho</h3>
                      <div className="flex flex-wrap gap-3">
                        {sizes.map(size => {
                          const isAvailable = selectedProduct.productVariants!.some(v => v.size === size && v.stock > 0);
                          return (
                            <button
                              key={size}
                              onClick={() => setSelectedSize(size)}
                              disabled={!isAvailable}
                              className={`px-5 py-2 rounded-full border text-sm font-medium transition-all ${
                                selectedSize === size 
                                  ? 'border-[#DDAF02] bg-[#DDAF02]/20 text-white' 
                                  : !isAvailable
                                    ? 'border-neutral-800 bg-neutral-900 text-neutral-600 cursor-not-allowed opacity-50'
                                    : 'border-white/20 bg-transparent text-neutral-400 hover:border-white/50 hover:text-white'
                              }`}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-widest mb-3">Selecione a Cor</h3>
                      <div className="flex flex-wrap gap-3">
                        {colors.map(color => {
                          // Se já houver um tamanho selecionado, verificamos se a cor existe para esse tamanho
                          const isAvailable = selectedSize 
                            ? selectedProduct.productVariants!.some(v => v.size === selectedSize && v.color === color && v.stock > 0)
                            : selectedProduct.productVariants!.some(v => v.color === color && v.stock > 0);
                            
                          return (
                            <button
                              key={color}
                              onClick={() => setSelectedColor(color)}
                              disabled={!isAvailable}
                              className={`px-5 py-2 rounded-full border text-sm font-medium transition-all ${
                                selectedColor === color 
                                  ? 'border-[#DDAF02] bg-[#DDAF02]/20 text-white' 
                                  : !isAvailable
                                    ? 'border-neutral-800 bg-neutral-900 text-neutral-600 cursor-not-allowed opacity-50'
                                    : 'border-white/20 bg-transparent text-neutral-400 hover:border-white/50 hover:text-white'
                              }`}
                            >
                              {color}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-8">
                <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-md whitespace-nowrap">
                  R$ {selectedProduct.price.toFixed(2)}
                </span>
                <div className="flex items-center gap-2 text-[#DDAF02]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  <span className="font-bold text-lg">5.0 <span className="text-neutral-500 font-normal text-sm">(Novo)</span></span>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleBuy} 
                  className="btn-shimmer-wrap group cursor-pointer w-full sm:w-auto"
                  aria-label="Comprar Agora"
                >
                  <span className="btn-shimmer-content bg-neutral-900 group-hover:bg-black transition-colors">
                    <span className="btn-shimmer-effect"></span>
                    <span className="relative z-10 flex items-center text-lg font-bold tracking-wider uppercase text-white group-hover:text-[#DDAF02] transition-colors">
                      <Icons.ShoppingBag className="mr-3" />
                      {isAddingToCart ? 'Adicionando...' : 'Finalizar Compra'}
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // --- HOMEPAGE VIEW ---
  const heroProducts = products.slice(0, 5);
  const filteredProducts = products.filter(prod => 
    prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    prod.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] overflow-x-hidden selection:bg-[#DDAF02]/30 fade-in">
      

      {/* Hero Section */}
      <section className="relative w-full h-[100dvh] md:h-screen overflow-hidden mt-[80px] md:mt-0">
        {/* Background glow base */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-[#050505]/50 to-[#050505] pointer-events-none" />
        
        {heroProducts.map((prod, idx) => (
          <div 
            key={`hero-${prod.id}`} 
            className={`absolute inset-0 flex flex-col md:flex-row items-center justify-center px-6 py-20 md:p-24 gap-8 md:gap-16 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-y-auto md:overflow-visible hide-scrollbar ${idx === heroIndex ? 'opacity-100 z-10 scale-100 blur-0' : 'opacity-0 z-0 scale-105 blur-lg pointer-events-none'}`}
          >
            {/* Visual Subject */}
            <div className="w-full md:w-1/2 flex justify-center shrink-0 mt-8 md:mt-0 relative">
               <div className="relative w-full max-w-[16rem] md:max-w-[32rem] aspect-square glass-panel rounded-full flex items-center justify-center p-6 md:p-12 shadow-2xl group">
                  <div className="absolute inset-0 bg-[#DDAF02]/20 rounded-full blur-[60px] md:blur-[80px] -z-10 animate-pulse mix-blend-screen" />
                  <img 
                    src={prod.imageUrl} 
                    alt={prod.name} 
                    className="w-full h-48 md:h-full max-h-[400px] object-contain mix-blend-screen bg-transparent rounded-3xl drop-shadow-[0_20px_20px_rgba(255,255,255,0.1)] transition-transform duration-[2000ms] hover:scale-110" 
                  />
               </div>
            </div>

            {/* Typography Content */}
            <div className="w-full md:w-1/2 flex flex-col justify-center space-y-4 md:space-y-8 z-20 pb-24 md:pb-0">
              <div className="relative">
                <div className="absolute -left-6 top-2 bottom-2 w-1 bg-[#DDAF02] rounded-full hidden md:block" />
                <span className="text-[10px] md:text-xs uppercase tracking-[0.3em] font-mono text-[#DDAF02] font-bold">
                  Destaque Premium {idx + 1} / 5
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-6xl xl:text-7xl font-semibold text-white tracking-tighter mt-2 md:mt-4 leading-tight line-clamp-2 md:line-clamp-3">
                  {prod.name}
                </h2>
              </div>
              
              <p className="text-neutral-400 text-sm md:text-lg font-light max-w-xl line-clamp-3 leading-relaxed">
                {prod.description}
              </p>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 pt-2 md:pt-4">
                <button onClick={() => setSelectedProduct(prod)} className="btn-shimmer-wrap group cursor-pointer w-full sm:w-auto">
                  <span className="btn-shimmer-content py-3 md:py-4 px-6 md:px-8 bg-neutral-950 w-full flex justify-center">
                    <span className="btn-shimmer-effect"></span>
                    <span className="relative z-10 flex items-center text-xs md:text-sm font-bold tracking-widest uppercase text-white group-hover:text-[#DDAF02] transition-colors">
                      Ver Oferta
                      <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </span>
                  </span>
                </button>
                <div className="flex flex-col">
                  <span className="text-[10px] md:text-xs text-neutral-500 uppercase tracking-widest">Valor</span>
                  <span className="text-2xl md:text-4xl font-bold text-white tracking-tight">R$ {prod.price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel Indicators/Dots */}
        <div className="absolute bottom-6 md:bottom-8 left-0 right-0 flex justify-center items-center gap-3 z-30 pointer-events-auto">
          {heroProducts.map((_, idx) => (
            <button 
              key={idx}
              onClick={() => setHeroIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-[600ms] cubic-bezier(0.16,1,0.3,1) ${idx === heroIndex ? 'w-12 md:w-16 bg-[#DDAF02] shadow-[0_0_10px_rgba(221,175,2,0.8)]' : 'w-3 md:w-4 bg-white/20 hover:bg-white/50'}`}
              aria-label={`Ir para destaque ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Product List Showcase */}
      <section className="px-6 md:px-12 py-32 bg-[#050505] relative z-20">
        <div className="max-w-7xl mx-auto">
          {/* Section Heading & Search */}
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-8 animate-in" style={{ animationDelay: '0.1s' }}>
            <div>
              <span className="text-[#DDAF02] text-xs font-mono tracking-[0.2em] uppercase font-bold">Catálogo Online</span>
              <h3 className="text-4xl md:text-5xl font-semibold tracking-tighter text-white mt-4">Coleção Completa</h3>
            </div>
            
            <div className="mt-6 md:mt-0 w-full md:w-auto flex flex-col md:items-end gap-4">
              <p className="text-neutral-400 font-mono text-sm max-w-xs md:text-right hidden md:block">
                Navegue, interaja e descubra o que há de melhor com nossas interações fluídas.
              </p>
              
              {/* Search Bar */}
              <div className="relative w-full md:w-80 group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-[#DDAF02] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-full pl-11 pr-10 py-3 focus:outline-none focus:border-[#DDAF02]/50 focus:bg-black transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-500 hover:text-white transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Cards Grid or Empty State */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {filteredProducts.map((prod, index) => (
                <div 
                  key={prod.id}  
                  onClick={() => setSelectedProduct(prod)}
                onMouseMove={handleMouseMove}
                className="flashlight-card cursor-pointer group rounded-2xl p-6 flex flex-col justify-between h-[480px] animate-in"
                style={{ animationDelay: `${(index % 8) * 0.05}s` }}
              >
                {/* Image Box */}
                <div className="h-60 mb-6 p-6 bg-white rounded-xl flex items-center justify-center relative overflow-hidden transition-all duration-500 group-hover:shadow-[inset_0_0_40px_rgba(0,0,0,0.1)]">
                  <div className="absolute inset-0 bg-[#050505]/5 group-hover:bg-transparent transition-colors z-10 pointer-events-none" />
                  <img 
                    src={prod.imageUrl} 
                    alt={prod.name} 
                    className="max-h-full object-contain mix-blend-normal group-hover:scale-[1.12] transition-transform duration-[800ms] cubic-bezier(0.16,1,0.3,1)" 
                  />
                </div>
                
                {/* Content */}
                <div className="flex flex-col flex-1 justify-end z-10 relative">
                  <span className="text-[10px] text-[#DDAF02] uppercase tracking-[0.15em] font-bold mb-3 border border-[#DDAF02]/20 bg-[#DDAF02]/5 inline-block w-min whitespace-nowrap px-2 py-1 rounded">
                    Produto
                  </span>
                  <h4 className="text-neutral-200 font-medium text-lg leading-snug line-clamp-2 mb-4 group-hover:text-white transition-colors">
                    {prod.name}
                  </h4>
                  
                  <div className="flex items-center justify-between mt-auto pt-5 border-t border-white/10 group-hover:border-white/20 transition-colors">
                    <span className="text-2xl font-bold text-white tracking-tight">R$ {prod.price.toFixed(2)}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuy(e, prod);
                      }}
                      className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center group-hover:bg-[#DDAF02] group-hover:text-black group-hover:border-[#DDAF02] transition-all duration-300 text-white shadow-lg"
                      title="Adicionar ao Carrinho"
                    >
                      <Icons.ShoppingBag className="group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 mb-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <h4 className="text-2xl font-semibold text-white mb-3">Nenhum produto encontrado</h4>
              <p className="text-neutral-400 max-w-md mx-auto leading-relaxed">
                Não encontramos nenhum produto em nosso catálogo que corresponda a "<span className="text-white font-medium">{searchQuery}</span>".
                Verifique a ortografia ou use termos mais amplos.
              </p>
              <button 
                onClick={() => setSearchQuery("")}
                className="mt-8 px-8 py-3 rounded-full border border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all shadow-sm"
              >
                Limpar Busca
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Visual Footer */}
      <footer className="border-t border-white/5 py-12 bg-[#000] relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#DDAF02]/50 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-3 mb-6 md:mb-0">
             <span className="w-3 h-3 bg-[#DDAF02] rounded-full drop-shadow-md shadow-[0_0_10px_#DDAF02]"></span>
              <span className="text-white font-bold tracking-widest uppercase">PERNAMBUCO</span>
          </div>
          <p className="text-neutral-500 font-mono text-sm uppercase tracking-wider">
            © 2026. Vancer.
          </p>
        </div>
      </footer>
    </div>
  );
}
