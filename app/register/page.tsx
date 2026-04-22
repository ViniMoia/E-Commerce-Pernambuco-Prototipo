import { RegisterForm } from "@/components/forms/RegisterForm";
import Link from "next/link";

export const metadata = {
  title: "Registro | Pernambuco Confecções",
  description: "Crie sua conta para acessar ofertas exclusivas.",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] flex flex-col relative overflow-hidden selection:bg-[#dbb501]/30">
      {/* Background elements for aesthetic similar to homepage */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-[#050505]/50 to-[#050505] pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#dbb501]/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#dbb501]/5 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
      
      {/* Header Minimalista */}
      <header className="fixed top-0 left-0 right-0 z-[60] px-6 md:px-12 py-6 flex justify-between items-center max-[1500px]:py-4 pointer-events-none">
        <div className="pointer-events-auto backdrop-blur-md bg-black/40 px-6 py-3 rounded-full border border-white/10 flex items-center max-[1500px]:px-4 max-[1500px]:py-2">
          <h1 className="text-lg md:text-md font-bold tracking-widest text-white uppercase drop-shadow-md flex items-center gap-2 max-[1500px]:text-xs">
            <span className="w-2.5 h-2.5 bg-[#dbb501] rounded-full animate-pulse shadow-[0_0_10px_#dbb501] max-[1500px]:w-2 max-[1500px]:h-2"></span>
            Pernambuco Confecções
          </h1>
        </div>

        <nav className="pointer-events-auto flex items-center gap-4 max-[1500px]:gap-2">
           <Link 
             href="/"
             className="px-6 py-3 rounded-full border border-white/10 bg-black/40 backdrop-blur-md text-white text-sm font-bold tracking-widest uppercase hover:bg-white/10 hover:border-white/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#dbb501]/50 max-[1500px]:px-4 max-[1500px]:py-2 max-[1500px]:text-xs"
           >
             Voltar ao Início
           </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center pt-32 pb-16 px-4 md:px-6 relative z-10 w-full h-full fade-in">
        <RegisterForm />
      </main>
    </div>
  );
}
