import { getDb } from "../api/queries/connection";
import { artworks } from "./schema";

const BLOB_BASE_URL = "https://ucr5bvewbolhssax.public.blob.vercel-storage.com";

async function seed() {
  const db = getDb();

  const existing = await db.select().from(artworks);
  if (existing.length > 0) {
    console.log("Artworks already seeded. Updating categories...");
    // If you want to force re-seed, you can delete existing first.
    // For now, let's just make sure the seed data is up to date in the file.
  }

  const artworkData = [
    {
      slug: "maharaja",
      title: "Maharaja",
      category: "Drama",
      collection: "movie_posters" as const,
      description: "Official movie poster for the Tamil crime thriller 'Maharaja'. Gritty textured portrait with blood splatters and dark sepia tones, capturing the intensity of the narrative.",
      image: `${BLOB_BASE_URL}/artwork-maharaja.jpg`,
      basePrice: 2500,
      year: 2024,
      dimensions: "420 x 594mm",
      format: "Print & Digital",
      featured: 1,
    },
    {
      slug: "maaveeran",
      title: "Maaveeran",
      category: "Action",
      collection: "movie_posters" as const,
      description: "Action movie poster featuring a superhero silhouette with comic book collage elements. Fiery orange and red sky with bold golden 3D typography.",
      image: `${BLOB_BASE_URL}/artwork-maaveeran.jpg`,
      basePrice: 2500,
      year: 2024,
      dimensions: "420 x 594mm",
      format: "Print & Digital",
      featured: 0,
    },
    {
      slug: "black",
      title: "BLACK",
      category: "Action",
      collection: "movie_posters" as const,
      description: "Minimalist movie title card with glitch distortion and grain texture. Data corruption aesthetic on pure black background.",
      image: `${BLOB_BASE_URL}/artwork-black.jpg`,
      basePrice: 1800,
      year: 2024,
      dimensions: "420 x 594mm",
      format: "Print & Digital",
      featured: 0,
    },
    {
      slug: "bottle-radha",
      title: "Bottle Radha",
      category: "Cultural",
      collection: "digital_illustrations" as const,
      description: "Indie movie poster with warm earthy tones and South Indian rural aesthetic. Hand-drawn style title with artistic emotional mood.",
      image: `${BLOB_BASE_URL}/artwork-bottle-radha.jpg`,
      basePrice: 2200,
      year: 2024,
      dimensions: "420 x 594mm",
      format: "Print & Digital",
      featured: 0,
    },
    {
      slug: "mark-antony",
      title: "Mark Antony",
      category: "Action",
      collection: "movie_posters" as const,
      description: "Action blockbuster poster with dynamic composition, explosive energy, and bold cinematic typography.",
      image: `${BLOB_BASE_URL}/artwork-maaveeran.jpg`,
      basePrice: 2500,
      year: 2023,
      dimensions: "420 x 594mm",
      format: "Print & Digital",
      featured: 0,
    },
    {
      slug: "farhana",
      title: "Farhana",
      category: "Drama",
      collection: "movie_posters" as const,
      description: "Intimate character drama poster with emotional close-up portrait, soft warm lighting, and elegant serif typography.",
      image: `${BLOB_BASE_URL}/artwork-farhana.jpg`,
      basePrice: 2200,
      year: 2023,
      dimensions: "420 x 594mm",
      format: "Print & Digital",
      featured: 0,
    },
    {
      slug: "asvins",
      title: "ASVINS",
      category: "Horror",
      collection: "movie_posters" as const,
      description: "Horror movie teaser poster with dark silhouette against a blood-red moon. Gothic architecture and flying crows create a terrifying atmosphere.",
      image: `${BLOB_BASE_URL}/artwork-asvins.jpg`,
      basePrice: 2000,
      year: 2023,
      dimensions: "420 x 594mm",
      format: "Print & Digital",
      featured: 0,
    },
    {
      slug: "rainbow",
      title: "Rainbow",
      category: "LGBTQ+",
      collection: "social_awareness" as const,
      description: "Feel-good drama poster with vibrant rainbow over rural Tamil Nadu landscape. Golden hour lighting and uplifting composition.",
      image: `${BLOB_BASE_URL}/artwork-rainbow.jpg`,
      basePrice: 1800,
      year: 2023,
      dimensions: "420 x 594mm",
      format: "Print & Digital",
      featured: 0,
    },
    {
      slug: "stop-the-war",
      title: "Stop The War",
      category: "Peace",
      collection: "social_awareness" as const,
      description: "Powerful anti-war poster with bold typography, falling missile imagery, and blood splatter effects. A call for peace and humanity.",
      image: `${BLOB_BASE_URL}/artwork-stop-war.jpg`,
      basePrice: 1500,
      year: 2023,
      dimensions: "297 x 420mm",
      format: "Print & Digital",
      featured: 1,
    },
    {
      slug: "womens-day",
      title: "Women's Day",
      category: "Women",
      collection: "social_awareness" as const,
      description: "Women's empowerment poster featuring a silhouette with multiple arms holding symbols of strength, wisdom, justice, and voice.",
      image: `${BLOB_BASE_URL}/artwork-womens-day.jpg`,
      basePrice: 1500,
      year: 2024,
      dimensions: "297 x 420mm",
      format: "Print & Digital",
      featured: 0,
    },
    {
      slug: "education",
      title: "Education",
      category: "Rights",
      collection: "social_awareness" as const,
      description: "Education advocacy poster showing a child reading a glowing book. Magical atmosphere with floating letters and symbols.",
      image: `${BLOB_BASE_URL}/artwork-education.jpg`,
      basePrice: 1200,
      year: 2024,
      dimensions: "297 x 420mm",
      format: "Print & Digital",
      featured: 0,
    },
    {
      slug: "caste-discrimination",
      title: "Caste Discrimination",
      category: "Equality",
      collection: "social_awareness" as const,
      description: "Social justice poster about ending caste discrimination. Powerful imagery of hands breaking chains with dramatic spotlight.",
      image: `${BLOB_BASE_URL}/artwork-caste.jpg`,
      basePrice: 1500,
      year: 2023,
      dimensions: "297 x 420mm",
      format: "Print & Digital",
      featured: 0,
    },
    {
      slug: "chandrayaan-3",
      title: "Chandrayaan-3",
      category: "Science",
      collection: "social_awareness" as const,
      description: "Commemorative poster celebrating India's Chandrayaan-3 moon landing. Indian flag on the lunar surface with Earth in the background.",
      image: `${BLOB_BASE_URL}/artwork-chandrayaan.jpg`,
      basePrice: 2000,
      year: 2023,
      dimensions: "420 x 594mm",
      format: "Print & Digital",
      featured: 1,
    },
    {
      slug: "bhavatharini",
      title: "Bhavatharini",
      category: "Portrait",
      collection: "digital_illustrations" as const,
      description: "Tribute portrait illustration of a legendary female singer. Stylized digital painting with warm amber tones and floating musical notes.",
      image: `${BLOB_BASE_URL}/artwork-bhavatharini.jpg`,
      basePrice: 1800,
      year: 2024,
      dimensions: "420 x 594mm",
      format: "Print & Digital",
      featured: 0,
    },
  ];

  if (existing.length === 0) {
    for (const artwork of artworkData) {
        await db.insert(artworks).values(artwork);
    }
    console.log(`Seeded ${artworkData.length} artworks.`);
  } else {
    // Optionally update existing records to match the new categorization
    for (const artwork of artworkData) {
        await db.update(artworks)
            .set({ 
                category: artwork.category, 
                collection: artwork.collection,
                image: artwork.image 
            })
            .where(eq(artworks.slug, artwork.slug));
    }
    console.log("Updated existing artwork categories.");
  }
}

seed().catch(console.error);
