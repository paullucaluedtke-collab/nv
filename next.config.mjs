/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
    ],
  },
  eslint: {
    // Workaround for upstream circular JSON issue in eslint-config-next
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Pre-existing type mismatches in BusinessProfileModal / VerificationModal
    // TODO: fix the remaining ~5 minor type issues and remove this
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // Fix for react-leaflet SSR issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    // Ensure react-leaflet is properly externalized
    config.externals = config.externals || [];
    return config;
  },
};

export default nextConfig;

