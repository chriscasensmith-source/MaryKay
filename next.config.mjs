/** @type {import('next').NextConfig} */
const nextConfig = {
  // node-cron uses Node built-ins; keep it out of the webpack bundle
  serverExternalPackages: ["node-cron"],
};

export default nextConfig;
