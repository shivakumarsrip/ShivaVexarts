import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, CheckCircle, CreditCard, Loader2 } from "lucide-react";

const shippingRates: Record<string, number> = {
  nepal_kathmandu: 150,
  nepal_outside: 250,
  india: 500,
  international: 1500,
};

export default function Checkout() {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [step, setStep] = useState<"shipping" | "payment" | "success">("shipping");
  const [orderId, setOrderId] = useState("");

  // Shipping form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("nepal_kathmandu");

  const createOrder = trpc.order.create.useMutation();

  const subtotal = getTotalPrice();
  const shippingCost = shippingRates[country] || 250;
  const total = subtotal + shippingCost;

  const handleSubmitShipping = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("payment");
  };

  const handlePayment = async () => {
    const countryMap: Record<string, string> = {
      nepal_kathmandu: "Nepal",
      nepal_outside: "Nepal",
      india: "India",
      international: "International",
    };

    try {
      const result = await createOrder.mutateAsync({
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        shippingAddress: address,
        shippingCity: city,
        shippingCountry: countryMap[country] || "Nepal",
        totalAmount: total,
        shippingCost,
        items: items.map((item) => ({
          artworkId: item.artworkId,
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
      });

      // Simulate Khalti payment
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setOrderId(result.orderId);
      clearCart();
      setStep("success");
    } catch (err) {
      console.error("Order failed:", err);
    }
  };

  if (items.length === 0 && step !== "success") {
    return (
      <div className="min-h-screen bg-[#09090B] pt-20">
        <div className="container-vex max-w-2xl mx-auto text-center py-20">
          <h2 className="font-display text-[32px] text-white mb-4">Your Cart is Empty</h2>
          <p className="font-body text-[#A1A1AA] mb-6">
            Add some artwork to your cart before checking out.
          </p>
          <Button
            onClick={() => navigate("/")}
            className="bg-[#F59E0B] text-[#09090B] hover:bg-[#D97706]"
          >
            Browse Gallery
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] pt-20 pb-12">
      <div className="container-vex max-w-3xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#A1A1AA] hover:text-[#F59E0B] transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          <span className="font-body text-[14px]">Back</span>
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {["Shipping", "Payment", "Confirmation"].map((s, i) => {
            const currentStep = step === "shipping" ? 0 : step === "payment" ? 1 : 2;
            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-body text-[13px] font-medium ${
                    i <= currentStep
                      ? "bg-[#F59E0B] text-[#09090B]"
                      : "bg-[#27272A] text-[#52525B]"
                  }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`font-body text-[13px] ${
                    i <= currentStep ? "text-white" : "text-[#52525B]"
                  }`}
                >
                  {s}
                </span>
                {i < 2 && <div className="w-8 h-[2px] bg-[#27272A] mx-1" />}
              </div>
            );
          })}
        </div>

        {/* Step: Shipping */}
        {step === "shipping" && (
          <div className="bg-[#18181B] rounded-2xl border border-[#27272A] p-6 md:p-8">
            <h2 className="font-display text-[28px] text-white mb-6">Shipping Information</h2>
            <form onSubmit={handleSubmitShipping} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#A1A1AA] text-[13px] mb-1.5 block">Full Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="bg-[#09090B] border-[#52525B] text-white placeholder:text-[#52525B] focus:border-[#F59E0B]"
                    required
                  />
                </div>
                <div>
                  <Label className="text-[#A1A1AA] text-[13px] mb-1.5 block">Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@email.com"
                    className="bg-[#09090B] border-[#52525B] text-white placeholder:text-[#52525B] focus:border-[#F59E0B]"
                    required
                  />
                </div>
              </div>

              <div>
                <Label className="text-[#A1A1AA] text-[13px] mb-1.5 block">Phone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+977 98XXXXXXXX"
                  className="bg-[#09090B] border-[#52525B] text-white placeholder:text-[#52525B] focus:border-[#F59E0B]"
                  required
                />
              </div>

              <div>
                <Label className="text-[#A1A1AA] text-[13px] mb-1.5 block">Address</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address"
                  className="bg-[#09090B] border-[#52525B] text-white placeholder:text-[#52525B] focus:border-[#F59E0B]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#A1A1AA] text-[13px] mb-1.5 block">City</Label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="bg-[#09090B] border-[#52525B] text-white placeholder:text-[#52525B] focus:border-[#F59E0B]"
                    required
                  />
                </div>
                <div>
                  <Label className="text-[#A1A1AA] text-[13px] mb-1.5 block">Shipping Region</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="bg-[#09090B] border-[#52525B] text-white focus:border-[#F59E0B]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#09090B] border-[#52525B]">
                      <SelectItem value="nepal_kathmandu">Nepal (Kathmandu Valley)</SelectItem>
                      <SelectItem value="nepal_outside">Nepal (Outside Valley)</SelectItem>
                      <SelectItem value="india">India</SelectItem>
                      <SelectItem value="international">International</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#F59E0B] text-[#09090B] hover:bg-[#D97706] font-body font-semibold rounded-lg py-6 mt-4"
              >
                Continue to Payment
              </Button>
            </form>
          </div>
        )}

        {/* Step: Payment */}
        {step === "payment" && (
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-[#18181B] rounded-2xl border border-[#27272A] p-6">
              <h3 className="font-body text-[16px] font-bold text-white mb-4">Order Summary</h3>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={`${item.artworkId}-${item.size}`} className="flex items-center gap-3">
                    <img src={item.image} alt={item.title} className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-[14px] text-white truncate">{item.title}</p>
                      <p className="font-body text-[12px] text-[#A1A1AA]">{item.size} x{item.quantity}</p>
                    </div>
                    <span className="font-mono text-[14px] text-[#F59E0B]">
                      Rs. {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-[#27272A] space-y-2">
                <div className="flex justify-between">
                  <span className="font-body text-[14px] text-[#A1A1AA]">Subtotal</span>
                  <span className="font-mono text-[14px] text-white">Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-body text-[14px] text-[#A1A1AA]">Shipping</span>
                  <span className="font-mono text-[14px] text-white">Rs. {shippingCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#27272A]">
                  <span className="font-body text-[16px] font-bold text-white">Total</span>
                  <span className="font-mono text-[20px] text-[#F59E0B]">Rs. {total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-[#18181B] rounded-2xl border border-[#27272A] p-6">
              <h3 className="font-body text-[16px] font-bold text-white mb-4">Payment Method</h3>
              <div className="p-4 bg-gradient-to-r from-[#5C2D91] to-[#7B3FA0] rounded-xl mb-4">
                <div className="flex items-center gap-3">
                  <CreditCard size={24} className="text-white" />
                  <div>
                    <p className="font-body text-[14px] font-semibold text-white">Khalti Payment</p>
                    <p className="font-body text-[12px] text-white/70">Pay securely with Khalti</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handlePayment}
                disabled={createOrder.isPending}
                className="w-full bg-[#5C2D91] hover:bg-[#4a2475] text-white font-body font-semibold rounded-lg py-6"
              >
                {createOrder.isPending ? (
                  <Loader2 size={18} className="animate-spin mr-2" />
                ) : (
                  <CreditCard size={18} className="mr-2" />
                )}
                Pay Rs. {total.toLocaleString()} with Khalti
              </Button>

              <button
                onClick={() => setStep("shipping")}
                className="w-full mt-3 text-[#A1A1AA] hover:text-white font-body text-[13px] text-center transition-colors"
              >
                Back to Shipping
              </button>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div className="bg-[#18181B] rounded-2xl border border-[#27272A] p-8 text-center">
            <div className="w-20 h-20 bg-[#16A34A]/15 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-[#16A34A]" />
            </div>
            <h2 className="font-display text-[32px] text-white mb-2">Order Confirmed!</h2>
            <p className="font-body text-[16px] text-[#A1A1AA] mb-2">
              Thank you for your purchase. Your order has been placed successfully.
            </p>
            <p className="font-mono text-[14px] text-[#F59E0B] mb-6">
              Order ID: {orderId}
            </p>
            <div className="bg-[#09090B] rounded-xl p-4 mb-6 max-w-md mx-auto">
              <p className="font-body text-[13px] text-[#A1A1AA]">
                Estimated delivery: <span className="text-white">5-7 business days</span>
              </p>
            </div>
            <Button
              onClick={() => navigate("/")}
              className="bg-[#F59E0B] text-[#09090B] hover:bg-[#D97706] font-body font-semibold rounded-lg px-8 py-3"
            >
              Continue Shopping
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
