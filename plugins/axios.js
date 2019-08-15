export default function ({ $axios, app }) {
  $axios.onError((error) => {
    const code = parseInt(error.response && error.response.status)

    if ([401, 403].includes(code)) {
      app.$auth.logout()
    }

    return Promise.reject(error)
  })
}
