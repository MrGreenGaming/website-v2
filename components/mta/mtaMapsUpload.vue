<template>
  <v-layout column wrap class="mt-4">
    <v-card class="mb-3">
      <v-toolbar flat color="primary" dark dense class="slim-toolbar-padding">
        <v-icon>cloud_upload</v-icon>
        <v-toolbar-title class="subheading ml-2">
          Map Upload
        </v-toolbar-title>
      </v-toolbar>
      <no-ssr>
        <v-container v-if="$vuetify.breakpoint.smAndUp" column fluid>
          <v-flex class="mx-1 mb-3">
            <h3>Please read the map rules before uploading.</h3>
            <v-btn dark class="mx-0" :href="mapRulesTopicUrl" target="_blank">
              Read Map Rules
            </v-btn>
          </v-flex>

          <v-divider class="mb-3" />
          <v-flex v-if="!isEnabled">
            <h2>Coming soon!</h2>
          </v-flex>
          <v-flex v-if="$auth.loggedIn && isEnabled">
            <v-card flat>
              <v-layout column>
                <!-- ERROR MESSAGES -->
                <v-card v-for="(message, index) in errorMessages" :key="index" color="red" class="mb-2 px-3 py-1 white--text">
                  <v-layout align-center :column="$vuetify.breakpoint.smAndDown? true : false">
                    <div style="max-width:80%;" class="overflow-hidden font-weight-bold">
                      ERROR: {{ message }}
                    </div>
                    <v-spacer />
                    <v-btn ripple small flat class="white--text" @click="removeError(index)">
                      close
                    </v-btn>
                  </v-layout>
                </v-card>
                <!-- FILE LIST -->
                <v-list two-line subheader>
                  <v-list-tile v-if="files.length == 0">
                    <v-list-tile-content>
                      <v-list-tile-title>
                        No map selected
                      </v-list-tile-title>
                    </v-list-tile-content>
                  </v-list-tile>
                  <v-list-tile
                    v-for="(item, index) in files"
                    :key="index"
                    avatar
                  >
                    <v-list-tile-avatar class="hidden-sm-and-down">
                      <v-icon v-if="uploadingProgress[item.name]" class="white--text" :class="uploadingProgress[item.name] == 'success' || uploadingProgress[item.name] == 'uploading' ? 'primary' : 'red' ">
                        folder
                      </v-icon>

                      <v-icon v-else class="grey white--text">
                        folder
                      </v-icon>
                    </v-list-tile-avatar>

                    <v-list-tile-content>
                      <v-list-tile-title>{{ item.name }}</v-list-tile-title>
                      <v-list-tile-sub-title>
                        <div>Size: {{ bytesConversion(item.size,"kb") }} KB</div>
                      </v-list-tile-sub-title>
                      <v-list-tile-sub-title class="hidden-sm-and-down">
                        <div>
                          <v-btn
                            v-if="!item.comment"
                            small
                            icon
                            color="primary"
                            class="ml-0"
                            :disabled="isUploading"
                            @click="showCommentDialog(index)"
                          >
                            <v-icon>add</v-icon>
                          </v-btn>

                          <v-btn
                            v-if="item.comment"
                            small
                            icon
                            color="primary"
                            class="ml-0"
                            :disabled="isUploading"
                            @click="showCommentDialog(index)"
                          >
                            <v-icon size="15px">
                              edit
                            </v-icon>
                          </v-btn>
                          Comment: {{ item.comment || "No comment added" }}
                        </div>
                      </v-list-tile-sub-title>
                    </v-list-tile-content>

                    <v-list-tile-action>
                      <!-- Show clear button when not uploading -->
                      <v-btn v-if="!isUploading" icon ripple @click="removeSelectedMap(index)">
                        <v-icon color="red lighten-1">
                          clear
                        </v-icon>
                      </v-btn>
                      <!-- Show different states when uploading/done/error -->
                      <v-progress-circular
                        v-if="uploadingProgress[item.name] === 'uploading'"
                        indeterminate

                        color="grey"
                      />
                      <v-tooltip v-if="uploadingProgress[item.name] === 'success'" top>
                        <template v-slot:activator="{ on }">
                          <v-icon color="green" x-large v-on="on">
                            check_circle_outline
                          </v-icon>
                        </template>
                        <span>Successfully uploaded to server</span>
                      </v-tooltip>

                      <v-tooltip v-if="uploadingProgress[item.name] === 'error'" top>
                        <template v-slot:activator="{ on }">
                          <v-icon color="red" x-large v-on="on">
                            error_outline
                          </v-icon>
                        </template>
                        <span>Failed to upload to server, check error below.</span>
                      </v-tooltip>
                    </v-list-tile-action>
                  </v-list-tile>

                  <v-divider inset />
                </v-list>
              </v-layout>

              <!-- Upload button -->
              <v-btn
                v-if="!isDoneUploading"
                :disabled="files.length < 1 || isUploading"
                :large="$vuetify.breakpoint.smAndDown? false : true"
                class="my-3"
                color="primary"
                @click="uploadMaps()"
              >
                <div v-if="!isUploading">
                  Upload map(s) to server
                </div>
                <div v-if="isUploading">
                  Uploading map(s)
                </div>

                <v-icon v-if="!isUploading" dark right>
                  send
                </v-icon>
                <v-progress-circular v-if="isUploading" color="grey" :size="20" indeterminate class="ml-3" />
              </v-btn>
              <!-- Reset button -->
              <v-btn v-if="isDoneUploading" :large="$vuetify.breakpoint.smAndDown? false : true" class="my-3" color="primary" @click="resetUploader()">
                Upload more maps
                <v-icon dark right>
                  autorenew
                </v-icon>
              </v-btn>
              <!-- File drop/browse -->
              <v-layout
                v-if="!isUploading"
                class="dragDropMapUploadArea py-4 px-2"
                style="min-height:100px;"
                justify-center
                align-center
                column
              >
                <div class="dragDropMapUploadAreaText font-weight-regular subheading grey--text">
                  <b>Drag and drop</b> zip file
                </div>
                <div class="dragDropMapUploadAreaText font-weight-regular subheading grey--text">
                  or
                </div>
                <div class="dragDropMapUploadAreaText font-weight-regular subheading grey--text">
                  <b>Click to browse</b> from computer
                </div>
                <!-- Show on hover -->
                <div class="dragDropMapUploadAreaTextOnHover font-weight-regular display-2 white--text">
                  <v-layout align-center justify-center style="height:100%;">
                    Browse Files
                  </v-layout>
                </div>
                <!-- Show on drag hover -->
                <div class="onDragHoverBackground" />
                <div class="dragDropMapUploadAreaTextOnHoverDrag font-weight-regular display-2 white--text">
                  <v-layout align-center justify-center style="height:100%;">
                    <v-icon color="white" size="80px">
                      archive
                    </v-icon>
                  </v-layout>
                </div>

                <input type="file" class="mapUploadInputField" multiple @change="checkSelectedFile">
              </v-layout>

              <!-- Uploading info -->
              <v-flex v-for="(message, index) in returnedServerMessages" :key="index" class="my-1">
                <v-card dark :color="message.type == 'error'? 'red' : 'primary' ">
                  <v-card-title class="title">
                    Map: {{ message.mapname }}
                  </v-card-title>
                  <v-card-text>{{ message.message }}</v-card-text>
                  <v-card-actions>
                    <v-btn flat small dark @click="copyMessageToClipboard(index,$event)">
                      Copy to clipboard
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-flex>
            </v-card>
          </v-flex>
          <!-- User not loged in -->
          <v-flex v-if="!$auth.loggedIn && isEnabled">
            <h2>You need to be logged in to upload maps</h2>
            <v-btn color="primary" large @click="$auth.loginWith('forums')">
              Log in
            </v-btn>
            or
            <v-btn color="primary" large @click="goRegister()">
              Register
            </v-btn>
          </v-flex>
        </v-container>

        <v-container v-else>
          Please upload maps on a desktop.
        </v-container>
      </no-ssr>
    </v-card>
    <!-- Edit Comment Dialog -->
    <v-dialog v-model="mapCommentEditDialog" max-width="500" persistent>
      <v-card>
        <v-card-title class="subheading">
          Edit map comment
        </v-card-title>
        <v-card-text>
          Map comments are optional
          <v-text-field
            v-model="mapCommentEditValue"
            label="Comment"
            clearable
            counter="100"
            maxlength="100"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn small flat dark color="red" @click="addComment(true)">
            Cancel
          </v-btn>
          <v-btn small color="primary" @click="addComment()">
            Accept
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script>
// import { reject, resolve } from "q";
export default {
  data() {
    return {
      mapRulesTopicUrl: 'https://mrgreengaming.com/forums/topic/14734-editor-plugin-mapping-rules-for-mta/',
      errorMessages: [],
      files: [],
      validGameModePrefixes: ['nts', 'race', 'dl', 'rtf', 'dd', 'ctf', 'sh'],
      maxMapFileSize: 6, // In megabytes
      mapCommentEditDialog: false,
      mapCommentEditValue: '',
      mapCommentEditCurrentlySelected: false,
      isUploading: false,
      isDoneUploading: false,
      uploadingProgress: {},
      returnedServerMessages: [],
      isEnabled: true
    }
  },
  computed: {},
  mounted() {
    // Drag and drop styling
    window.onload = function () {
      document
        .querySelector('.mapUploadInputField')
        .addEventListener('dragenter', function (e) {
          document.querySelector(
            '.dragDropMapUploadAreaTextOnHoverDrag'
          ).style.visibility = ''
          document.querySelector(
            '.dragDropMapUploadAreaTextOnHoverDrag'
          ).style.opacity = 1
          document.querySelector(
            '.dragDropMapUploadAreaTextOnHoverDrag'
          ).style.opacity = 1
          document.querySelector('.onDragHoverBackground').style.opacity = 1
        })

      document
        .querySelector('.mapUploadInputField')
        .addEventListener('dragleave', function (e) {
          e.preventDefault()

          document.querySelector(
            '.dragDropMapUploadAreaTextOnHoverDrag'
          ).style.visibility = 'hidden'
          document.querySelector(
            '.dragDropMapUploadAreaTextOnHoverDrag'
          ).style.opacity = 0
          document.querySelector('.onDragHoverBackground').style.opacity = 0
        })

      document
        .querySelector('.mapUploadInputField')
        .addEventListener('dragover', function (e) {
          e.preventDefault()
          document.querySelector(
            '.dragDropMapUploadAreaTextOnHoverDrag'
          ).style.visibility = ''
          document.querySelector(
            '.dragDropMapUploadAreaTextOnHoverDrag'
          ).style.opacity = 1
          document.querySelector('.onDragHoverBackground').style.opacity = 1
        })

      document
        .querySelector('.mapUploadInputField')
        .addEventListener('drop', function (e) {
        // e.preventDefault();
          document.querySelector(
            '.dragDropMapUploadAreaTextOnHoverDrag'
          ).style.visibility = 'hidden'
          document.querySelector(
            '.dragDropMapUploadAreaTextOnHoverDrag'
          ).style.opacity = 0
          document.querySelector('.onDragHoverBackground').style.opacity = 0
        })
    }
  },
  methods: {
    async uploadMaps() {
      // Clicked on upload maps
      // We are now in uploading mode
      this.isUploading = true
      for (const index in this.files) {
        const theFile = this.files[index]

        this.$set(this.uploadingProgress, theFile.name, 'uploading')

        const formData = new FormData()
        formData.append('file', theFile)
        formData.append('comment', theFile.comment || false)
        await this.$axios
          .$post('api/mapupload/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })
          .then((response) => {
            console.log(response)
            if (response === 'Update') {
              this.$set(this.uploadingProgress, theFile.name, 'success')
              this.returnedServerMessages.push({
                mapname: theFile.name,
                type: 'success',
                message:
                `Update successful!. 
                Wait for a map manager to approve or deny your map update. 
                You will be notified via forum PM when the map status changes (accepted/declined). 
                Thank you for your contribution!`
              })
            } else {
              this.$set(this.uploadingProgress, theFile.name, 'success')
              this.returnedServerMessages.push({
                mapname: theFile.name,
                type: 'success',
                message:
                `Upload successful!. 
                Wait for a map manager to approve or deny your map. 
                You will be notified via forum PM when the map status changes (accepted/declined). 
                Thank you for your contribution!`
              })
            }
          })
          .catch((error) => {
            // error

            console.error(error.response.data.errorMessage)
            this.$set(this.uploadingProgress, theFile.name, 'error')
            this.returnedServerMessages.push({
              mapname: theFile.name,
              type: 'error',
              message:
								'RESPONSE: ' +
								error.response.status +
								' : ' +
								error.response.data.errorMessage
            })
          })
      }
      // Done uploading, set to isDoneUploading state
      this.isDoneUploading = true
    },
    goRegister() {
      window.location = 'https://mrgreengaming.com/forums/register/'
    },
    checkSelectedFile(event) {
      // Client side validating, just to check before sending to server
      for (const theFile of event.target.files) {
        // const theFile = event.target.files[0];
        const fileName = theFile.name

        // Check if file is zip
        console.log('(debug) File MIME is: ', theFile.type)
        const allowedTypes = [
          'application/zip',
          'application/zip-compressed',
          'application/x-zip-compressed',
          'application/zip',
          'multipart/x-zip'
        ]
        if (!allowedTypes.includes(theFile.type)) {
          // Selected file is not a zip file
          this.addError("'" + fileName + "' is not a zip file.")
          continue
        }
        // Check if file size is too big
        if (this.bytesConversion(theFile.size, 'mb') > this.maxMapFileSize) {
          this.addError("'" + fileName + "' is too big. (max " + this.maxMapFileSize + ' MB)')
          continue
        }
        // Check if zip file is named properly
        if (
          fileName.indexOf('-') === -1 ||
					!this.validGameModePrefixes.includes(
					  fileName.split('-')[0].toLowerCase()
					)
        ) {
          let gamemodeString = ''
          for (const mode of this.validGameModePrefixes) {
            gamemodeString = gamemodeString + mode + '-, '
          }
          this.addError(
            "'" +
							fileName +
							"' does not have a valid prefix in its filename. File name should start with gamemode like: " +
							gamemodeString
          )
          continue
        }
        const fileNameWithoutExtension = fileName.replace('.zip', '')
        const regex = /[^A-z0-9-_]/
        if (fileNameWithoutExtension.match(regex)) {
          this.addError(
            "'" +
							fileName +
							"' contains illegal characters. (allowed: A-z, 0-9, _)"
          )
          continue
        }

        // Check if file is already added

        if (this.files.length > 0) {
          let isDouble = false
          for (const r of this.files) {
            if (r.name === fileName) {
              isDouble = true
            }
          }
          if (isDouble) {
            continue
          }
        }

        // Check if this exceeds the max amount of map upload
        if (this.files.length === 5) {
          this.addError('Too many maps. (max: 5)')
          continue
        }
        // Set progress to file object
        this.$set(this.uploadingProgress, theFile.name, false)
        // this.uploadingProgress[theFile.name] = false;
        // theFile.progress = false;

        // If all is good, save the file in an object
        this.files.push(theFile)
      }
      // Reset file upload
      event.target.value = ''
    },
    addError(message) {
      const maxErrors = 3
      if (this.errorMessages.length === maxErrors) {
        this.errorMessages.shift()
      }

      this.errorMessages.push(message)
    },
    removeError(index) {
      this.errorMessages.splice(this.errorMessages.indexOf(index), 1)
    },
    showCommentDialog(index) {
      if (!this.files[index] || this.mapCommentEditDialog) return

      const currentComment = this.files[index].comment || ''
      this.mapCommentEditValue = currentComment
      this.mapCommentEditCurrentlySelected = index
      // Show dialog
      this.mapCommentEditDialog = true
    },
    addComment(isCanceled) {
      const theIndex = this.mapCommentEditCurrentlySelected
      const theComment = this.mapCommentEditValue

      if (!isCanceled && this.files[theIndex]) {
        // Save here
        this.files[theIndex].comment = theComment
      }
      // Close here
      this.mapCommentEditValue = ''
      this.mapCommentEditCurrentlySelected = false
      this.mapCommentEditDialog = false
    },
    removeSelectedMap(index) {
      this.files.splice(this.files.indexOf(index), 1)
    },
    bytesConversion(bytes, convertTo) {
      if (typeof bytes !== 'number' || typeof convertTo !== 'string') {
        return false
      }

      const conversion = {
        kb: 1,
        mb: 2,
        gb: 3
      }

      if (conversion[convertTo.toLowerCase()]) {
        const theNumber =
					bytes / Math.pow(1024, conversion[convertTo.toLowerCase()])
        // Round to 2 decimals
        return Math.round((theNumber + 0.00001) * 100) / 100
      } else {
        return false
      }
    },
    async copyMessageToClipboard(index, e) {
      const theButton = e.target
      const theMessage = this.returnedServerMessages[index].message || ''
      try {
        await this.$copyText(theMessage)
        theButton.innerHTML = 'Copied to clipboard!'
        setTimeout(function () {
          theButton.innerHTML = 'Copy to clipboard'
        }, 5000)
      } catch (e) {
        console.error(e)
      }
    },
    resetUploader() {
      // Reset uploader so user can upload more maps
      this.errorMessages = []
      this.files = []
      this.isUploading = false
      this.isDoneUploading = false
      this.uploadingProgress = {}
      this.returnedServerMessages = []
    }
  }
}
</script>

<style scoped>
.dragDropMapUploadArea {
	border-radius: 27px 27px 27px 27px !important;
	-moz-border-radius: 27px 27px 27px 27px !important;
	-webkit-border-radius: 27px 27px 27px 27px !important;
	border: 3px dashed rgba(0, 0, 0, 0.2);
	position: relative;
	transition: 0.5s;
}
.dragDropMapUploadAreaTextOnHover {
	position: absolute;
	font-size: 500px;
	width: 100%;
	height: 100%;
	opacity: 0;
	transition: 0.5s;
}
.dragDropMapUploadAreaTextOnHoverDrag {
	position: absolute;
	font-size: 500px;
	width: 100%;
	height: 100%;
	opacity: 0;
	transition: 0.5s;
}

.dragDropMapUploadArea:hover {
	background: rgba(51, 109, 69, 1);
}
.dragDropMapUploadArea:hover .dragDropMapUploadAreaText {
	opacity: 0;
}
.dragDropMapUploadArea:hover .dragDropMapUploadAreaTextOnHover {
	opacity: 1;
}

.mapUploadInputField {
	width: 100%;
	height: 100%;
	position: absolute;
	cursor: pointer;
	opacity: 0;
}
.onDragHoverBackground {
  border-radius: 27px 27px 27px 27px !important;
	-moz-border-radius: 27px 27px 27px 27px !important;
	-webkit-border-radius: 27px 27px 27px 27px !important;
	position: absolute;
	transition: 0.5s;
	opacity: 0;
	width: 100%;
	height: 100%;
	background: rgba(51, 109, 69, 1);
}
</style>
