<template>
  <div>
    <v-layout row wrap>
      <v-flex>
        <v-autocomplete
          v-model="selectedMember"
          style="overflow-x:hidden; max-width:100%;"
          return-object
          :items="players"
          prepend-inner-icon="account_box"
          box
          persistent-hint
          :loading="isLoading"
          label="Search Player"
          hint="Search for a player above, names go by forum names."
          item-text="name"
          item-value="id"
          :search-input.sync="searchInput"
        >
          <template
            slot="selection"
            slot-scope="data"
          >
            <v-chip
              :selected="data.selected"
              outline
              color="primary"
              class="chip--select"
              close
              style="max-width:100%;"
              @input="selectedMember = false"
            >
              <v-avatar>
                <img :src="data.item.photoUrl">
              </v-avatar>
              <span style="max-width:80%; overflow:hidden;" :class="$vuetify.breakpoint.xs ? 'body-1' : 'title'" v-html="data.item.formattedName" /> <span v-if="$vuetify.breakpoint.smAndUp" class="ml-2 caption">#{{ data.item.id }}</span>
            </v-chip>
          </template>
          <template
            slot="item"
            slot-scope="data"
          >
            <template v-if="typeof data.item !== 'object'">
              <v-list-tile-content v-text="data.item" />
            </template>
            <template v-else>
              <v-list-tile-avatar>
                <img :src="data.item.photoUrl" @error="setDefaultAvatar">
              </v-list-tile-avatar>
              <v-list-tile-content>
                <v-list-tile-title v-html="data.item.formattedName" />
                <v-list-tile-sub-title v-html="data.item.group" />
              </v-list-tile-content>
            </template>
          </template>
        </v-autocomplete>
      </v-flex>
      <v-flex
        v-if="$auth.$state.loggedIn && $auth.$state.user.id"
        xs12
        sm12
        md2
        align-center
        justify-center
      >
        <v-btn
          class="mr-0 my-0"
          :class="{'ml-0':$vuetify.breakpoint.smAndDown}"
          style="height:56px;"
          dark
          color="primary"
          @click="goToMyTops()"
        >
          Show My Tops
        </v-btn>
      </v-flex>
    </v-layout>
    <div>
      <nuxt-child :selectedmemberprop="selectedMember" />
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
export default {
  data() {
    return {
      isLoading: false,
      searchInput: '',
      selectedMember: false,
      shareLinkDialog: false,
      topsShareURL: false,
      copiedURLNotification: false,
      players: [
        // { name: "KaliBwoy", id: 10 },
        // { name: "Cena", id: 11 },
        // { name: "Stig", id: 12 },
        // { name: "Moshpit", id: 13 },
        // { name: "Jack123", id: 14 },
        // { name: "Mihoje", id: 15 },
        // { name: "Anthony-Vz", id: 16 },
        // { name: "Dubby", id: 17 },
        // { name: "Abrahax", id: 18 }
      ]
    }
  },
  watch: {
    searchInput(val) {
      this.searchMembers(this.searchInput)
    },
    selectedMember: function (val) {
      // console.log("------------------SELECTED------------------");
      // console.log(val);
      // console.log("--------------------------------------------");
      if (val && val.id) {
        this.changeRoute(val.id)
        // this.$route.fullPath = val.id;
        this.topsShareURL = window.location.href
      }
    },
    $route(to, from) {}
  },
  // asyncData({ $axios, params }) {
  //   // Local/live change
  //   const theID = parseInt(params.player)
  //   if (theID) {
  //     return $axios
  //       .$get('/api/web/forummember?forumId=' + theID)
  //       .then((res) => {
  //         return { selectedMember: res }
  //       })
  //       .catch((res) => {
  //         return { selectedMember: [] }
  //       })
  //   }
  // },
  created() {

  },
  mounted() {
    // Fetch user when page (re)loads
    const theID = parseInt(this.$route.params.player)
    if (theID) {
      this.setMemberInfo(theID)
    }
  },
  methods: {
    goToMyTops() {
      const theUser = this.$auth.$state.user
      if (!theUser) return
      this.selectedMember = theUser
    },
    async setMemberInfo(id) {
      // Search for members
      this.isLoading = true
      let res
      try {
        res = await this.$axios.$get('/api/web/forummember?forumId=' + id)
      } catch (err) {
        this.isLoading = false
        return
      }

      if (res) {
        console.log(res)
        this.selectedMember = res
      }
      this.isLoading = false
    },
    setDefaultAvatar(event) {
      event.target.src = require('@/assets/images/logos/mrgreen-logo.png')
    },

    pushToSearchResults(data, playersArray) {
      // const theData = data;
      // const memberIds = [];

      for (const value of data) {
        const theID = value.id
        let pushToArray = true
        for (const tar of playersArray) {
          if (theID === tar.id) {
            pushToArray = false
          }
        }
        if (pushToArray === true) {
          this.players.push(value)
        }
      }
    },
    searchMembers: _.debounce(function (value) {
      if (!value) return
      this.isLoading = true

      // Search for members
      return this.$axios
        .$get('/api/web/searchmembers?name=' + value)
        .then((res) => {
          if (value && value.length > 0) {
            this.pushToSearchResults(res, this.players)
          }
        })
        .finally(() => (this.isLoading = false))
    }, 500),
    changeRoute(val) {
      this.$router.push({ path: '/mta/toptimes/player/' + val + '/' })
    },
    searchIdObject(forumID) {
      let returnObject = false
      for (let i = 0; i < this.players.length; i++) {
        if (this.players[i].id === forumID) {
          returnObject = this.players[i]
          break
        }
      }
      return returnObject
    }
  }
}
</script>

<style scoped>
>>> .v-chip__content {
	white-space: normal !important;
	text-overflow: ellipsis;
	overflow: hidden;
	height: auto !important;
}
>>> .v-chip.v-chip.v-chip--outline {
	height: auto !important;
	/* padding-bottom: 10px; */
	/* padding-top: 10px; */
}
</style>
