<template>
  <div>
    <v-flex class="mt-3">
      <v-layout v-if="selectedmemberprop && selectedmemberprop.id" row align-center wrap>
        <span class="headline">{{ selectedmemberprop.name }}'s Top Times</span>
        <v-dialog
          v-model="shareLinkDialog"
          width="500"
        >
          <v-btn slot="activator" icon small @click="getCurrentUrl()">
            <v-icon size="20">
              share
            </v-icon>
          </v-btn>

          <v-card>
            <v-card-title
              class="title primary white--text py-3"
              primary-title
            >
              Tops Share Link
            </v-card-title>

            <v-card-text>
              <v-text-field :value="topsShareURL" hide-details readonly label="Share URL" box />
              <v-layout align-center class="mt-3">
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
      <v-layout column wrap>
        <!-- Page Content -->
        <v-layout row wrap>
          <v-flex v-for="(a, index) in topAmounts" :key="index" xs12 sm6 md2>
            <v-card flat>
              <v-card-text class="pb-0 font-weight-bold title text-xs-center">
                Top {{ index+1 }}'s
              </v-card-text>
              <v-card-text class="font-weight-bold subheading text-xs-center primary--text">
                {{ a || 0 }}
              </v-card-text>
            </v-card>
          </v-flex>
        </v-layout>
      </v-layout>
    </v-flex>
    <v-flex>
      <!-- v-if="$vuetify.breakpoint.mdAndUp" -->
      <v-data-table
        v-if="selectedmemberprop"
        class="tableElement"
        :headers="headers"
        :items="toptimes"
        flat
        :rows-per-page-items="[100,300,500,1000]"
        :loading="isLoading"
      >
        <v-progress-linear slot="progress" color="primary" indeterminate />

        <template slot="items" slot-scope="props">
          <td>
            {{ props.item.pos }}
          </td>
          <td class="font-weight-bold">
            <a
              class="subheading"
              style=""
              @click="goToMapTops(props.item.resname)"
            >
              <v-icon color="black" small>exit_to_app</v-icon>
              {{ props.item.mapname || props.item.resname }}
            </a>
          </td>
          <td class="font-weight-medium">
            {{ getFormattedValue(props.item.value,props.item.racemode) }}
          </td>

          <td class="font-weight-medium">
            {{ parseDate(props.item.date) }}
          </td>
        </template>

        <template slot="no-data">
          <v-alert v-if="!isLoading" :value="true" color="error" icon="warning">
            Sorry, this player has no toptimes
          </v-alert>
        </template>
      </v-data-table>
    </v-flex>

    <!-- <v-flex v-if="$vuetify.breakpoint.smAndDown">
      <v-data-iterator
        :items="toptimes"
        :rows-per-page-items="[30]"
        :pagination.sync="iteratorPagination"
        content-tag="v-layout"
        row
        wrap
        xs12
        sm6
        md4
        lg3
      >
        <template v-slot:item="props">
          <v-flex class="my-3">
            <v-card>
              <v-divider />
              <v-list dense>
                <v-list-tile>
                  <v-list-tile-content>Map:</v-list-tile-content>
                  <v-list-tile-content class="align-end text-truncate">
                    <a
                      class="subheading"
                      style=""
                      @click="goToMapTops(props.item.resname)"
                    >
                      <v-icon color="black" small>exit_to_app</v-icon>
                      {{ props.item.mapname || props.item.resname }}
                    </a>
                  </v-list-tile-content>
                </v-list-tile>
                <v-divider />
                <v-list-tile>
                  <v-list-tile-content>Position:</v-list-tile-content>
                  <v-list-tile-content class="align-end text-truncate">
                    {{ props.item.pos }}
                  </v-list-tile-content>
                </v-list-tile>
                <v-divider />
                <v-list-tile>
                  <v-list-tile-content>Time/Kills:</v-list-tile-content>
                  <v-list-tile-content class="align-end text-truncate">
                    {{ getFormattedValue(props.item.value,props.item.racemode) }}
                  </v-list-tile-content>
                </v-list-tile>
                <v-divider />
                <v-list-tile>
                  <v-list-tile-content>Date:</v-list-tile-content>
                  <v-list-tile-content class="align-end text-truncate">
                    {{ parseDate(props.item.date) }}
                  </v-list-tile-content>
                </v-list-tile>
              </v-list>
            </v-card>
          </v-flex>
        </template>
      </v-data-iterator>
    </v-flex> -->
    <v-layout v-if="isLoading" justify-center>
      <v-progress-circular
        :size="50"
        color="primary"
        indeterminate
      />
    </v-layout>
  </div>
</template>

<script>
export default {
  // eslint-disable-next-line
	props: ["selectedmemberprop"],
  data() {
    return {
      toptimes: [],
      topAmounts: false,
      isLoading: false,
      shareLinkDialog: false,
      topsShareURL: false,
      copiedURLNotification: false,
      cancelToken: false,
      cancelSource: false,
      iteratorPagination: {
        rowsPerPage: -1
      },
      headers: [
        { text: 'Rank', value: 'pos' },
        { text: 'Map', value: 'mapname', sortable: false },
        { text: 'Time/Kills', value: 'value', sortable: false },
        { text: 'Date', value: 'date', sortable: false }
      ]
    }
  },
  watch: {
    selectedmemberprop: function (val) {
      // console.log(val);
      this.topAmounts = false
      if (val && val.id) {
        // this.changeRoute(val.id);
        this.getMemberTops(val.id)
        // this.$route.fullPath = val.id;
      }
    }
  },

  mounted() {
    if (this.$route.params.userID) {
    	const object = this.searchIdObject(this.$route.params.userID)
    	if (object) {
    		this.model = object
    		this.topsShareURL = window.location.href
    	}
    }
  },
  methods: {
    getCurrentUrl() {
      this.topsShareURL = window.location.href || ''
    },
    goToMapTops(resname) {
      if (resname && typeof resname === 'string') {
        this.$router.push('/mta/toptimes/map/' + resname + '/')
      }
    },
    parseDate(date) {
      const d = new Date(0)
      d.setUTCSeconds(date)
      return d.toLocaleDateString()
    },
    getFormattedValue(value, racemode) {
      const timeMode = {
        race: true,
        nts: true,
        rtf: true
      }

      if (timeMode[racemode]) {
        // If it's in time mode
        return this.msToTime(value)
      } else {
        // If its in kill mode
        return value + ' kills'
      }
    },
    msToTime(duration) {
      return new Date(duration).toISOString().slice(14, -1)
    },
    async getMemberTops(playerID) {
      this.isLoading = true
      this.toptimes = []
      let response
      try {
        response = await this.$axios.$get(
          '/api/web/getmembertops?forumid=' + playerID
        )
      } catch (er) {
        this.isLoading = false
        return
      }
      if (Array.isArray(response)) {
        this.toptimes = response
        this.calculateTopAmounts()
      }

      this.isLoading = false
    },
    calculateTopAmounts() {
      this.topAmounts = false
      // Calculate Top Amounts
      const maxToCalculate = 5 // Calculate to top x, then break
      const topcounter = []

      if (!this.toptimes.length || this.toptimes.length < 1) return

      for (const top of this.toptimes) {
        if (top.pos > maxToCalculate) {
          break
        }

        if (!topcounter[top.pos - 1]) {
          topcounter[top.pos - 1] = 1
        } else {
          topcounter[top.pos - 1]++
        }
      }
      this.topAmounts = topcounter
      // console.log(this.toptimes);
    },
    async copyShareURLToClipboard() {
      try {
        await this.$copyText(this.topsShareURL)
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
