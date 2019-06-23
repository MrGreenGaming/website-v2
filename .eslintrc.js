module.exports = {
  root: true,
  env: {
    browser: true,
    node: true
  },
  parserOptions: {
    parser: 'babel-eslint'
  },
  extends: [
    '@nuxtjs',
    // 'plugin:prettier/recommended'
  ],
  plugins: [
    'prettier'
  ],
  // add your custom rules here
  rules: {
    "vue/valid-v-on": "off",
    "no-console": 0,
    "no-tabs": 0,
    "no-mixed-spaces-and-tabs": 0
  },
  globals: {
    "axios": true,
    "Config": true,
    "db": true,
    "mtaServersDb": true,
    "forumsDb": true,
    "ApiApps": true,
    "forumMemberCache": true,
    "Users": true,
    "Utils": true
  }
}
