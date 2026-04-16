"use client";

import React, { useState, useEffect } from "react";


// Types
interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: {
    rate: number;
    count: number;
  };
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

  // Tradutor Local (Mocking EN -> PT-BR)
  const translateProduct = (prod: Product): Product => {
    const categoryMap: Record<string, string> = {
      "men's clothing": "Moda Masculina",
      "women's clothing": "Moda Feminina",
      "jewelery": "Joias",
      "electronics": "Eletrônicos"
    };

    const titleMap: Record<number, string> = {
      1: "Mochila Fjallraven Foldsack No. 1",
      2: "Camiseta Casual Premium Slim Fit",
      3: "Jaqueta de Algodão Masculina Elegante",
      4: "Camiseta Manga Longa Casual Slim",
      5: "Pulseira de Prata de Lei Coleção Lendas",
      6: "Anel de Ouro Branco Maciço Petite",
      7: "Anel Banhado a Ouro Princesa Coruja",
      8: "Brincos de Aço Inoxidável Banhado a Ouro",
      9: "HD Externo Portátil WD 2TB",
      10: "SSD Interno SanDisk 1TB Velocidade Ultra",
      11: "SSD Interno Silicon Power 256GB",
      12: "HD Externo WD 4TB Gaming Drive",
      13: "Monitor Acer SB220Q 21.5\" IPS Full HD",
      14: "Monitor Curvo Samsung 49\" QLED 144Hz",
      15: "Jaqueta de Inverno 3 em 1 Feminina",
      16: "Jaqueta de Couro Sintético Motoqueira",
      17: "Casaco de Chuva Feminino Forrado",
      18: "Camiseta Feminina Básica Decote em V",
      19: "Blusa Feminina Manga Curta Decote Redondo",
      20: "Camiseta Casual de Algodão Feminina"
    };

    return {
      ...prod,
      category: categoryMap[prod.category] || prod.category,
      title: titleMap[prod.id] || prod.title,
      description: "Descubra a excelência e durabilidade desta peça exclusiva. Projetada com atenção aos mínimos detalhes para oferecer o máximo de conforto, estilo e um acabamento impecável para o seu dia a dia.",
    };
  };

  // 1. Fetching Products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://fakestoreapi.com/products";
        const res = await fetch(apiUrl);
        const data: Product[] = await res.json();
        
        // Aplica a tradução programática
        const translatedData = data.map(translateProduct);
        setProducts(translatedData);
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

  // Flashlight Effect Tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    alert("Operação concluída! O item foi adicionado ao seu carrinho.");
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
      <div className="min-h-screen bg-[#050505] text-[#e5e5e5] p-6 md:p-12 fade-in selection:bg-[#DDAF02]/30">
        
        {/* Navigation */}
        <button 
          onClick={() => setSelectedProduct(null)}
          className="flex items-center text-neutral-400 hover:text-white transition-colors mb-12 group w-min"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-300">
            <Icons.ArrowLeft />
          </span>
          <span className="ml-2 tracking-widest uppercase text-xs font-bold whitespace-nowrap">Voltar às compras</span>
        </button>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image Glass Panel */}
          <div className="glass-panel p-8 md:p-12 rounded-[2rem] flex justify-center animate-in shadow-2xl relative" style={{ animationDelay: '0.1s' }}>
            <div className="absolute inset-0 bg-gradient-to-tr from-[#DDAF02]/10 to-transparent rounded-[2rem] pointer-events-none" />
            <img 
              src={selectedProduct.image} 
              alt={selectedProduct.title}
              className="max-h-[50vh] md:max-h-[60vh] object-contain drop-shadow-[0_20px_50px_rgba(255,255,255,0.1)] mix-blend-screen bg-white rounded-2xl p-6"
            />
          </div>
          
          {/* Product Info */}
          <div className="space-y-8 animate-in" style={{ animationDelay: '0.2s' }}>
            <div>
              <span className="text-[#DDAF02] bg-[#DDAF02]/10 px-3 py-1 rounded-full border border-[#DDAF02]/20 uppercase tracking-[0.2em] text-xs font-bold inline-block mb-6">
                {selectedProduct.category}
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-white leading-tight">
                {selectedProduct.title}
              </h1>
            </div>
            
            <p className="text-neutral-400 text-lg leading-relaxed font-light">
              {selectedProduct.description}
            </p>
            
            <div className="pt-4 flex items-center justify-between border-b border-white/10 pb-8">
              <span className="text-5xl md:text-6xl font-bold text-white drop-shadow-md">
                R$ {selectedProduct.price.toFixed(2)}
              </span>
              <div className="flex items-center gap-2 text-[#DDAF02]">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                <span className="font-bold text-lg">{selectedProduct.rating.rate} <span className="text-neutral-500 font-normal text-sm">({selectedProduct.rating.count} avaliações)</span></span>
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
                    Finalizar Compra
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- HOMEPAGE VIEW ---
  const heroProducts = products.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] overflow-x-hidden selection:bg-[#DDAF02]/30 fade-in">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[60] px-6 md:px-12 py-6 flex justify-between items-center pointer-events-none">
        <div className="pointer-events-auto backdrop-blur-md bg-black/40 px-6 py-3 rounded-full border border-white/10">
          <h1 className="text-lg md:text-xl font-bold tracking-widest text-white uppercase drop-shadow-md flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#DDAF02] rounded-full animate-pulse shadow-[0_0_10px_#DDAF02]"></span>
            IBI STORE
          </h1>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full h-[90vh] md:h-screen flex items-center justify-center overflow-hidden">
        {/* Background glow base */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-[#050505]/50 to-[#050505] pointer-events-none" />
        
        {heroProducts.map((prod, idx) => (
          <div 
            key={`hero-${prod.id}`} 
            className={`absolute inset-0 flex flex-col md:flex-row items-center justify-center p-6 md:p-24 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${idx === heroIndex ? 'opacity-100 z-10 scale-100 blur-0' : 'opacity-0 z-0 scale-105 blur-lg pointer-events-none'}`}
          >
            {/* Visual Subject */}
            <div className="w-full md:w-1/2 flex justify-center mt-24 md:mt-0 relative">
               <div className="relative w-64 h-64 md:w-[32rem] md:h-[32rem] glass-panel rounded-full flex items-center justify-center p-12 shadow-2xl group">
                  <div className="absolute inset-0 bg-[#DDAF02]/20 rounded-full blur-[80px] -z-10 animate-pulse mix-blend-screen" />
                  <img 
                    src={prod.image} 
                    alt={prod.title} 
                    className="max-h-full object-contain mix-blend-screen bg-transparent rounded-3xl p-4 drop-shadow-[0_30px_30px_rgba(255,255,255,0.1)] transition-transform duration-[2000ms] hover:scale-110" 
                  />
               </div>
            </div>

            {/* Typography Content */}
            <div className="w-full md:w-1/2 mt-12 md:mt-0 flex flex-col justify-center space-y-6 md:space-y-8 z-20 md:pl-12">
              <div className="relative">
                <div className="absolute -left-6 top-2 bottom-2 w-1 bg-[#DDAF02] rounded-full hidden md:block" />
                <span className="text-xs uppercase tracking-[0.3em] font-mono text-[#DDAF02] font-bold">
                  Destaque Premium {idx + 1} / 5
                </span>
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-semibold text-white tracking-tighter mt-4 leading-[1.1] line-clamp-3">
                  {prod.title}
                </h2>
              </div>
              
              <p className="text-neutral-400 text-sm md:text-lg font-light max-w-xl line-clamp-2 leading-relaxed">
                {prod.description}
              </p>
              
              <div className="flex items-center gap-6 pt-4">
                <button onClick={() => setSelectedProduct(prod)} className="btn-shimmer-wrap group cursor-pointer">
                  <span className="btn-shimmer-content py-4 px-8 bg-neutral-950">
                    <span className="btn-shimmer-effect"></span>
                    <span className="relative z-10 flex items-center text-sm font-bold tracking-widest uppercase text-white group-hover:text-[#DDAF02] transition-colors">
                      Ver Oferta
                      <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </span>
                  </span>
                </button>
                <div className="flex flex-col">
                  <span className="text-xs text-neutral-500 uppercase tracking-widest">Valor</span>
                  <span className="text-3xl md:text-4xl font-bold text-white tracking-tight">R$ {prod.price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel Indicators/Dots */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-4 z-30">
          {heroProducts.map((_, idx) => (
            <button 
              key={idx}
              onClick={() => setHeroIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-[600ms] cubic-bezier(0.16,1,0.3,1) ${idx === heroIndex ? 'w-16 bg-[#DDAF02] shadow-[0_0_10px_rgba(221,175,2,0.8)]' : 'w-4 bg-white/20 hover:bg-white/50'}`}
              aria-label={`Ir para destaque ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Product List Showcase */}
      <section className="px-6 md:px-12 py-32 bg-[#050505] relative z-20">
        <div className="max-w-7xl mx-auto">
          {/* Section Heading */}
          <div className="mb-20 flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-8 animate-in" style={{ animationDelay: '0.1s' }}>
            <div>
              <span className="text-[#DDAF02] text-xs font-mono tracking-[0.2em] uppercase font-bold">Catálogo Online</span>
              <h3 className="text-4xl md:text-5xl font-semibold tracking-tighter text-white mt-4">Coleção Completa</h3>
            </div>
            <p className="text-neutral-400 font-mono text-sm max-w-xs mt-4 md:mt-0 md:text-right">
              Navegue, interaja e descubra o que há de melhor com nossas interações fluídas.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {products.map((prod, index) => (
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
                    src={prod.image} 
                    alt={prod.title} 
                    className="max-h-full object-contain mix-blend-normal group-hover:scale-[1.12] transition-transform duration-[800ms] cubic-bezier(0.16,1,0.3,1)" 
                  />
                </div>
                
                {/* Content */}
                <div className="flex flex-col flex-1 justify-end z-10 relative">
                  <span className="text-[10px] text-[#DDAF02] uppercase tracking-[0.15em] font-bold mb-3 border border-[#DDAF02]/20 bg-[#DDAF02]/5 inline-block w-min whitespace-nowrap px-2 py-1 rounded">
                    {prod.category}
                  </span>
                  <h4 className="text-neutral-200 font-medium text-lg leading-snug line-clamp-2 mb-4 group-hover:text-white transition-colors">
                    {prod.title}
                  </h4>
                  
                  <div className="flex items-center justify-between mt-auto pt-5 border-t border-white/10 group-hover:border-white/20 transition-colors">
                    <span className="text-2xl font-bold text-white tracking-tight">R$ {prod.price.toFixed(2)}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuy(e);
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
        </div>
      </section>

      {/* Visual Footer */}
      <footer className="border-t border-white/5 py-12 bg-[#000] relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#DDAF02]/50 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-3 mb-6 md:mb-0">
             <span className="w-3 h-3 bg-[#DDAF02] rounded-full drop-shadow-md shadow-[0_0_10px_#DDAF02]"></span>
             <span className="text-white font-bold tracking-widest uppercase">IBI STORE</span>
          </div>
          <p className="text-neutral-500 font-mono text-sm uppercase tracking-wider">
            © 2026. Feito com rigor estético.
          </p>
        </div>
      </footer>
    </div>
  );
}
