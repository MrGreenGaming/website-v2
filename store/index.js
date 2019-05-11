import Vuex from 'vuex'

const createStore = () => {
  return new Vuex.Store({
    state: () => ({}),
    actions: {},
    mutations: {},
    getters: {
      isAdmin(state) {
        if (
          !state.auth.loggedIn ||
            !state.auth.user ||
            !state.auth.user.primaryGroup ||
            !state.auth.user.primaryGroup.name
        ) {
          return false
        }
        const allowedGroups = ['Managers', 'TopCrew']
        return allowedGroups.includes(state.auth.user.primaryGroup.name)
      },
      isAuthenticated(state) {
        return state.auth.loggedIn
      },

      loggedInUser(state) {
        if (!state.auth.loggedIn) return false
        return state.auth.user
      }
    }
  })
}

export default createStore
