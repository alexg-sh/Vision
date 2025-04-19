import MiniCssExtractPlugin from 'mini-css-extract-plugin';

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
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
  webpack: (config, { isServer }) => {
    // Add the MiniCssExtractPlugin to the client-side webpack config
    if (!isServer) {
      config.plugins.push(new MiniCssExtractPlugin({
        filename: 'static/css/[contenthash].css',
        chunkFilename: 'static/css/[contenthash].css',
      }));

      // Mark server-only modules as external for the client bundle
      config.externals = [
        ...(config.externals || []),
        'bcrypt',
        '@prisma/client',
        '@auth/prisma-adapter',
      ];

      // Update fallbacks - remove those specific to bcrypt/node-pre-gyp
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false, // Keep fs: false as other client deps might need it
        path: false,
        os: false,
        crypto: false,
        async_hooks: false, // Add fallback for async_hooks
      };
    }

    // Add a rule to ignore problematic files in @mapbox/node-pre-gyp
    config.module.rules.push({
      test: /\.html$/,
      include: /[\\/]node_modules[\\/]@mapbox[\\/]node-pre-gyp[\\/]/,
      loader: 'ignore-loader',
    });

    return config;
  },
};

export default nextConfig;
