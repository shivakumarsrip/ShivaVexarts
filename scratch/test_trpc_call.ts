
import superjson from 'superjson';

async function test() {
  const url = 'http://127.0.0.1:3000/api/trpc/artwork.listAll?batch=1&input=%7B%7D';
  console.log("Fetching:", url);
  try {
    const res = await fetch(url);
    const text = await res.text();
    console.log("Response status:", res.status);
    console.log("Response text (first 200 chars):", text.slice(0, 200));
    const data = JSON.parse(text);
    // tRPC response structure for batching is usually an array
    const artworks = data[0]?.result?.data;
    console.log("Artworks count in response:", Array.isArray(artworks) ? artworks.length : "Not an array");
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

test();
