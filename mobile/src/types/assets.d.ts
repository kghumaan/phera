// Metro resolves static image imports to an opaque asset reference.
// Expo's bundled types cover png/jpg but not webp.
declare module '*.webp' {
  const asset: number;
  export default asset;
}

// SVG is in Metro's assetExts (expo-image renders it natively + on web).
declare module '*.svg' {
  const asset: number;
  export default asset;
}
