const assetBaseUrl =
  import.meta.env.VITE_PUBLIC_ASSET_BASE_URL || import.meta.env.VITE_BLOB_BASE_URL || "";

export function assetUrl(fileName: string) {
  const normalizedFile = fileName.startsWith("/") ? fileName.slice(1) : fileName;
  return assetBaseUrl
    ? `${assetBaseUrl.replace(/\/$/, "")}/${normalizedFile}`
    : `/${normalizedFile}`;
}
