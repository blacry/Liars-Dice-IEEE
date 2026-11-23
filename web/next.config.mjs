const nextConfig = {
  devIndicators: false,
  outputFileTracingIncludes: {
    '/api/*': ['./runtime/**/*'],
  },
};

export default nextConfig;
