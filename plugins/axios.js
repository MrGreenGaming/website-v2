export default function ({ $axios }) {
  // Used for debugging
  // if (process.env.NODE_ENV !== 'development') {
  // }
  $axios.onRequest((config) => {
    // console.log(config)
    // console.log('axios base url: ' + config.baseURL)
    // console.log('Making request to ' + config.url)
  })
}
