module.exports = {
  apps: [
    {
      name: 'mrgreengamingwebsite',
      script: './server/index.js',
      env: {
        HOST: '0.0.0.0',
        PORT: 80,
        NODE_ENV: 'production',
        BASE_URL: 'https://example.com',
        API_URL: 'https://example.com'
      },
	  node_args: '--max_old_space_size=8192'
    }
  ]
}
