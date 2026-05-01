import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: `Hello! I'm the Shiva Vexarts assistant. I can help you with:

- Finding artwork in our gallery
- Understanding pricing and sizes
- Commission inquiries
- Order status questions
- General information about Shivakumar's work

How can I help you today?`,
};

const RESPONSES: Record<string, string> = {
  price: "Our artwork prices range from Rs. 1,200 to Rs. 2,500 for A4 prints. A3 prints are 1.5x, A2 prints are 2.5x, and Digital Downloads are 0.6x the base price. Shipping starts at Rs. 150 within Kathmandu Valley.",
  size: "We offer four sizes: A4 Print (210 x 297mm), A3 Print (297 x 420mm), A2 Print (420 x 594mm), and Digital Download (high-res PNG, instant delivery).",
  commission: "Shivakumar is available for commissions including movie posters, album art, social media campaigns, and custom digital illustrations. Please use the contact form or reach out via Instagram @shiva_vexarts.",
  shipping: "Shipping rates: Nepal (Kathmandu Valley) - Rs. 150 (2-3 days), Nepal (Outside Valley) - Rs. 250 (3-5 days), India - Rs. 500 (7-10 days), International - Rs. 1,500 (10-15 days).",
  payment: "We accept payments via Khalti payment gateway. All transactions are secure and encrypted. You can pay during the checkout process.",
  artist: "Shivakumar S is a digital artist and movie publicity designer based in Hyderabad, India. With over a decade of experience, he has created posters for Tamil cinema and social awareness campaigns. His work has 387K+ views and 14,000+ appreciations.",
  gallery: "Our gallery features three collections: Movie Posters (8 artworks), Social Awareness Art (4 artworks), and Digital Illustrations (2 artworks). Browse them on the home page!",
  default: "I'd be happy to help! Could you provide more details about what you're looking for? You can ask about pricing, sizes, commissions, shipping, or browse our gallery.",
};

function getResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("price") || lower.includes("cost") || lower.includes("how much")) return RESPONSES.price;
  if (lower.includes("size") || lower.includes("dimension")) return RESPONSES.size;
  if (lower.includes("commission") || lower.includes("custom") || lower.includes("hire")) return RESPONSES.commission;
  if (lower.includes("shipping") || lower.includes("delivery")) return RESPONSES.shipping;
  if (lower.includes("payment") || lower.includes("pay") || lower.includes("khalti")) return RESPONSES.payment;
  if (lower.includes("artist") || lower.includes("shivakumar") || lower.includes("about")) return RESPONSES.artist;
  if (lower.includes("gallery") || lower.includes("artwork") || lower.includes("poster")) return RESPONSES.gallery;
  return RESPONSES.default;
}

export default function AIChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response delay
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700));

    const response = getResponse(userMessage.content);
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] pt-16 flex flex-col">
      {/* Header */}
      <div className="border-b border-[#27272A] bg-[#09090B]/80 backdrop-blur-sm">
        <div className="container-vex max-w-3xl mx-auto py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="text-[#A1A1AA] hover:text-[#F59E0B] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="w-8 h-8 bg-[#F59E0B]/15 rounded-full flex items-center justify-center">
            <Sparkles size={16} className="text-[#F59E0B]" />
          </div>
          <div>
            <h1 className="font-body text-[16px] font-semibold text-white">Shiva Vexarts AI Assistant</h1>
            <p className="font-body text-[12px] text-[#16A34A]">Online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-140px)]" ref={scrollRef}>
          <div className="container-vex max-w-3xl mx-auto py-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 bg-[#F59E0B]/15 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot size={16} className="text-[#F59E0B]" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-[#F59E0B] text-[#09090B]"
                      : "bg-[#18181B] text-white border border-[#27272A]"
                  }`}
                >
                  <p className="font-body text-[14px] whitespace-pre-line leading-relaxed">
                    {msg.content}
                  </p>
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 bg-[#27272A] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <User size={16} className="text-[#A1A1AA]" />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-[#F59E0B]/15 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-[#F59E0B]" />
                </div>
                <div className="bg-[#18181B] border border-[#27272A] rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-[#A1A1AA] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-[#A1A1AA] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-[#A1A1AA] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <div className="border-t border-[#27272A] bg-[#09090B]/80 backdrop-blur-sm">
        <div className="container-vex max-w-3xl mx-auto py-3 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about artwork, pricing, commissions..."
            className="bg-[#18181B] border-[#27272A] text-white placeholder:text-[#52525B] focus:border-[#F59E0B] focus:ring-[#F59E0B]/20 rounded-xl"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="bg-[#F59E0B] text-[#09090B] hover:bg-[#D97706] rounded-xl px-4"
          >
            {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </Button>
        </div>
      </div>
    </div>
  );
}
