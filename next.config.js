/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... any other existing configurations ...

  webpack: (config, { isServer, webpack }) => {
    // Add a rule to ignore the specific problematic HTML file
    // This prevents Webpack from trying to parse it.
    config.module.rules.push({
      test: /\.html$/,
      // Regex to match the specific path causing the issue
      include: /[\\/]node_modules[\\/]@mapbox[\\/]node-pre-gyp[\\/]lib[\\/]util[\\/]nw-pre-gyp[\\/]/,
      loader: 'ignore-loader',
    });

    // Fix for bcrypt issues with Webpack 5, often needed in Next.js
    // This prevents Webpack from trying to bundle Node.js native modules for the client
    if (!isServer) {
      // config.resolve.fallback = {
      //   ...config.resolve.fallback,
      //   fs: false, // bcrypt might try to use fs, ignore it on client
      // };

      // Alternatively, mark bcrypt as external if only used server-side (like in API routes)
      // config.externals.push('bcrypt');
    }


    // Important: return the modified config
    return config;
  },
};

module.exports = nextConfig;
