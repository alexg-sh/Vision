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
  },
  webpack: (config, { isServer }) => {
    // Add the MiniCssExtractPlugin to the client-side webpack config
    if (!isServer) {
      config.plugins.push(new MiniCssExtractPlugin({
        filename: 'static/css/[contenthash].css',
        chunkFilename: 'static/css/[contenthash].css',
      }));
    }

    return config;
  },
};

export default nextConfig;
