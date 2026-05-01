import { list } from '@vercel/blob';
import { getDb } from '../api/queries/connection';
import { artworks } from '../db/schema';
import { eq } from 'drizzle-orm';
import "dotenv/config";

async function syncRealBlobs() {
  if (!process.env.DATABASE_URL) {
    console.error("Missing DATABASE_URL");
    return;
  }

  const token = "vercel_blob_rw_UCR5bvEWBOLHssaX_kcYSz9uH9BH4qYFo34qChgBLU4fIh2";
  const { blobs } = await list({ token });
  const db = getDb();

  console.log("Wiping dummy data...");
  await db.delete(artworks);

  const realArtworks = blobs.map(blob => {
    // Clean up filename for title
    let name = decodeURIComponent(blob.pathname).replace(/\.[^/.]+$/, "").replace(/_/g, " ");
    
    // Smart categorization
    let collection: "movie_posters" | "social_awareness" | "digital_illustrations" = "digital_illustrations";
    let category = "Digital Art";

    if (name.toLowerCase().includes("poster") || name.toLowerCase().includes("movie")) {
      collection = "movie_posters";
      category = "Cinema";
    } else if (name.toLowerCase().includes("caste") || name.toLowerCase().includes("rights") || name.toLowerCase().includes("education")) {
      collection = "social_awareness";
      category = "Social Awareness";
    }

    // Specific category mapping
    if (name.match(/Virat|MSD|Kohli|Mandhanna|Kapoor|Downey|Ritika|Samantha|RDJ|Uma Shankar|Nayak/i)) {
      category = "Celebrity Portraits";
    } else if (name.match(/Spiderman|Sanju|Jodi|Bala/i)) {
      category = "Pop Culture";
    } else if (name.match(/Shiva|Radha|Krishna/i)) {
      category = "Spirituality";
    } else if (name.match(/Sun Set|Smoking|Vintage|Project/i)) {
      category = "Artistic";
    }

    return {
      slug: blob.pathname.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      title: name,
      category: category,
      collection: collection,
      description: `Original digital artwork: ${name}. A high-resolution professional digital illustration from the Shiva Vexarts collection.`,
      image: blob.url,
      basePrice: 2000,
      year: new Date(blob.uploadedAt).getFullYear(),
      dimensions: "420 x 594mm",
      format: "Print & Digital",
      featured: blob.size > 5000000 ? 1 : 0,
    };
  });

  for (const artwork of realArtworks) {
    try {
      await db.insert(artworks).values(artwork);
      console.log(`Added real artwork: ${artwork.title}`);
    } catch (e) {
      console.error(`Failed to add ${artwork.title}:`, e);
    }
  }

  console.log(`Successfully synced ${realArtworks.length} real artworks.`);
}

syncRealBlobs().catch(console.error);
