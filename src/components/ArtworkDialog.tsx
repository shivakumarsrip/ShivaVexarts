import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Artwork } from "@db/schema";
import { calculatePrice, useCartStore } from "@/store/cart";
import { X, ShoppingCart, Check } from "lucide-react";
import { getArtworkImageFallback } from "@/lib/artwork-images";

interface ArtworkDialogProps {
  artwork: Artwork | null;
  open: boolean;
  onClose: () => void;
}

const sizes = ["A4 Print", "A3 Print", "A2 Print", "Digital Download"];

export default function ArtworkDialog({ artwork, open, onClose }: ArtworkDialogProps) {
  const [selectedSize, setSelectedSize] = useState("A4 Print");
  const [added, setAdded] = useState(false);
  const [imageSrc, setImageSrc] = useState(artwork?.image ?? "");
  const { addItem } = useCartStore();

  useEffect(() => {
    setImageSrc(artwork?.image ?? "");
  }, [artwork?.image]);

  if (!artwork) return null;

  const price = calculatePrice(artwork.basePrice, selectedSize);

  const handleAddToCart = () => {
    addItem({
      artworkId: artwork.id,
      title: artwork.title,
      image: artwork.image,
      size: selectedSize,
      price: price,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto bg-[#18181B] border border-[#27272A] p-0 rounded-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 bg-[#09090B]/70 rounded-full flex items-center justify-center text-[#A1A1AA] hover:text-white transition-colors"
        >
          <X size={16} />
        </button>

        {/* Image */}
        <div className="w-full h-[400px] md:h-[500px]">
          <img
            src={imageSrc || artwork.image}
            alt={artwork.title}
            onError={() => {
              const fallback = getArtworkImageFallback(artwork.image);
              if (imageSrc !== fallback) setImageSrc(fallback);
            }}
            className="w-full h-full object-cover rounded-t-2xl"
          />
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-[#F59E0B]/15 text-[#F59E0B] text-[11px] font-body font-medium rounded-full uppercase">
              {artwork.collection?.replace("_", " ")}
            </span>
            <span className="px-2 py-0.5 bg-[#27272A] text-[#A1A1AA] text-[11px] font-body font-medium rounded-full">
              {artwork.category}
            </span>
          </div>

          <h2 className="font-display text-[32px] text-white mb-2">{artwork.title}</h2>

          <p className="font-body text-[16px] text-[#A1A1AA] leading-relaxed mb-4">
            {artwork.description}
          </p>

          {/* Specs */}
          <div className="flex flex-wrap gap-4 mb-6">
            {artwork.year && (
              <div className="px-3 py-1.5 bg-[#27272A] rounded-lg">
                <span className="font-mono text-[12px] text-[#A1A1AA]">Year: </span>
                <span className="font-mono text-[12px] text-white">{artwork.year}</span>
              </div>
            )}
            {artwork.dimensions && (
              <div className="px-3 py-1.5 bg-[#27272A] rounded-lg">
                <span className="font-mono text-[12px] text-[#A1A1AA]">Size: </span>
                <span className="font-mono text-[12px] text-white">{artwork.dimensions}</span>
              </div>
            )}
            {artwork.format && (
              <div className="px-3 py-1.5 bg-[#27272A] rounded-lg">
                <span className="font-mono text-[12px] text-[#A1A1AA]">Format: </span>
                <span className="font-mono text-[12px] text-white">{artwork.format}</span>
              </div>
            )}
          </div>

          {/* Size Selector */}
          <div className="mb-6">
            <label className="font-body text-[14px] font-medium text-white mb-2 block">
              Select Size
            </label>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 rounded-lg font-body text-[13px] font-medium transition-all ${
                    selectedSize === size
                      ? "bg-[#F59E0B] text-[#09090B]"
                      : "bg-[#27272A] text-[#A1A1AA] hover:bg-[#3f3f46]"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Price & CTA */}
          <div className="flex items-center justify-between pt-4 border-t border-[#27272A]">
            <div>
              <span className="font-mono text-[12px] text-[#A1A1AA]">{selectedSize}</span>
              <p className="font-mono text-[28px] text-[#F59E0B]">Rs. {price.toLocaleString()}</p>
            </div>
            <button
              onClick={handleAddToCart}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-body font-semibold text-[14px] transition-all ${
                added
                  ? "bg-[#16A34A] text-white"
                  : "bg-[#F59E0B] text-[#09090B] hover:bg-[#D97706]"
              }`}
            >
              {added ? <Check size={18} /> : <ShoppingCart size={18} />}
              {added ? "Added!" : "Add to Cart"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
