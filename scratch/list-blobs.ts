import { list } from '@vercel/blob';

async function listAllBlobs() {
  const token = "vercel_blob_rw_UCR5bvEWBOLHssaX_kcYSz9uH9BH4qYFo34qChgBLU4fIh2";
  const { blobs } = await list({ token });
  console.log(JSON.stringify(blobs, null, 2));
}

listAllBlobs().catch(console.error);
