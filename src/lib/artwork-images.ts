const localArtworkImages: Record<string, string> = {
  "artwork-asvins.jpg": "/artwork-asvins.jpg",
  "artwork-bhavatharini.jpg": "/artwork-bhavatharini.jpg",
  "artwork-black.jpg": "/artwork-black.jpg",
  "artwork-bottle-radha.jpg": "/artwork-bottle-radha.jpg",
  "artwork-caste.jpg": "/artwork-caste.jpg",
  "artwork-chandrayaan.jpg": "/artwork-chandrayaan.jpg",
  "artwork-education.jpg": "/artwork-education.jpg",
  "artwork-farhana.jpg": "/artwork-farhana.jpg",
  "artwork-maaveeran.jpg": "/artwork-maaveeran.jpg",
  "artwork-maharaja.jpg": "/artwork-maharaja.jpg",
  "artwork-rainbow.jpg": "/artwork-rainbow.jpg",
  "artwork-stop-war.jpg": "/artwork-stop-war.jpg",
  "artwork-womens-day.jpg": "/artwork-womens-day.jpg",
};

export function getArtworkImageFallback(imageUrl?: string | null): string {
  if (!imageUrl) return "/hero-portrait.jpg";

  const fileName = imageUrl.split("?")[0]?.split("/").pop();
  if (!fileName) return "/hero-portrait.jpg";

  return localArtworkImages[fileName] ?? "/hero-portrait.jpg";
}
