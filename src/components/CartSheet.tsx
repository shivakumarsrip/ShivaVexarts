import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useNavigate } from "react-router";

export default function CartSheet() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getTotalPrice, clearCart } = useCartStore();
  const navigate = useNavigate();
  const subtotal = getTotalPrice();
  const shipping = subtotal > 0 ? 250 : 0;
  const total = subtotal + shipping;

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="w-full sm:w-[420px] bg-[#F5F5F5] border-l border-[#27272A] p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-[#E5E5E5]">
          <SheetTitle className="font-display text-[24px] text-[#09090B] flex items-center gap-2">
            <ShoppingBag size={22} />
            Your Cart
            {items.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-[#F59E0B] text-[#09090B] text-[12px] font-bold rounded-full">
                {items.length}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-24 h-24 bg-[#E5E5E5] rounded-full flex items-center justify-center mb-4">
              <ShoppingBag size={40} className="text-[#A1A1AA]" />
            </div>
            <p className="font-body text-[16px] font-medium text-[#27272A] mb-2">Your cart is empty</p>
            <p className="font-body text-[14px] text-[#A1A1AA] mb-6 text-center">
              Browse our gallery and add some amazing artwork to your cart.
            </p>
            <Button
              onClick={closeCart}
              className="bg-[#F59E0B] text-[#09090B] hover:bg-[#D97706] font-body font-medium rounded-lg px-6"
            >
              Browse Gallery
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="flex flex-col gap-4">
                {items.map((item) => (
                  <div
                    key={`${item.artworkId}-${item.size}`}
                    className="flex gap-3 bg-white rounded-xl p-3 border border-[#E5E5E5]"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-body text-[14px] font-semibold text-[#09090B] truncate">
                        {item.title}
                      </h4>
                      <p className="font-body text-[12px] text-[#A1A1AA]">{item.size}</p>
                      <p className="font-mono text-[14px] text-[#F59E0B] font-medium">
                        Rs. {item.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <button
                        onClick={() => removeItem(item.artworkId, item.size)}
                        className="text-[#A1A1AA] hover:text-[#DC2626] transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                      <div className="flex items-center gap-1 bg-[#F5F5F5] rounded-lg p-0.5">
                        <button
                          onClick={() =>
                            updateQuantity(item.artworkId, item.size, item.quantity - 1)
                          }
                          className="w-6 h-6 flex items-center justify-center text-[#52525B] hover:text-[#09090B]"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="font-mono text-[12px] font-medium text-[#09090B] w-5 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.artworkId, item.size, item.quantity + 1)
                          }
                          className="w-6 h-6 flex items-center justify-center text-[#52525B] hover:text-[#09090B]"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={clearCart}
                className="mt-4 text-[12px] font-body text-[#A1A1AA] hover:text-[#DC2626] transition-colors flex items-center gap-1"
              >
                <Trash2 size={12} />
                Clear cart
              </button>
            </ScrollArea>

            <div className="px-6 py-4 border-t border-[#E5E5E5] bg-white">
              <div className="flex justify-between mb-2">
                <span className="font-body text-[14px] text-[#52525B]">Subtotal</span>
                <span className="font-mono text-[14px] text-[#09090B]">
                  Rs. {subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between mb-3">
                <span className="font-body text-[14px] text-[#52525B]">Shipping</span>
                <span className="font-mono text-[14px] text-[#09090B]">
                  {shipping > 0 ? `Rs. ${shipping}` : "Free"}
                </span>
              </div>
              <div className="flex justify-between mb-4 pt-2 border-t border-[#E5E5E5]">
                <span className="font-body text-[16px] font-bold text-[#09090B]">Total</span>
                <span className="font-mono text-[20px] font-medium text-[#F59E0B]">
                  Rs. {total.toLocaleString()}
                </span>
              </div>
              <Button
                onClick={() => {
                  closeCart();
                  navigate("/checkout");
                }}
                className="w-full bg-[#F59E0B] text-[#09090B] hover:bg-[#D97706] font-body font-semibold text-[14px] rounded-lg py-6"
              >
                Proceed to Checkout
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
