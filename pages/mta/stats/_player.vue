<template>
  <v-layout column>
    <v-divider />
    <v-layout class="mt-3">
      <v-flex>
        <v-layout v-if="selectedmemberprop && selectedmemberprop.id" row align-center wrap>
          <span class="headline">{{ selectedmemberprop.name }}'s MTA Stats</span>
          <v-dialog
            v-model="shareLinkDialog"
            width="500"
          >
            <v-btn slot="activator" icon small @click="setShareURL()">
              <v-icon size="20">
                share
              </v-icon>
            </v-btn>

            <v-card>
              <v-card-title
                class="title primary white--text py-3"
                primary-title
              >
                Stats Share Link
              </v-card-title>

              <v-card-text>
                <v-text-field :value="statsShareURL" hide-details readonly label="Share URL" box />
                <v-layout align-center class="mt-3">
                  <!-- <v-btn dark class="mx-0 my-0" @click="copyShareURLToClipboard">
                    Copy
                  </v-btn> -->
                  <span v-if="copiedURLNotification" class="ml-2 subheading font-weight-bold"> <v-icon color="green">done</v-icon>Copied to clipboard</span>
                </v-layout>
              </v-card-text>

              <v-divider />

              <v-card-actions>
                <v-spacer />
                <v-btn
                  color="primary"
                  flat
                  @click="shareLinkDialog = false"
                >
                  Close
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-layout>
        <v-layout column>
          <!-- Page Content -->
          <v-container row grid-list-lg>
            <v-layout v-if="playerHasStats && !isLoading" row wrap>
              <v-flex
                v-for="(stat, index) in stats"
                :key="index"
                xs12
                sm6
                md4
                lg3
              >
                <v-card>
                  <v-card-title class="primary white--text py-1">
                    <h4>{{ stat.name }}</h4>
                  </v-card-title>
                  <v-divider />
                  <v-list dense style="min-height:200px;">
                    <v-list-tile v-for="statRow in stat.stats" :key="statRow.name" @click="">
                      <v-list-tile-content class="font-weight-bold">
                        {{ statRow.name }}:
                      </v-list-tile-content>
                      <v-list-tile-content class="align-end" style="text-align:right; align-items: flex-end!important;">
                        {{ statRow.value }}
                      </v-list-tile-content>
                    </v-list-tile>
                  </v-list>
                </v-card>
              </v-flex>
            </v-layout>

            <v-layout v-if="!playerHasStats && !isLoading && $props.selectedmemberprop" justify-center>
              <h3>This player has no stats</h3>
            </v-layout>
            <v-layout v-if="isLoading" justify-center>
              <v-progress-circular
                :size="50"
                color="primary"
                indeterminate
              />
            </v-layout>
          </v-container>
        </v-layout>
      </v-flex>
    </v-layout>
  </v-layout>
</template>

<script>
export default {
  // eslint-disable-next-line
	props: ["selectedmemberprop"],
  data() {
    return {
      stats: [],
      isLoading: false,
      shareLinkDialog: false,
      statsShareURL: false,
      copiedURLNotification: false,
      cancelToken: false,
      cancelSource: false,
      playerHasStats: false,
      statsTemplate: {
        general: { name: 'General Stats', stats: [] },
        race: { name: 'Race Stats', stats: [] },
        shooter: { name: 'Shooter Stats', stats: [] },
        nts: { name: 'Never The Same Stats', stats: [] },
        rtf: { name: 'Reach The Flag Stats', stats: [] },
        dd: { name: 'Destruction Derby Stats', stats: [] },
        ctf: { name: 'Capture The Flag Stats', stats: [] }
      }
    }
  },
  watch: {
    selectedmemberprop: function (val) {
      // console.log(val);
      if (val && val.id) {
        // this.changeRoute(val.id);
        this.getMemberStats(val.id)
        // this.$route.fullPath = val.id;
      }
    }
  },
  created() {},
  methods: {
    setShareURL() {
      this.statsShareURL = window.location.href
    },
    parseDate(date) {
      const d = new Date(0)
      d.setUTCSeconds(date)
      return d.toLocaleDateString()
    },
    async getMemberStats(playerID) {
      this.isLoading = true
      this.playerHasStats = false
      this.stats = []
      let response
      try {
        response = await this.$axios.$get(
          '/api/web/getmemberstats?forumid=' + playerID
        )
      } catch (er) {
        this.isLoading = false
        return
      }

      if (
        response &&
				Array.isArray(response) &&
				response[0] &&
				Object.keys(response[0]).length > 0
      ) {
        this.stats = this.convertStatsObject(response[0])
        this.playerHasStats = true
      }
      this.isLoading = false
    },
    convertStatsObject(stats) {
      const converted = this.statsTemplate
      for (const stat in stats) {
        let theValue = stats[stat]
        switch (stat) {
          // General
          case 'Checkpoints Collected':
          case 'Time ingame':
          case 'Total deaths':
            if (stat === 'Time ingame') {
              theValue = this.msToTime(theValue)
            }
            converted.general.stats.push({
              name: stat,
              value: theValue
            })
            break
            // Race
          case 'Race Starts':
          case 'Race Finishes':
          case 'Race Wins':
            converted.race.stats.push({
              name: stat,
              value: theValue
            })
            break
            // Shooter
          case 'Shooter Deaths':
          case 'Shooter Wins':
          case 'Shooter Kills':
            converted.shooter.stats.push({
              name: stat,
              value: theValue
            })
            break
            // Nts
          case 'NTS Starts':
          case 'NTS Wins':
            converted.nts.stats.push({
              name: stat,
              value: theValue
            })
            break
            // RTF
          case 'RTF Starts':
          case 'RTF Wins':
            converted.rtf.stats.push({
              name: stat,
              value: theValue
            })
            break
            // dd
          case 'DD Deaths':
          case 'DD Wins':
          case 'DD Kills':
            converted.dd.stats.push({
              name: stat,
              value: theValue
            })
            break
            // ctf
          case 'CTF flags delivered':
            converted.ctf.stats.push({
              name: stat,
              value: theValue
            })
            break
        }
        // const theValue = stats.stat;
        // const statRow = {
        // 	name: stat,
        // 	value: theValue
        // };
        // converted.push(statRow);
      }

      return converted
    },
    msToTime(duration) {
      const milliseconds = parseInt((duration % 1000) / 100)
      let seconds = Math.floor((duration / 1000) % 60)
      let minutes = Math.floor((duration / (1000 * 60)) % 60)
      let hours = Math.floor((duration / (1000 * 60 * 60)) % 24)
      hours = hours < 10 ? '0' + hours : hours
      minutes = minutes < 10 ? '0' + minutes : minutes
      seconds = seconds < 10 ? '0' + seconds : seconds

      return hours + ':' + minutes + ':' + seconds + '.' + milliseconds
    },
    async copyShareURLToClipboard() {
      try {
        await this.$copyText(this.statsShareURL)
      } catch (e) {
        console.error(e)
        return
      }
      this.copiedURLNotification = true
      const self = this
      setTimeout(function () {
        self.copiedURLNotification = false
      }, 2000)
    }
  }
}
</script>
