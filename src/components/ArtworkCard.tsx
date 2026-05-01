import { useState } from "react";
import type { Artwork } from "@db/schema";
import { calculatePrice, useCartStore } from "@/store/cart";
import { ShoppingCart, Check, Eye } from "lucide-react";
import ArtworkDialog from "./ArtworkDialog";
import { getArtworkImageFallback } from "@/lib/artwork-images";

interface ArtworkCardProps {
  artwork: Artwork;
  featured?: boolean;
}

export default function ArtworkCard({ artwork, featured = false }: ArtworkCardProps) {
  const [hovered, setHovered] = useState(false);
  const [added, setAdded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const { addItem } = useCartStore();

  const defaultSize = "A4 Print";
  const price = calculatePrice(artwork.basePrice, defaultSize);

  const thumbnailUrl =
    failedImage === artwork.image
      ? getArtworkImageFallback(artwork.image)
      : artwork.image;

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
        className={`group relative bg-[#18181B] rounded-xl border border-[#27272A] overflow-hidden cursor-pointer transition-all duration-500 ${
          hovered ? "border-[#F59E0B]/50 shadow-2xl shadow-[#F59E0B]/5" : ""
        } ${featured ? "col-span-2 row-span-2" : ""} transform-gpu backface-hidden`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setDialogOpen(true)}
      >
        {/* Image Container */}
        <div className={`relative overflow-hidden bg-[#27272A] ${featured ? "h-[400px]" : "h-[280px]"}`}>
          {/* Skeleton/Placeholder */}
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#27272A] to-[#18181B] flex items-center justify-center">
               <div className="w-10 h-10 border-2 border-[#F59E0B]/20 border-t-[#F59E0B] rounded-full animate-spin" />
            </div>
          )}
          
          <img
            key={thumbnailUrl}
            src={thumbnailUrl}
            alt={artwork.title}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setFailedImage(artwork.image);
              setImageLoaded(false);
            }}
            className={`w-full h-full object-cover transition-all duration-700 ${
              imageLoaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-105 blur-lg"
            } group-hover:scale-105`}
          />

          {/* Hover overlay */}
          <div className={`absolute inset-0 bg-[#09090B]/60 backdrop-blur-[2px] flex items-center justify-center gap-3 transition-all duration-300 ${
            hovered ? "opacity-100" : "opacity-0"
          }`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDialogOpen(true);
              }}
              className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-[#F59E0B] hover:text-[#09090B] transition-all transform-gpu hover:scale-110 active:scale-95"
            >
              <Eye size={18} />
            </button>
            <button
              onClick={handleAddToCart}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all transform-gpu hover:scale-110 active:scale-95 ${
                added
                  ? "bg-[#16A34A] text-white"
                  : "bg-white/10 backdrop-blur-md text-white hover:bg-[#F59E0B] hover:text-[#09090B]"
              }`}
            >
              {added ? <Check size={18} /> : <ShoppingCart size={18} />}
            </button>
          </div>

          {/* Collection badge */}
          <div className="absolute top-3 left-3 pointer-events-none">
            <span className="px-2 py-1 bg-[#09090B]/80 backdrop-blur-md text-[10px] font-body font-bold text-white border border-white/10 rounded-md uppercase tracking-[0.1em]">
              {artwork.collection?.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 bg-gradient-to-t from-[#09090B] to-[#18181B]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-body text-[16px] font-bold text-white truncate group-hover:text-[#F59E0B] transition-colors">
                {artwork.title}
              </h3>
              <p className="font-body text-[12px] text-[#A1A1AA] mt-0.5 tracking-wide uppercase font-medium">
                {artwork.category}
              </p>
            </div>
            <div className="text-right">
                <span className="font-mono text-[14px] text-[#F59E0B] font-bold block">
                  Rs. {price.toLocaleString()}
                </span>
            </div>
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
