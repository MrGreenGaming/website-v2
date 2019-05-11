<template>
  <div>
    <v-flex>
      <v-autocomplete
        v-model="selectedMap"
        style="overflow-x:hidden; max-width:100%;"
        return-object
        :items="maps"
        prepend-inner-icon="account_box"
        box
        persistent-hint
        label="Search Map"
        hint="Search for a map above"
        item-text="resname"
        item-value="resname"

        :search-input.sync="searchInput"
      >
        <template
          slot="selection"
          slot-scope="data"
        >
          <v-chip
            :selected="data.selected"
            outline
            label
            color="primary"
            style="max-width:100%; text-overflow: ellipsis;"
            class="customSelectionChips"
            close
            @input="selectedMap = false"
          >
            <span :class="$vuetify.breakpoint.xs ? 'body-1' : 'title'"> {{ data.item.mapname }}</span> <span class="ml-2 caption hide hidden-sm-and-down">({{ getFullRaceModeName(data.item.racemode) }}) - #{{ data.item.mapId }}</span>
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
            <v-list-tile-content>
              <v-list-tile-title> {{ data.item.mapname }} </v-list-tile-title>
              <v-list-tile-sub-title>{{ data.item.resname }} - {{ getFullRaceModeName(data.item.racemode) }} </v-list-tile-sub-title>
            </v-list-tile-content>
          </template>
        </template>
      </v-autocomplete>
    </v-flex>

    <nuxt-child :selectedmapprop="selectedMap" />
  </div>
</template>

<script>
export default {
  data() {
    return {
      searchInput: null,
      selectedMap: null,
      shareLinkDialog: false,
      shareURL: false,
      copiedURLNotification: false,
      fullRaceModeNames: {
        nts: 'Never The Same',
        dd: 'Destruction Derby',
        race: 'Race',
        dl: 'DeadLine',
        rtf: 'Reach The Flag',
        ctf: 'Capture The Flag',
        sh: 'Shooter'
      },
      maps: []
    }
  },
  watch: {
    selectedMap: function (val) {
      if (val.resname) {
        this.changeRoute(val.resname)
        this.shareURL = window.location.href
      } else {
        this.changeRoute()
        this.shareURL = window.location.href
      }
    },
    $route(to, from) {}
  },
  async asyncData({ $axios }) {
    // return (
    //   $axios
    //     .$get('/api/web/mtamaps')
    //     .then((res) => {
    //       const mapList = res
    //       // Set mapname as resname where mapname is null
    //       for (const map of mapList) {
    //         if (!map.mapname) {
    //           map.mapname = map.resname
    //         }
    //       }

    //       return { maps: mapList }
    //     })
    //     .catch((err) => {
    //       console.error(err)
    //     })
    // )
    let theData
    try {
      theData = await $axios.$get('/api/web/mtamaps')
    } catch (e) {
      console.log('mtamaps asyncData Error:', e.config.url, e.response.status)
      return { maps: [] }
    }
    for (const map of theData) {
      if (!map.mapname) {
        map.mapname = map.resname
      }
    }
    return { maps: theData }
  },

  created() {
    this.getMapFromUrl()
  },

  methods: {
    async getMaps() {
      await this.$axios.$get('/api/web/mtamaps').then((res) => {
        this.maps = res
      }).catch((e) => {
        console.error('Failed fetching maps:', e)
      })
      return true
    },
    async getMapFromUrl() {
      if (this.maps === []) {
        // Async didnt work, just fetch it here
        await this.getMaps()
      }
      if (this.$route.params.map) {
        const object = this.searchIdObject(this.$route.params.map)
        if (object) {
          this.selectedMap = object
        }
      }
    },
    getFullRaceModeName: function (raceMode) {
      return this.fullRaceModeNames[raceMode] || raceMode
    },
    changeRoute(val) {
      if (val) {
        this.$router.push({ path: '/mta/toptimes/map/' + val + '/' })
      } else {
        this.$router.push({ path: '/mta/toptimes/map/' })
      }
    },
    searchIdObject(name) {
      let returnObject = false
      for (let i = 0; i < this.maps.length; i++) {
        if (this.maps[i].resname === name) {
          returnObject = this.maps[i]
          break
        }
      }
      return returnObject
    },
    copyShareURLToClipboard() {
      const el = document.createElement('textarea') // Create a <textarea> element
      el.value = this.shareURL // Set its value to the string that you want copied
      el.setAttribute('readonly', '') // Make it readonly to be tamper-proof
      el.style.position = 'absolute'
      el.style.left = '-9999px' // Move outside the screen to make it invisible
      document.body.appendChild(el) // Append the <textarea> element to the HTML document
      const selected =
				document.getSelection().rangeCount > 0 // Check if there is any content selected previously
				  ? document.getSelection().getRangeAt(0) // Store selection if found
				  : false // Mark as false to know no selection existed before
      el.select() // Select the <textarea> content
      const copied = document.execCommand('copy') // Copy - only works as a result of a user action (e.g. click events)
      if (copied) {
        this.copiedURLNotification = true
        const self = this
        setTimeout(function () {
          self.copiedURLNotification = false
        }, 2000)
      }
      document.body.removeChild(el) // Remove the <textarea> element
      if (selected) {
        // If a selection existed before copying
        document.getSelection().removeAllRanges() // Unselect everything on the HTML document
        document.getSelection().addRange(selected) // Restore the original selection
      }
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
