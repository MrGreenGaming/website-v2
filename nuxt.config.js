const VuetifyLoaderPlugin = require('vuetify-loader/lib/plugin')

// const pkg = require("./package");
module.exports = {
  serverMiddleware: ['~/api/api.js'],
  router: {
    middleware: 'redirect',
    scrollBehavior: function (to, from, savedPosition) {
      // Scroll to top on every router push
      return { x: 0, y: 0 }
    }
  },
  env: {
    baseUrl: process.env.BASE_URL || 'http://localhost:3000'
  },
  /*
  ** Headers of the page
  */
  head: {
    title: 'Mr. Green Gaming - Online Gaming Community',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content: 'Mr. Green Gaming gaming community'
      }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      {
        rel: 'stylesheet',
        href:
					'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Material+Icons'
      }
    ]
  },
  // Build timeout err fix
  hooks: {
    build: {
      done(builder) {
        if (!builder.nuxt.options.dev) {
          setTimeout(() => process.exit(0), 1000)
        }
      }
    }
  },

  /*
  ** Customize the progress-bar color
  */
  loading: { color: '#fff' },

  /*
  ** Global CSS
  */
  css: ['~/assets/style/app.styl'],

  /*
  ** Plugins to load before mounting the App
  */
  plugins: [
    { src: '@/plugins/axios' },
    { src: '@/plugins/vuetify' },
    { src: '@/plugins/paypal.js', ssr: false },
    { src: '@/plugins/timeago.js', ssr: false }
  ],

  /*
  ** Nuxt.js modules
  */
  modules: [
    // Doc: https://axios.nuxtjs.org/usage
    '@nuxtjs/axios',
    'nuxt-clipboard2',
    '@nuxtjs/auth'
  ],
  /*
  ** Axios module configuration
  */
  axios: {
    // See https://github.com/nuxt-community/axios-module#options
    proxy: true,
    // retry: true
    credentials: true

  },

  /*
  ** Build configuration
  */
  // Auth: https://forums.mrgreengaming.com/api/core/me?access_token= || /api/web/me?access_token=
  auth: {
    plugins: ['@/plugins/auth.js'],
    strategies: {
      forums: {
        _scheme: 'oauth2',
        authorization_endpoint:
					'https://forums.mrgreengaming.com/oauth/authorize/',
        userinfo_endpoint: 'https://mrgreengaming.com/api/web/me',
        scope: ['profile'],
        response_type: 'token',
        token_type: 'Bearer',
        redirect_uri: 'https://mrgreengaming.com/login',
        // redirect_uri: 'http://localhost:3000/callback',
        client_id: 'ec945877107d68a66da01e449cb58534',
        token_key: 'access_token'
      }
    }
  },
  build: {
    transpile: ['vuetify/lib'],
    plugins: [new VuetifyLoaderPlugin()],
    loaders: {
      stylus: {
        import: ['~assets/style/variables.styl']
      }
    },

    /*
    ** You can extend webpack config here
    */
    extend(config, ctx) {
      // Run ESLint on save
      if (ctx.isDev && ctx.isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/
        })
      }
    }
  }
}
