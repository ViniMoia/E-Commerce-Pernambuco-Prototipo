import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { User, LogOut } from "lucide-react";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="fixed top-0 left-0 right-0 z-[60] px-6 md:px-12 py-6 flex justify-between items-center pointer-events-none max-[1500px]:py-4">
      {/* Brand */}
      <div className="pointer-events-auto backdrop-blur-md bg-black/40 px-6 py-3 rounded-full border border-white/10 flex items-center max-[1500px]:px-4 max-[1500px]:py-2">
        <Link href="/">
          <h1 className="text-lg md:text-md font-bold tracking-widest text-white uppercase drop-shadow-md flex items-center gap-2 max-[1500px]:text-xs">
            <span className="w-2.5 h-2.5 bg-[#DDAF02] rounded-full animate-pulse shadow-[0_0_10px_#DDAF02] max-[1500px]:w-2 max-[1500px]:h-2"></span>
            Pernambuco Confecções
          </h1>
        </Link>
      </div>

      {/* Auth Navigation */}
      <nav className="pointer-events-auto flex items-center gap-4 max-[1500px]:gap-2">
        {user ? (
          <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
            <Link href="/profile" className="flex items-center gap-3 hover:text-[#DDAF02] transition-colors">
              <div className="w-8 h-8 rounded-full bg-[#DDAF02]/10 border border-[#DDAF02]/50 flex items-center justify-center overflow-hidden">
                {user.avatarImageUrl ? (
                  <img src={user.avatarImageUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[#DDAF02] text-xs font-bold">{user.name.substring(0, 2).toUpperCase()}</span>
                )}
              </div>
              <span className="text-white text-sm font-medium hidden md:block">{user.name}</span>
            </Link>
            
            <div className="w-px h-6 bg-white/10 mx-2"></div>
            
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="text-zinc-400 hover:text-white transition-colors" title="Sair">
                <LogOut className="w-5 h-5" />
              </button>
            </form>
          </div>
        ) : (
          <>
            <Link 
              href="/login"
              className="px-6 py-3 ml-2 rounded-full border border-white/10 bg-black/40 backdrop-blur-md text-white text-sm font-bold tracking-widest uppercase hover:bg-white/10 hover:border-white/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#DDAF02]/50 max-[1500px]:px-4 max-[1500px]:py-2 max-[1500px]:text-xs"
              aria-label="Login"
            >
              Login
            </Link>
            
            <Link 
              href="/register"
              className="btn-shimmer-wrap group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#DDAF02]/50"
              aria-label="Inscrever-se"
            >
              <span className="btn-shimmer-content py-3 px-6 bg-neutral-950 max-[1500px]:px-4 max-[1500px]:py-2">
                <span className="btn-shimmer-effect"></span>
                <span className="relative z-10 flex items-center text-sm font-bold tracking-widest uppercase text-white group-hover:text-[#DDAF02] transition-colors max-[1500px]:text-xs">
                  Inscrever-se
                </span>
              </span>
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
