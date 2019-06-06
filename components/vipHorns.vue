<template>
  <v-card class="mt-3">
    <v-toolbar flat color="primary" dark dense class="slim-toolbar-padding">
      <v-icon class="mr-1">
        volume_up
      </v-icon>
      <v-toolbar-title class="subheading ml-0">
        Manage VIP Horns
      </v-toolbar-title>
    </v-toolbar>

    <v-container>
      <v-layout column justify-start>
        <p>As a VIP you can upload up to {{ maxHornAmount }} VIP horns. To use these horns ingame, open the VIP window (F7) ingame for more information.</p>
      </v-layout>

      <v-layout class="mt-4" column justify-start>
        <h3>You currently have {{ uploadedHorns.length }}/{{ maxHornAmount }} VIP horns uploaded</h3>
        <v-list two-line subheader>
          <v-divider />
          <v-list-tile
            v-for="item in uploadedHorns"
            :key="item.title"
            avatar
          >
            <v-tooltip top>
              <v-btn
                slot="activator"
                icon
                fab
                small
                flat
                @click="playVipHorn(item.hornid)"
              >
                <v-icon>
                  play_arrow
                </v-icon>
              </v-btn>
              <span>Preview {{ item.name||item.hornid }}</span>
            </v-tooltip>

            <v-list-tile-content>
              <v-list-tile-title>{{ item.hornid }} - {{ item.name||item.hornid }}</v-list-tile-title>
              <v-list-tile-sub-title>
                <v-layout>
                  <div class="mr-1">
                    {{ item.size && formatBytes(item.size, 0) || '' }}
                  </div>
                  <div>
                    -
                  </div>
                  <div class="ml-1">
                    {{ item.duration && formatSeconds(item.duration) || '' }}
                  </div>
                </v-layout>
              </v-list-tile-sub-title>
            </v-list-tile-content>

            <v-list-tile-action>
              <v-tooltip top>
                <v-btn slot="activator" icon ripple :disabled="isUploading" @click="deleteHorn(item.hornid)">
                  <v-icon color="error">
                    close
                  </v-icon>
                </v-btn>
                <span v-if="!isUploading">Click to delete {{ item.name||item.hornid }}</span>
              </v-tooltip>
            </v-list-tile-action>
          </v-list-tile>

          <v-divider inset />
        </v-list>
        <p class="mt-5">
          Please read the rules before uploading:
        </p>
        <ul>
          <li>Horns must be less than <b>{{ maxHornLength }} seconds</b> long</li>
          <li>Horns must be in <b>.mp3 format</b></li>
          <li>Horns must be less than <b>{{ maxHornSize }} MB</b> in size</li>
          <li>Horns must not be offensive or very annoying on purpose</li>
        </ul>
        <p class="mt-3 red--text caption font-weight-bold">
          Breaking any of these rules can result in removal/diciplinary actions
        </p>
      </v-layout>
      <v-flex>
        <v-btn
          type="submit"
          large
          dark
          style="max-width=20%;"
          :disabled="isUploading"
          @click="onPickFile"
        >
          <v-icon v-if="!isUploading" right dark class="ml-0 mr-2">
            cloud_upload
          </v-icon>
          <v-progress-circular
            v-else
            indeterminate
            color="primary"
          />
          Upload Horn
        </v-btn>
        <input ref="hornFileInput" type="file" style="display:none;" accept=".mp3" @change="onHornPicked">
        <audio ref="hornPreviewAudio" />
      </v-flex>
    </v-container>
    <v-snackbar
      v-model="snackbar"
      vertical
      bottom
      :color="snackbarColor"
      :timeout="15000"
    >
      {{ snackbarText }}
      <v-btn
        color="white"
        flat
        @click="snackbar = false"
      >
        Close
      </v-btn>
    </v-snackbar>
  </v-card>
</template>

<script>

export default {
  components: {

  },
  data() {
    return {
      snackbar: false,
      snackbarText: '',
      snackbarColor: 'error',
      isUploading: false,
      maxHornAmount: 5,
      maxHornSize: 1, // in MB
      maxHornLength: 10, // in Seconds
      uploadedHorns: []
    }
  },
  mounted() {
    if (this.$auth.user && this.$auth.user.vip) {
      this.getVipHorns()
    }
  },
  methods: {
    onPickFile() {
      this.$refs.hornFileInput.click()
    },
    async onHornPicked() {
      const theFile = event.target.files[0]
      if (!theFile) {
        // Do error thing here
      }

      // Check if extension is present
      if (theFile.name.lastIndexOf('.') <= 0) {
        // incorrect file name, error
      }
      // Get Filesize

      if (typeof theFile.size !== 'number' || this.toMB(theFile.size) >= this.maxHornSize) {
        // Error for file size
      }

      // Get adio duration
      const theURL = URL.createObjectURL(theFile)
      const duration = await this.getHornDuration(theURL)
      if (!duration) {
        // Return error can't read duration
      } else if (duration > this.maxHornLength) {
        // Return error because too long
      }
      // Send to server
      const formData = new FormData()
      formData.append('file', theFile)
      this.isUploading = true
      await this.$axios.$post('api/hornupload/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
        .then((response) => {
          this.showNotification('Your VIP horn has successfully been uploaded! Please reconnect if you are connected to the MTA server.')
          this.getVipHorns()
        })
        .catch((error) => {
          console.log(error.response.data.errorMessage)
          this.showNotification('ERROR: ' + error.response.data.errorMessage || 'Your VIP horn could not be uploaded', true)
        })
        .finally(() => {
          this.isUploading = false
          this.$refs.hornFileInput.value = ''
        })
    },
    async getVipHorns() {
      const forumid = this.$auth.user.id
      if (!forumid) return
      await this.$axios.$get('api/web/getviphorns/?forumid=' + forumid).then((res) => {
        this.uploadedHorns = res
      }).catch((err) => {
        console.error(err)
      })
    },
    async deleteHorn(id) {
      if (typeof id !== 'number') return
      await this.$axios.$delete('api/hornupload/removeviphorn', {
        data: { hornid: id }
      }).catch((err) => {
        console.error(err)
      }).finally(() => {
        this.getVipHorns()
      })
    },
    playVipHorn(id) {
      if (this.$auth.user && this.$auth.user.id && id) {
        const forumid = this.$auth.user.id
        const hornFull = forumid + '-' + id
        const audio = this.$refs.hornPreviewAudio
        audio.src = 'https://mrgreengaming.com/api/viphorn/?id=' + hornFull
        audio.load()
        audio.play()
      }
    },
    getHornDuration(url) {
      return new Promise((resolve) => {
        const audio = new Audio(url)
        audio.addEventListener('loadedmetadata', function () {
          resolve(audio.duration)
        }, false)
      })
    },
    formatBytes(bytes, decimals = 2) {
      if (!bytes) return false
      if (bytes === 0) return '0 Bytes'

      const k = 1024
      const dm = decimals < 0 ? 0 : decimals
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

      const i = Math.floor(Math.log(bytes) / Math.log(k))

      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
    },
    toMB(s) {
      return s / Math.pow(1024, 2)
    },
    formatSeconds(ms) {
      // MS to sec
      if (!ms || typeof ms !== 'number') return false
      const seconds = ms / 1000
      return seconds.toFixed(2) + ' sec'
    },
    showNotification(text, error) {
      this.snackbar = false
      this.snackbarText = text
      if (error) {
        this.snackbarColor = 'red'
      } else {
        this.snackbarColor = 'green'
      }
      this.snackbar = true
    }
  }

}
</script>
