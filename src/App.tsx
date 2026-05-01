import { Routes, Route } from "react-router";
import Navbar from "@/components/Navbar";
import CartSheet from "@/components/CartSheet";
import Footer from "@/components/Footer";
import HeroSection from "@/sections/HeroSection";
import GallerySection from "@/sections/GallerySection";
import AboutSection from "@/sections/AboutSection";
import ContactSection from "@/sections/ContactSection";
import Checkout from "@/pages/Checkout";
import Admin from "@/pages/Admin";
import AIChat from "@/pages/AIChat";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";

function Home() {
  return (
    <>
      <HeroSection />
      <GallerySection />
      <AboutSection />
      <ContactSection />
    </>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-[#09090B]">
      <Navbar />
      <CartSheet />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/ai-chat" element={<AIChat />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
