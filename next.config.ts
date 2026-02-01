import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable cacheComponents - incompatible with route segment configs like dynamic, revalidate
  // cacheComponents: true,
};

export default nextConfig;
