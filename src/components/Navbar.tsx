import { useState, useEffect } from "react";
import { ShoppingCart, Menu, X, Instagram, LogIn, LogOut, Shield, MessageSquare } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router";

export default function Navbar() {
  const { openCart, getTotalItems } = useCartStore();
  const { user, isAdmin, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const totalItems = getTotalItems();

  const navLinks = [
    { label: "Gallery", href: "#gallery" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (href: string) => {
    setMobileOpen(false);
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } else {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#09090B]/90 backdrop-blur-xl border-b border-[#27272A]"
          : "bg-transparent"
      }`}
      style={{ height: "var(--nav-height)" }}
    >
      <div className="container-vex h-full flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={() => navigate("/")}
          className="font-display text-[20px] tracking-[0.1em] text-white hover:text-[#F59E0B] transition-colors"
        >
          VEXARTS
        </button>

        {/* Center Nav Links - Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className="font-body text-[14px] font-medium text-[#A1A1AA] hover:text-[#F59E0B] transition-colors relative group"
            >
              {link.label}
              <span className="absolute bottom-[-4px] left-0 w-0 h-[2px] bg-[#F59E0B] group-hover:w-full transition-all duration-300" />
            </button>
          ))}
          <button
            onClick={() => navigate("/ai-chat")}
            className="font-body text-[14px] font-medium text-[#A1A1AA] hover:text-[#F59E0B] transition-colors flex items-center gap-1.5"
          >
            <MessageSquare size={14} />
            AI Chat
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className="hidden md:flex items-center gap-1.5 text-[#A1A1AA] hover:text-[#F59E0B] transition-colors"
            >
              <Shield size={16} />
              <span className="font-body text-[13px] font-medium">Admin</span>
            </button>
          )}

          {user ? (
            <button
              onClick={logout}
              className="hidden md:flex items-center gap-1.5 text-[#A1A1AA] hover:text-[#F59E0B] transition-colors"
            >
              <LogOut size={16} />
              <span className="font-body text-[13px] font-medium">Logout</span>
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="hidden md:flex items-center gap-1.5 text-[#A1A1AA] hover:text-[#F59E0B] transition-colors"
            >
              <LogIn size={16} />
              <span className="font-body text-[13px] font-medium">Login</span>
            </button>
          )}

          <button
            onClick={() => window.open("https://www.instagram.com/shiva_vexarts", "_blank")}
            className="hidden md:block text-[#A1A1AA] hover:text-[#F59E0B] transition-colors"
          >
            <Instagram size={18} />
          </button>

          {/* Cart Button */}
          <button
            onClick={openCart}
            className="relative p-2 text-[#A1A1AA] hover:text-[#F59E0B] transition-colors"
          >
            <ShoppingCart size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#F59E0B] rounded-full text-[10px] font-bold text-[#09090B] flex items-center justify-center animate-bounce">
                {totalItems}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-[#A1A1AA] hover:text-white"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#09090B]/95 backdrop-blur-xl border-t border-[#27272A]">
          <div className="container-vex py-4 flex flex-col gap-3">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="font-body text-[14px] font-medium text-[#A1A1AA] hover:text-[#F59E0B] transition-colors text-left py-2"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => { setMobileOpen(false); navigate("/ai-chat"); }}
              className="font-body text-[14px] font-medium text-[#A1A1AA] hover:text-[#F59E0B] transition-colors text-left py-2 flex items-center gap-2"
            >
              <MessageSquare size={14} />
              AI Chat
            </button>
            {isAdmin && (
              <button
                onClick={() => { setMobileOpen(false); navigate("/admin"); }}
                className="font-body text-[14px] font-medium text-[#A1A1AA] hover:text-[#F59E0B] transition-colors text-left py-2 flex items-center gap-2"
              >
                <Shield size={14} />
                Admin Dashboard
              </button>
            )}
            {user ? (
              <button
                onClick={() => { setMobileOpen(false); logout(); }}
                className="font-body text-[14px] font-medium text-[#A1A1AA] hover:text-[#F59E0B] transition-colors text-left py-2 flex items-center gap-2"
              >
                <LogOut size={14} />
                Logout
              </button>
            ) : (
              <button
                onClick={() => { setMobileOpen(false); navigate("/login"); }}
                className="font-body text-[14px] font-medium text-[#A1A1AA] hover:text-[#F59E0B] transition-colors text-left py-2 flex items-center gap-2"
              >
                <LogIn size={14} />
                Login
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
