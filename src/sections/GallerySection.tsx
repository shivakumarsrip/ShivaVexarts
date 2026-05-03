import { useState, useMemo } from "react";
import { trpc } from "@/providers/trpc";
import ArtworkCard from "@/components/ArtworkCard";
import { Loader2 } from "lucide-react";
import type { Artwork } from "@db/schema";

// Registry for professional descriptions of known collections
const collectionMetadata: Record<string, { title: string; description: string }> = {
  portraits: {
    title: "CELEBRITY PORTRAITS",
    description: "Precision vector portraits of iconic figures from cinema, sports, and music. Every detail is meticulously crafted to capture the essence of the legend.",
  },
  fan_art: {
    title: "SUPERHEROES & FAN ART",
    description: "A tribute to the characters we love. From the gritty streets of Gotham to the vibrant Marvel universe, explore our unique take on legendary heroes.",
  },
  movie_posters: {
    title: "MOVIE POSTERS",
    description: "Cinematic posters that tell a story. High-impact designs inspired by the biggest blockbusters, perfect for any movie lover's collection.",
  },
  digital_illustrations: {
    title: "CONCEPTUAL ILLUSTRATIONS",
    description: "Original conceptual pieces and digital illustrations exploring themes of scenery, emotion, and surrealism.",
  },
  devotional: {
    title: "DEVOTIONAL ART",
    description: "Divine and spiritual digital paintings that bring peace and energy to your space. A modern approach to traditional deities.",
  },
  "Client Works": {
    title: "CLIENT COMMISSIONS",
    description: "Custom artworks and professional projects created for clients across various industries.",
  },
};

interface DynamicCollection {
  id: string;
  label: string;
  title: string;
  description: string;
  filters: string[];
}

function GalleryChapter({
  collection,
  isLast,
}: {
  collection: DynamicCollection;
  isLast: boolean;
}) {
  const [activeFilter, setActiveFilter] = useState("All");
  const { data: artworks, isLoading } = trpc.artwork.list.useQuery({
    collection: collection.id,
    category: activeFilter === "All" ? undefined : activeFilter,
  }, {
    staleTime: 5 * 60 * 1000,
  });

  const hasArtworks = (artworks && artworks.length > 0);

  if (!isLoading && !hasArtworks) {
    return null;
  }

  return (
    <div 
      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px' }}
      className={`${isLast ? "" : "mb-24 md:mb-36"} animate-in fade-in slide-in-from-bottom-6 duration-1000 ease-out`}
    >
      <div className="mb-12 md:mb-16">
        <span className="font-body text-[12px] sm:text-[14px] font-bold text-[#F59E0B] tracking-[0.25em] uppercase">
          {collection.label}
        </span>
        <h2 className="font-display text-[42px] sm:text-[56px] md:text-[64px] text-white uppercase mt-3 leading-[0.9]">
          {collection.title}
        </h2>
        <p className="font-body text-[15px] sm:text-[16px] text-[#A1A1AA] mt-5 max-w-[640px] leading-relaxed opacity-80">
          {collection.description}
        </p>

        <div className="flex flex-wrap gap-2.5 mt-8">
          {collection.filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-5 py-2 rounded-full font-body text-[11px] sm:text-[12px] font-bold uppercase tracking-wider transition-all duration-300 ${
                activeFilter === filter
                  ? "bg-[#F59E0B] text-[#09090B] shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                  : "bg-[#18181B] text-[#71717A] border border-[#27272A] hover:border-[#3f3f46] hover:text-white"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="text-[#F59E0B] animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {artworks?.map((artwork: Artwork) => (
            <ArtworkCard key={artwork.id} artwork={artwork} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function GallerySection() {
  const { data: allArtworks, isLoading } = trpc.artwork.listAll.useQuery();

  const dynamicCollections = useMemo(() => {
    if (!allArtworks) return [];

    // Group artworks by collection
    const groups: Record<string, Artwork[]> = {};
    allArtworks.forEach((art: Artwork) => {
      if (!groups[art.collection]) groups[art.collection] = [];
      groups[art.collection].push(art);
    });

    // Transform into DynamicCollection format
    return Object.entries(groups).map(([colId, arts], index) => {
      const meta = collectionMetadata[colId];
      const uniqueFilters = ["All", ...new Set(arts.map(a => a.category))].sort();

      return {
        id: colId,
        label: `COLLECTION ${String(index + 1).padStart(2, '0')}`,
        title: meta?.title || colId.replace(/_/g, " ").toUpperCase(),
        description: meta?.description || `Explore our unique collection of ${colId.replace(/_/g, " ")} digital art.`,
        filters: uniqueFilters
      };
    });
  }, [allArtworks]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <Loader2 size={48} className="text-[#F59E0B] animate-spin" />
      </div>
    );
  }

  return (
    <section id="gallery" className="relative py-24 md:py-40 bg-[#09090B]">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#F59E0B]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#F59E0B]/3 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="container-vex relative z-10">
        {dynamicCollections.map((collection, index) => (
          <GalleryChapter
            key={collection.id}
            collection={collection}
            isLast={index === dynamicCollections.length - 1}
          />
        ))}
      </div>
    </section>
  );
}
