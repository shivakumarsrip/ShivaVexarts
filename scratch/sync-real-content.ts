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

  console.log("Wiping database for clean categorization...");
  await db.delete(artworks);

  const realArtworks = blobs.map(blob => {
    let name = decodeURIComponent(blob.pathname).replace(/\.[^/.]+$/, "").replace(/_/g, " ");
    const lowerName = name.toLowerCase();
    
    // Default
    let collection: "portraits" | "fan_art" | "posters" | "illustrations" | "devotional" = "illustrations";
    let category = "Illustration";

    // 1. Portraits Collection
    if (lowerName.match(/virat|kohli|msd|dhoni|mandhanna|kapoor|downey|rdj|samantha|ritika|nayak|actor|nani|anirudh|mathew|mythili|uma shankar|amal|avinash/i)) {
      collection = "portraits";
      if (lowerName.match(/virat|kohli|msd|dhoni|mandhanna/i)) category = "Cricketer";
      else if (lowerName.match(/downey|rdj|mathew/i)) category = "Hollywood";
      else if (lowerName.match(/kapoor|bollywood/i)) category = "Bollywood";
      else if (lowerName.match(/anirudh|musician/i)) category = "Musician";
      else category = "Tollywood";
    } 
    // 2. Devotional Collection
    else if (lowerName.match(/shiva|radha|krishna|devotional|god/i)) {
      collection = "devotional";
      category = "Devotional";
    }
    // 3. Fan Art Collection
    else if (lowerName.match(/spiderman|batman|superhero|marvel|dc|ironman|captain america/i)) {
      collection = "fan_art";
      if (lowerName.includes("spiderman") || lowerName.includes("marvel")) category = "Marvel";
      else if (lowerName.includes("batman") || lowerName.includes("dc")) category = "DC Comics";
      else category = "Marvel";
    }
    // 4. Movie Posters Collection
    else if (lowerName.match(/poster|movie|akhanda|sanju|jodi|maharaja|maaveeran|farhana|asvins|balaaaa|vikram/i)) {
      collection = "posters";
      if (lowerName.match(/akhanda|maaveeran|maharaja|vikram|balaaaa/i)) category = "Tollywood";
      else category = "Action";
    }
    // 5. Illustrations Collection
    else {
      collection = "illustrations";
      if (lowerName.match(/sun set|scenery|landscape/i)) category = "Scenery";
      else if (lowerName.match(/smoking|vintage|project/i)) category = "Artistic";
      else category = "Illustration";
    }

    return {
      slug: blob.pathname.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      title: name,
      category: category,
      collection: collection,
      description: `Premium digital artwork: ${name}. A high-resolution professional digital illustration from the Shiva Vexarts collection. Perfect for high-quality prints and digital displays.`,
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
      console.log(`Synced: [${artwork.collection}] [${artwork.category}] ${artwork.title}`);
    } catch (e) {
      console.error(`Failed: ${artwork.title}:`, e);
    }
  }

  console.log(`Successfully categorized and synced ${realArtworks.length} real artworks.`);
}

syncRealBlobs().catch(console.error);
