<template>
  <v-layout class="mt-3" column style="display: inline-block; width: 100%; max-width:100%;">
    <v-layout v-if="selectedmapprop && selectedmapprop.mapname" row align-center wrap>
      <span class="headline">Map: "{{ selectedmapprop.mapname }}" Top Times</span>
      <v-dialog
        v-model="shareLinkDialog"
        width="500"
      >
        <v-btn slot="activator" icon small @click="setShareUrl()">
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
            <v-text-field :value="shareURL" hide-details readonly label="Share URL" box />
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

    <v-data-table
      v-if="selectedmapprop && selectedmapprop.mapname"
      :headers="headers"
      :items="toptimes"
      flat
      hide-actions
      class=""
      :loading="isLoading"
    >
      <template slot="items" slot-scope="props">
        <td>{{ props.item.pos }}</td>
        <td class="font-weight-bold">
          <a
            v-if="props.item.formattedName"
            class="subheading"
            style="text-decoration: none;"
            :href="props.item.profileUrl"
            target="_blank"
            v-html="props.item.formattedName"
          />
          <a v-else href="#">{{ props.item.forumid }}</a>
        </td>
        <td class="font-weight-medium">
          {{ props.item.formattedValue }}
        </td>

        <td class="red--text">
          {{ props.item.diff }}
        </td>
        <td>{{ parseDate(props.item.date) }}</td>
      </template>
    </v-data-table>
    <v-layout v-if="isLoading" justify-center>
      <v-progress-circular
        :size="50"
        color="primary"
        indeterminate
      />
    </v-layout>
  </v-layout>
</template>

<script>
export default {
  // eslint-disable-next-line
	props: ["selectedmapprop"],
  data() {
    return {
      isLoading: false,
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
      headers: [
        { text: 'Rank', value: 'pos', width: '30px' },
        { text: 'Player', value: 'name', sortable: false },
        { text: 'Time', value: 'value', sortable: false },
        { text: 'Difference', value: 'difference', sortable: false },
        { text: 'Date', value: 'date', sortable: false }
      ],
      toptimes: [],
      cancelToken: false,
      cancelSource: false
    }
  },
  computed: {
    timeMode: function () {
      const timeModeArray = {
        // Specify which modes are time based, the rest will be kill based
        nts: true,
        race: true,
        rtf: true
      }

      if (
        this.selectedmapprop &&
				this.selectedmapprop.racemode &&
				timeModeArray[this.selectedmapprop.racemode]
      ) {
        // Is timemode
        return 'Time'
      } else {
        return 'Kills'
      }
    }
  },

  watch: {
    selectedmapprop: function (val, old) {
      if (val === old) return

      if (val && val.resname) {
        this.getMapTops(val.resname)
        this.setTableHeaders()
      }
    },

    $route(to, from) {}
  },
  mounted() {
    if (this.selectedmapprop && this.selectedmapprop.resname) {
      this.getMapTops(this.selectedmapprop.resname)
      this.setTableHeaders()
    }
  },
  methods: {
    setTableHeaders() {
      const theTimeMode = this.timeMode
      const head = [
        { text: 'Rank', value: 'pos', width: '30px' },
        { text: 'Player', value: 'name', sortable: false },
        { text: theTimeMode, value: 'value', sortable: false },
        { text: 'Difference', value: 'difference', sortable: false },
        { text: 'Date', value: 'date', sortable: false }
      ]
      this.headers = head
    },
    getMapTops(resname) {
      this.isLoading = true
      this.toptimes = []
      this.$axios
        .$get(
          '/api/web/mtamaptoptimes?mapName=' + resname
        )
        .then((response) => {
          this.isLoading = false
          this.toptimes = response
          this.fixTopValues()
        })
        .catch((error) => {
          console.error(error)
          this.isLoading = false
        })
    },
    setShareUrl() {
      this.shareURL = window.location.href || ''
    },
    fixTopValues() {
      // Sets time/kills, and difference
      const mode = this.timeMode

      for (const i in this.toptimes) {
        // Calculate Kills

        if (parseInt(i) === 0) {
          // First top
          // this.toptimes[i].value = this.toptimes[i].value
          this.toptimes[i].diff = ''
        } else {
          // Other tops msToTime()
          const previousTop = this.toptimes[parseInt(i) - 1]
          this.toptimes[i].diff = this.toptimes[i].value - previousTop.value
        }

        if (mode === 'Kills') {
          this.toptimes[i].formattedValue = this.toptimes[i].value + ' kills'
        } else {
          this.toptimes[i].formattedValue = this.msToTime(
            this.toptimes[i].value
          )
          if (parseInt(i) > 0) {
            this.toptimes[i].diff = '-' + this.msToTime(this.toptimes[i].diff)
          }
        }
      }
    },
    msToTime(duration) {
      return new Date(duration).toISOString().slice(14, -1)
    },
    parseDate(date) {
      const d = new Date(0)
      d.setUTCSeconds(date)
      return d.toLocaleDateString()
    },
    getFullRaceModeName: function (raceMode) {
      return this.fullRaceModeNames[raceMode] || raceMode
    },

    copyShareURLToClipboard() {
      // const el = document.createElement("textarea"); // Create a <textarea> element
      // el.value = this.shareURL; // Set its value to the string that you want copied
      // el.setAttribute("readonly", ""); // Make it readonly to be tamper-proof
      // el.style.position = "absolute";
      // el.style.left = "-9999px"; // Move outside the screen to make it invisible
      // document.body.appendChild(el); // Append the <textarea> element to the HTML document
      // const selected =
      // 	document.getSelection().rangeCount > 0 // Check if there is any content selected previously
      // 		? document.getSelection().getRangeAt(0) // Store selection if found
      // 		: false; // Mark as false to know no selection existed before
      // el.select(); // Select the <textarea> content
      // const copied = document.execCommand("copy"); // Copy - only works as a result of a user action (e.g. click events)
      // if (copied) {
      // 	this.copiedURLNotification = true;
      // 	const self = this;
      // 	setTimeout(function() {
      // 		self.copiedURLNotification = false;
      // 	}, 2000);
      // }
      // document.body.removeChild(el); // Remove the <textarea> element
      // if (selected) {
      // 	// If a selection existed before copying
      // 	document.getSelection().removeAllRanges(); // Unselect everything on the HTML document
      // 	document.getSelection().addRange(selected); // Restore the original selection
      // }
    }
  }
}
</script>
