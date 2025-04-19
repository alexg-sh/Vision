/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... any other existing configurations ...

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  webpack: (config, { isServer, webpack }) => {
    // Add a rule to ignore problematic files in @mapbox/node-pre-gyp
    config.module.rules.push({
      test: /\.html$/,
      include: /[\\/]node_modules[\\/]@mapbox[\\/]node-pre-gyp[\\/]/,
      loader: 'ignore-loader',
    });

    // Mark server-only modules as external for the client bundle
    if (!isServer) {
      config.externals = [
        ...(config.externals || []),
        'bcrypt',
        '@prisma/client',
        '@auth/prisma-adapter',
      ]; 
      // Keep necessary fallbacks for other potential client deps
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false, 
        path: false,
        os: false,
        crypto: false,
        async_hooks: false, // Keep async_hooks fallback just in case
      };
    }

    // Important: return the modified config
    return config;
  },
};

module.exports = nextConfig;
