import { useState } from "react";
import { trpc } from "@/providers/trpc";
import ArtworkCard from "@/components/ArtworkCard";
import { Loader2 } from "lucide-react";

const collections = [
  {
    id: "movie_posters",
    label: "COLLECTION 01",
    title: "MOVIE POSTERS",
    description:
      "Official movie posters for Tamil cinema — from gritty crime thrillers to action blockbusters. Each poster is a digital print available in multiple sizes.",
    filters: ["All", "Crime", "Action", "Drama", "Horror"],
  },
  {
    id: "social_awareness",
    label: "COLLECTION 02",
    title: "SOCIAL AWARENESS",
    description:
      "Art with a message — pieces created for Women's Day, education advocacy, anti-war campaigns, and social justice movements.",
    filters: ["All", "Anti-War", "Women's Rights", "Social Justice"],
  },
  {
    id: "digital_illustrations",
    label: "COLLECTION 03",
    title: "DIGITAL ILLUSTRATIONS",
    description:
      "Commemorative illustrations, conceptual art, and digital pieces celebrating science, culture, and iconic personalities.",
    filters: ["All", "Space", "Portrait"],
  },
];

function GalleryChapter({
  collection,
  isLast,
}: {
  collection: (typeof collections)[0];
  isLast: boolean;
}) {
  const [activeFilter, setActiveFilter] = useState("All");
  const { data: artworks, isLoading } = trpc.artwork.list.useQuery({
    collection: collection.id as "movie_posters" | "social_awareness" | "digital_illustrations",
    category: activeFilter === "All" ? undefined : activeFilter,
  });

  return (
    <div className={`${isLast ? "" : "mb-20 md:mb-32"}`}>
      {/* Chapter Header */}
      <div className="mb-10 md:mb-14">
        <span className="font-body text-[12px] sm:text-[14px] font-medium text-[#F59E0B] tracking-[0.2em] uppercase">
          {collection.label}
        </span>
        <h2 className="font-display text-[36px] sm:text-[48px] md:text-[56px] text-white uppercase mt-2 leading-tight">
          {collection.title}
        </h2>
        <p className="font-body text-[15px] sm:text-[16px] text-[#A1A1AA] mt-3 max-w-[640px] leading-relaxed">
          {collection.description}
        </p>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 mt-5">
          {collection.filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full font-body text-[12px] sm:text-[13px] font-medium transition-all ${
                activeFilter === filter
                  ? "bg-[#F59E0B] text-[#09090B]"
                  : "bg-[#27272A] text-[#A1A1AA] hover:bg-[#3f3f46]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Artwork Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="text-[#F59E0B] animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
          {artworks?.map((artwork) => (
            <ArtworkCard key={artwork.id} artwork={artwork} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function GallerySection() {
  return (
    <section id="gallery" className="relative py-20 md:py-32 bg-[#09090B]">
      <div className="container-vex">
        {collections.map((collection, index) => (
          <GalleryChapter
            key={collection.id}
            collection={collection}
            isLast={index === collections.length - 1}
          />
        ))}
      </div>
    </section>
  );
}
