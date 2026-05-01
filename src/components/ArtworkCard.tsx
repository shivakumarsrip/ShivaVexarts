import { useState } from "react";
import type { Artwork } from "@db/schema";
import { calculatePrice, useCartStore } from "@/store/cart";
import { ShoppingCart, Check, Eye } from "lucide-react";
import ArtworkDialog from "./ArtworkDialog";

interface ArtworkCardProps {
  artwork: Artwork;
  featured?: boolean;
}

export default function ArtworkCard({ artwork, featured = false }: ArtworkCardProps) {
  const [hovered, setHovered] = useState(false);
  const [added, setAdded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { addItem } = useCartStore();

  const defaultSize = "A4 Print";
  const price = calculatePrice(artwork.basePrice, defaultSize);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      artworkId: artwork.id,
      title: artwork.title,
      image: artwork.image,
      size: defaultSize,
      price: price,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <>
      <div
        className={`group relative bg-[#18181B] rounded-xl border border-[#27272A] overflow-hidden cursor-pointer transition-all duration-300 ${
          hovered ? "border-[#F59E0B]/50" : ""
        } ${featured ? "col-span-2 row-span-2" : ""}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setDialogOpen(true)}
      >
        {/* Image */}
        <div className={`relative overflow-hidden ${featured ? "h-[400px]" : "h-[280px]"}`}>
          <img
            src={artwork.image}
            alt={artwork.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Hover overlay */}
          <div className={`absolute inset-0 bg-[#09090B]/60 flex items-center justify-center gap-3 transition-opacity duration-300 ${
            hovered ? "opacity-100" : "opacity-0"
          }`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDialogOpen(true);
              }}
              className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-[#F59E0B] hover:text-[#09090B] transition-all"
            >
              <Eye size={18} />
            </button>
            <button
              onClick={handleAddToCart}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                added
                  ? "bg-[#16A34A] text-white"
                  : "bg-white/10 backdrop-blur-sm text-white hover:bg-[#F59E0B] hover:text-[#09090B]"
              }`}
            >
              {added ? <Check size={18} /> : <ShoppingCart size={18} />}
            </button>
          </div>
          {/* Collection badge */}
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 bg-[#09090B]/70 backdrop-blur-sm text-[11px] font-body font-medium text-[#A1A1AA] rounded-md uppercase tracking-wider">
              {artwork.collection?.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-body text-[16px] font-bold text-white truncate group-hover:text-[#F59E0B] transition-colors">
                {artwork.title}
              </h3>
              <p className="font-body text-[13px] text-[#A1A1AA] mt-0.5">{artwork.category}</p>
            </div>
            <span className="font-mono text-[16px] text-[#F59E0B] whitespace-nowrap">
              Rs. {price.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <ArtworkDialog
        artwork={artwork}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}
