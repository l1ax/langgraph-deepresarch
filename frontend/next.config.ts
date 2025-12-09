import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 禁用 React Strict Mode 以避免双渲染等开发期行为
  reactStrictMode: false,
};

export default nextConfig;
