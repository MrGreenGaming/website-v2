module.exports = {
  apps: [
    {
      name: 'mrgreengamingwebsite',
      script: './server/index.js',
      env: {
        HOST: '5.2.65.4',
        PORT: 9200,
        NODE_ENV: 'production',
        BASE_URL: 'https://mrgreengaming.com',
        API_URL: 'https://mrgreengaming.com'
      },
	  node_args: '--max_old_space_size=8192'
    }
  ]
}
