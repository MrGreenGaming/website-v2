<template>
  <div class="py-4" style="min-height:800px;">
    <h1 class="mb-3">
      MTA Player Stats
    </h1>

    <v-card class="mb-3">
      <v-toolbar flat color="primary" dark dense class="slim-toolbar-padding">
        <v-icon>poll</v-icon>
        <v-toolbar-title class="subheading ml-2">
          Player Statistics
        </v-toolbar-title>
      </v-toolbar>

      <v-container column fluid>
        <v-divider class="mb-3" />
        <v-flex>
          <v-layout row wrap>
            <no-ssr>
              <v-autocomplete
                v-model="selectedMember"
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
                    @input="selectedMember = false"
                  >
                    <v-avatar v-if="$vuetify.breakpoint.smAndUp">
                      <img :src="data.item.photoUrl">
                    </v-avatar>
                    <span style="max-width:80%; overflow:hidden;" class="title" v-html="data.item.formattedName" /> <span class="ml-2 caption">#{{ data.item.id }}</span>
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
            </no-ssr>
            <v-flex v-if="$auth.$state.loggedIn && $auth.$state.user.id" sm12 md2 align-center justify-center>
              <v-btn
                class="mr-0 my-0"
                :class="{'ml-0':$vuetify.breakpoint.smAndDown}"
                style="height:56px;"
                dark
                color="primary"
                @click="goToMyStats()"
              >
                Show My Stats
              </v-btn>
            </v-flex>
          </v-layout>
          <nuxt-child :selectedmemberprop="selectedMember" />
        </v-flex>
      </v-container>
    </v-card>
  </div>
</template>

<script>
import _ from 'lodash'
export default {
  head() {
    return {
      title: 'Stats - Mr. Green Gaming'
    }
  },
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
  created() {
    // Fetch user when page (re)loads
    const theID = parseInt(this.$route.params.player)
    if (theID) {
      this.setMemberInfo(theID)
    }
    // if (this.$route.params.userID) {
    // 	const object = this.searchIdObject(this.$route.params.userID);
    // 	if (object) {
    // 		this.model = object;
    // 		this.topsShareURL = window.location.href;
    // 	}
    // }
  },
  methods: {
    goToMyStats() {
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
      // console.log(this.players);
      // console.log(memberIds);
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
      this.$router.push({ path: '/mta/stats/' + val + '/' })
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
	padding-bottom: 10px;
	padding-top: 10px;
}
</style>
