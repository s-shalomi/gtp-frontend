module.exports = {
    async redirects() {
      return [
        {
          source: '/login',
          destination: '/auth/login',
          permanent: true, 
        },
        {
            source: '/signup',
            destination: '/auth/signup',
            permanent: true, 
          },
      ]
    },
    reactStrictMode: false, 
}