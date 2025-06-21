/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
      },
    ],
  },

  // From next.config.js
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://warpcast.com",
          },
        ],
      },
    ];
  },

  // From original .mjs and for re2.node fix
  webpack: (config, { isServer }) => {
    // Keep existing externals for WalletConnect
    config.externals.push("pino-pretty", "lokijs", "encoding");

    // Add rule for .node files
    config.module.rules.push({
      test: /\.node$/,
      use: 'raw-loader',
    });

    // Specifically handle 're2' by not bundling it on the client
    if (!isServer) {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            're2': false,
        };
    }

    return config;
  },
};

export default nextConfig;
