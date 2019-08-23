<template>
  <v-layout v-if="isAdmin" class="pt-5" column>
    <h1>Protected admin page</h1>
    <v-subheader>All actions are logged</v-subheader>
    <v-divider />
    <v-flex>
      <h2 class="mt-4 mb-3">
        Give VIP / GreenCoins
      </h2>

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
            <v-avatar>
              <img :src="data.item.photoUrl">
            </v-avatar>
            <span class="title" v-html="data.item.formattedName" /> <span class="ml-2 caption">#{{ data.item.id }}</span>
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
      <v-flex v-if="!selectedMember" class="headline">
        No player selected.
      </v-flex>
      <v-flex v-if="selectedMember">
        <v-flex class="mb-3 pl-0 headline">
          {{ selectedMember.name }} has <b class="primary--text">{{ selectedMemberCurrency.gc || '0' }} GC</b> and <b class="primary--text">{{ calculateVipDays(selectedMemberCurrency.vip) || '0' }} days of VIP</b>
        </v-flex>

        <h2>VIP</h2>
        <h3 v-if="giveVipAmount === 0 || !giveVipAmount">
          Give "{{ selectedMember.name }}" 0 day(s) of VIP
        </h3>
        <h3 v-if="giveVipAmount > 0">
          Give "{{ selectedMember.name }}" {{ parseInt(giveVipAmount,10) }} day(s) of VIP
        </h3>
        <h3 v-if="giveVipAmount < 0">
          Remove {{ parseInt(Math.abs(giveVipAmount),10) }} days of VIP from "{{ selectedMember.name }}"
        </h3>

        <p>Use negative numbers to remove VIP</p>

        <v-layout row wrap>
          <v-text-field
            v-model="giveVipAmount"
            type="number"
            label="VIP in days"
            style="max-width:200px;"
            class="mr-2"
            :rules="[rules.vipMax, rules.isNumber]"
          />
          <v-btn color="warning" :disabled="giveVipAmount === 0 || giveVipAmount > 2000 || !giveVipAmount" @click="doAction('givevip')">
            Give VIP
          </v-btn>
        </v-layout>

        <v-divider class="my-3" />
        <h2>GC</h2>
        <h3 v-if="giveGcAmount === 0 || !giveGcAmount">
          Give "{{ selectedMember.name }}" 0 GreenCoins
        </h3>
        <h3 v-if="giveGcAmount > 0">
          Give "{{ selectedMember.name }}" {{ parseInt(giveGcAmount,10) }} GreenCoins
        </h3>
        <h3 v-if="giveGcAmount < 0">
          Remove {{ parseInt(Math.abs(giveGcAmount),10) }} GreenCoins from "{{ selectedMember.name }}"
        </h3>

        <p>Use negative numbers to remove GC</p>

        <v-layout row wrap>
          <v-text-field
            v-model="giveGcAmount"
            type="number"
            label="GreenCoin Amount"
            style="max-width:200px;"
            class="mr-2"
            :rules="[rules.greencoinsMax, rules.greencoinsMin, rules.isNumber]"
          />
          <v-btn color="warning" :disabled="!giveGcAmount || giveGcAmount === 0 || giveGcAmount < -1000000 || giveGcAmount > 1000000" @click="doAction('givegc')">
            Give GC
          </v-btn>
        </v-layout>
      </v-flex>
      <v-divider class="mb-3 mt-3" />
      <v-flex>
        <!-- Finding members by ID -->
        <h2>Find members by ID</h2>
      </v-flex>

      <v-layout>
        <v-text-field
          v-model="memberIDSearchValue"
          type="number"
          label="Member ID"
          style="max-width:200px;"
          class="mr-2"
          :rules="[rules.isNumber]"
        />
        <v-btn
          dark
          :disabled="memberIDSearchLoading"
          @click="getMemberByID(memberIDSearchValue)"
        >
          Search
        </v-btn>
      </v-layout>

      <v-layout class="mb-4">
        <v-progress-circular
          v-if="memberIDSearchLoading"
          size="50"
          indeterminate
          color="primary"
        />
        <h3 v-if="memberIDSearchError" class="red--text">
          Error: {{ memberIDSearchError }}
        </h3>
        <v-layout v-if="memberIDSearchFetched && !memberIDSearchError" column>
          <h3>Fetched member:</h3>
          <v-divider class="mb-2" />

          <v-card class="max-width=300px">
            <v-list>
              <v-list-tile>
                <v-list-tile-content class="font-size">
                  <!-- <v-list-tile-title> -->
                  <v-layout align-center row>
                    <v-avatar class="mr-3">
                      <img :src="memberIDSearchFetched.photoUrl" alt="Avatar" @error="setDefaultAvatar">
                    </v-avatar>
                    <div v-html="memberIDSearchFetched.formattedName || memberIDSearchFetched.name" />
                  </v-layout>
                <!-- </v-list-tile-title> -->
                </v-list-tile-content>
              </v-list-tile>

              <v-list-tile>
                <v-list-tile-content class="font-size">
                  <v-list-tile-title>
                    <b>Forum ID</b>: {{ memberIDSearchFetched.id }}
                  </v-list-tile-title>
                </v-list-tile-content>
              </v-list-tile>

              <v-list-tile>
                <v-list-tile-content class="font-size">
                  <v-list-tile-title>
                    <b>GreenCoins</b>: {{ memberIDSearchFetched.greencoins || 0 }}
                  </v-list-tile-title>
                </v-list-tile-content>
              </v-list-tile>

              <v-list-tile>
                <v-list-tile-content class="font-size">
                  <v-list-tile-title>
                    <b>VIP</b>: {{ memberIDSearchFetched.vip || 0 }} days
                  </v-list-tile-title>
                </v-list-tile-content>
              </v-list-tile>

              <v-list-tile>
                <v-list-tile-content class="font-size">
                  <v-list-tile-title>
                    <b>E-mail</b>: {{ memberIDSearchFetched.email }}
                  </v-list-tile-title>
                </v-list-tile-content>
              </v-list-tile>

              <v-list-tile>
                <v-list-tile-content class="font-size">
                  <v-list-tile-title>
                    <b>Banned</b>: {{ memberIDSearchFetched.banned }}
                  </v-list-tile-title>
                </v-list-tile-content>
              </v-list-tile>

              <v-list-tile>
                <v-list-tile-content class="font-size">
                  <v-list-tile-title>
                    <b>Profile URL</b>: <a :href="memberIDSearchFetched.profileUrl" target="_blank">{{ memberIDSearchFetched.profileUrl }}</a>
                  </v-list-tile-title>
                </v-list-tile-content>
              </v-list-tile>
            </v-list>
          </v-card>
        </v-layout>
      </v-layout>
      <v-divider class="mb-3" />
      <h2>Donation Settings</h2>

      <v-list two-line>
        <v-list-tile>
          <v-list-tile-content>
            <v-list-tile-title class="font-weight-bold">
              GC donation - GC per €1
            </v-list-tile-title>
            <v-list-tile-sub-title>
              How many GC per €1 (for "gc only" donations)
            </v-list-tile-sub-title>
          </v-list-tile-content>
          <v-list-tile-action-text class="font-weight-bold subheading black--text">
            {{ donation_gc }} GC
          </v-list-tile-action-text>
          <v-list-tile-action class="ml-4">
            <v-btn ripple small @click="clickedSettingChange('donation_gc')">
              Change
            </v-btn>
          </v-list-tile-action>
        </v-list-tile>

        <v-divider />

        <v-list-tile>
          <v-list-tile-content>
            <v-list-tile-title class="font-weight-bold">
              VIP donation - DAY per €1
            </v-list-tile-title>
            <v-list-tile-sub-title>
              How many days per €1 (for "vip" donations)
            </v-list-tile-sub-title>
          </v-list-tile-content>
          <v-list-tile-action-text class="font-weight-bold subheading black--text">
            {{ donation_vip }} days
          </v-list-tile-action-text>
          <v-list-tile-action class="ml-4">
            <v-btn ripple small @click="clickedSettingChange('donation_vip')">
              Change
            </v-btn>
          </v-list-tile-action>
        </v-list-tile>

        <v-divider />

        <v-list-tile>
          <v-list-tile-content>
            <v-list-tile-title class="font-weight-bold">
              VIP donation - GC per €1
            </v-list-tile-title>
            <v-list-tile-sub-title>
              How many GC per €1 (for "vip" donations)
            </v-list-tile-sub-title>
          </v-list-tile-content>
          <v-list-tile-action-text class="font-weight-bold subheading black--text">
            {{ donation_vip_gc }} GC
          </v-list-tile-action-text>
          <v-list-tile-action class="ml-4">
            <v-btn ripple small @click="clickedSettingChange('donation_vip_gc')">
              Change
            </v-btn>
          </v-list-tile-action>
        </v-list-tile>

        <v-divider />

        <v-list-tile>
          <v-list-tile-content>
            <v-list-tile-title class="font-weight-bold">
              Discount %
            </v-list-tile-title>
            <v-list-tile-sub-title>
              Sets the discount in %
            </v-list-tile-sub-title>
          </v-list-tile-content>
          <v-list-tile-action-text class="font-weight-bold subheading black--text">
            {{ donation_discount }}%
          </v-list-tile-action-text>
          <v-list-tile-action class="ml-4">
            <v-btn ripple small :disabled="true" @click="clickedSettingChange('donation_discount')">
              Change
            </v-btn>
          </v-list-tile-action>
        </v-list-tile>

        <v-divider />

        <v-list-tile>
          <v-list-tile-content>
            <v-list-tile-title class="font-weight-bold">
              Minimum donation amount
            </v-list-tile-title>
            <v-list-tile-sub-title>
              Sets min donation amount in EUR
            </v-list-tile-sub-title>
          </v-list-tile-content>
          <v-list-tile-action-text class="font-weight-bold subheading black--text">
            €{{ donation_minimum }}
          </v-list-tile-action-text>
          <v-list-tile-action class="ml-4">
            <v-btn ripple small @click="clickedSettingChange('donation_minimum')">
              Change
            </v-btn>
          </v-list-tile-action>
        </v-list-tile>

        <v-divider />

        <v-list-tile>
          <v-list-tile-content>
            <v-list-tile-title class="font-weight-bold">
              Donation Goal
            </v-list-tile-title>
            <v-list-tile-sub-title>
              Sets monthly donation goal
            </v-list-tile-sub-title>
          </v-list-tile-content>
          <v-list-tile-action-text class="font-weight-bold subheading black--text">
            €{{ donation_goal }}
          </v-list-tile-action-text>
          <v-list-tile-action class="ml-4">
            <v-btn ripple small @click="clickedSettingChange('donation_goal')">
              Change
            </v-btn>
          </v-list-tile-action>
        </v-list-tile>
      </v-list>
      <v-divider class="mb-5" />
    </v-flex>
    <!-- Error/Success snackbars -->
    <v-snackbar
      v-model="successSnackbar"
      :timeout="6000"
      bottom
      vertical
      color="success"
    >
      {{ successSnackbarMessage }}
    </v-snackbar>

    <v-snackbar
      v-model="errorSnackbar"
      :timeout="6000"
      bottom
      vertical
      color="error"
    >
      {{ errorSnackbarMessage }}
    </v-snackbar>
    <!-- Setting Modal Window -->
    <v-dialog
      v-model="settingsDialog"
      max-width="400"
      persistent
    >
      <v-card>
        <v-container>
          <v-card-title class="headline">
            {{ selectedSettingName }}
          </v-card-title>

          <v-card-text>
            {{ selectedSettingSubText }}
          </v-card-text>

          <v-text-field
            v-model="selectedSettingValue"
            label="Change setting"
            outline
            class="mx-3"
            :mask="'#####'"
            :rules="[rules.isPositive, rules.isNumber]"
            @input="checkSettingInput"
          />
          <v-divider />
          <v-card-actions>
            <v-btn
              flat
              color="primary"
              :disabled="selectedSettingValue < 0 || !isNumber(selectedSettingValue) || isBusy"
              @click="doAction(selectedSetting)"
            >
              Save Setting
            </v-btn>
            <v-spacer />
            <v-btn
              color="red"
              flat="flat"
              @click="settingsDialog = false"
            >
              Cancel
            </v-btn>
          </v-card-actions>
        </v-container>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script>
import { mapGetters } from 'vuex'
import _ from 'lodash'
export default {
  head() {
    return {
      title: 'Admin - Mr. Green Gaming'
    }
  },
  middleware: 'auth',
  data() {
    return {
      memberIDSearchValue: 0,
      memberIDSearchLoading: false,
      memberIDSearchFetched: false,
      memberIDSearchError: false,
      adminIP: 0,
      donation_gc: 0,
      donation_vip: 0,
      donation_vip_gc: 0,
      donation_discount: 0,
      donation_minimum: 0,
      donation_goal: 0,
      selectedMember: false,
      isLoading: false,
      searchInput: '',
      players: [],
      giveVipAmount: 0,
      giveGcAmount: 0,
      isBusy: false,
      errorSnackbarMessage: '',
      errorSnackbar: false,
      successSnackbarMessage: '',
      successSnackbar: false,
      rules: {
        isNumber: value => this.isNumber(value) || 'Invalid input',
        isPositive: value => value >= 0 || 'Must be a positive number',
        greencoinsMax: value => value <= 1000000 || 'Max is 1000000',
        greencoinsMin: value => value >= -1000000 || 'Minimum is -1000000',
        vipMax: value => value <= 2000 || 'Max is 2000'
      },
      settingsDialog: false,
      selectedSetting: false,
      selectedSettingName: false,
      selectedSettingSubText: false,
      selectedSettingValue: 0,
      selectedMemberCurrency: false
    }
  },
  computed: {
    ...mapGetters(['isAuthenticated', 'loggedInUser', 'isAdmin'])
  },
  watch: {
    searchInput(val) {
      this.searchMembers(this.searchInput)
    },
    selectedMember(val) {
      if (!val) {
        // Remove selected member info
        this.selectedMemberCurrency = false
      } else if (val.id) {
        // Get member vip/gc
        this.getSelectedMemberCurrency()
      }
    }
  },

  mounted() {
    this.getSettings()
    this.getAdminIP()
  },
  methods: {
    calculateVipDays(stamp) {
      if (!stamp) return false
      const oneDay = 24 * 60 * 60 * 1000// hours*minutes*seconds*milliseconds
      const vipDate = new Date(stamp * 1000)
      const nowDate = new Date()
      vipDate.setHours(0, 0, 0)
      nowDate.setHours(0, 0, 0)
      return Math.round(Math.abs((vipDate.getTime() - nowDate.getTime()) / (oneDay)))
    },
    async getSelectedMemberCurrency() {
      if (!this.selectedMember.id || !parseInt(this.selectedMember.id)) return

      await this.$axios.$get('/api/web/getmembercurrency/?forumid=' + this.selectedMember.id)
        .then((res) => {
          this.selectedMemberCurrency = res
        })
        .catch(() => {
          this.selectedMemberCurrency = false
        })
    },
    async getAdminIP() {
      await this.$axios.$get('https://api.ipify.org')
        .catch((err) => {
          console.error(err)
          this.adminIP = 0
        }).then((res) => {
          // CORS issues here
          this.adminIP = res || 0
        })
    },
    async getMemberByID(id) {
      this.memberIDSearchLoading = true
      this.memberIDSearchError = false
      this.memberIDSearchFetched = false
      let authToken = this.$auth.getToken('forums')
      if (!authToken) {
        this.memberIDSearchError = 'You are not authorized. If this is incorrect, reload this page.'
        this.memberIDSearchLoading = false
        return
      }
      authToken = authToken.substr(7)
      if (!id || !parseInt(id, 10)) {
        this.memberIDSearchError = 'Invalid member ID specified.'
        this.memberIDSearchLoading = false
        return
      }
      await this.$axios.$get(`/api/admin/getmemberbyid/?memberid=${id}&authToken=${authToken}`).then((res) => {
        if (res.banned) {
          res.banned = true
        }
        if (res.vip) {
          res.vip = this.getVipDays(res.vip) || 0
        }
        this.memberIDSearchFetched = res
      }).catch((err) => {
        this.memberIDSearchError = err.response.data.errorMessage || err.message
      }).finally(() => {
        this.memberIDSearchLoading = false
      })
    },
    async getSettings() {
      let authToken = this.$auth.getToken('forums')
      if (!authToken) return
      authToken = authToken.substr(7)

      const settingsToFetch = [
        'donation_gc',
        'donation_vip_gc',
        'donation_vip',
        'donation_discount',
        'donation_minimum',
        'donation_goal'
      ]
      const settingsQuery = settingsToFetch.join('&')
      let result
      try {
        result = await this.$axios.$get(
          `/api/admin/getsettings/?${settingsQuery}&authToken=${authToken}`
        )
      } catch (e) {
        console.error(e)
        return
      }
      if (result) {
        // Set settings to vars
        for (const settingName in result) {
          const settingsValue = result[settingName]
          switch (settingName) {
            case 'donation_gc':
              this.donation_gc = settingsValue
              break
            case 'donation_vip':
              this.donation_vip = settingsValue
              break
            case 'donation_vip_gc':
              this.donation_vip_gc = settingsValue
              break
            case 'donation_minimum':
              this.donation_minimum = settingsValue
              break
            case 'donation_discount':
              this.donation_discount = settingsValue
              break
            case 'donation_goal':
              this.donation_goal = settingsValue
              break
          }
        }
      }
    },
    async doAction(action) {
      if (this.isBusy) return
      let authToken = this.$auth.getToken('forums')
      if (!authToken) return
      authToken = authToken.substr(7)

      switch (action) {
        case 'givegc':
          if (!this.selectedMember.id) break
          this.isBusy = true

          if (!parseInt(this.giveGcAmount, 10)) break

          await this.$axios
            .$post('api/admin/addresources', {
              authToken: authToken,
              type: 'greencoins',
              receiverid: this.selectedMember.id,
              amount: parseInt(this.giveGcAmount, 10)
            })
            .then((res) => {
              this.displayNotification('Greencoins request is handled.')
              this.giveGcAmount = 0
              this.getSelectedMemberCurrency()
            })
            .catch((err) => {
              this.displayNotification(
                'Failed to give GreenCoins, please contact a website dev.',
                true
              )
              console.error(err)
              this.giveGcAmount = 0
            })

          break

        case 'givevip':
          if (!this.selectedMember.id) break
          this.isBusy = true
          if (!parseInt(this.giveVipAmount, 10)) break

          await this.$axios
            .$post('/api/admin/addresources', {
              authToken: authToken,
              type: 'vip',
              receiverid: this.selectedMember.id,
              amount: parseInt(this.giveVipAmount, 10)
            })
            .then((res) => {
              this.displayNotification('VIP request is handled.')
              this.giveVipAmount = 0
              this.getSelectedMemberCurrency()
            })
            .catch((err) => {
              this.displayNotification(
                'Failed to give VIP, please contact a website dev.',
                true
              )

              console.error(err)
              this.giveVipAmount = 0
            })
          this.isBusy = false
          break
        case 'donation_gc':
        case 'donation_vip':
        case 'donation_vip_gc':
        case 'donation_minimum':
        case 'donation_goal':
          const newAmount = this.selectedSettingValue
          this.isBusy = true
          await this.$axios
            .$post('/api/admin/changesetting', {
              authToken: authToken,
              setting: action,
              value: newAmount
            })
            .then((res) => {
              this.displayNotification(action + ' is now set to ' + newAmount)
            })
            .catch((err) => {
              console.error('Setting Err', err)
              this.displayNotification(
                'Failed to change setting: ' + action,
                true
              )
            })
          await this.getSettings().catch(err => console.error(err))
          this.resetSettingsModal()
          break
      }
      this.isBusy = false
    },
    getVipDays(timestamp) {
      if (!timestamp) return 0

      const vipDate = new Date(timestamp * 1000)

      const diff = vipDate.getTime() - new Date().getTime()
      const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24))

      return diffDays
    },
    clickedSettingChange(setting) {
      switch (setting) {
        case 'donation_gc':
          this.selectedSetting = 'donation_gc'
          this.selectedSettingName = 'GC donation - GC per EUR'
          this.selectedSettingSubText =
						'How many gc per €1 (for "gc only" donations)'
          this.selectedSettingValue = this.donation_gc
          this.settingsDialog = true
          break
        case 'donation_vip':
          this.selectedSetting = 'donation_vip'
          this.selectedSettingName = 'VIP donation - DAY per €1'
          this.selectedSettingSubText =
						'How many days per €1 (for "vip" donations)'
          this.selectedSettingValue = this.donation_vip
          this.settingsDialog = true
          break
        case 'donation_vip_gc':
          this.selectedSetting = 'donation_vip_gc'
          this.selectedSettingName = 'VIP donation - GC per €1'
          this.selectedSettingSubText =
						'How many GC per €1 (for "vip" donations)'
          this.selectedSettingValue = this.donation_vip_gc
          this.settingsDialog = true
          break
        case 'donation_discount':
          this.selectedSetting = 'donation_discount'
          this.selectedSettingName = 'Discount %'
          this.selectedSettingSubText = 'Sets the discount in %'
          this.selectedSettingValue = this.donation_vip_gc
          // this.settingsDialog = true;
          break
        case 'donation_minimum':
          this.selectedSetting = 'donation_minimum'
          this.selectedSettingName = 'Minimum donation amount'
          this.selectedSettingSubText = 'Sets min donation amount in EUR'
          this.selectedSettingValue = this.donation_minimum
          this.settingsDialog = true
          break
        case 'donation_goal':
          this.selectedSetting = 'donation_goal'
          this.selectedSettingName = 'Donation Goal'
          this.selectedSettingSubText = 'Sets monthly donation goal in EUR'
          this.selectedSettingValue = this.donation_goal
          this.settingsDialog = true
          break
      }
    },
    resetSettingsModal() {
      this.selectedSetting = false
      this.selectedSettingName = false
      this.selectedSettingSubText = false
      this.selectedSettingValue = 0
      this.settingsDialog = false
    },
    setDefaultAvatar(event) {
      event.target.src = require('@/assets/images/logos/mrgreen-logo.png')
    },
    displayNotification(message, err) {
      if (err) {
        this.errorSnackbar = false
        this.errorSnackbarMessage = 'ERROR: ' + message
        this.errorSnackbar = true
      } else {
        this.successSnackbar = false
        this.successSnackbarMessage = message
        this.successSnackbar = true
      }
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
    checkSettingInput() {
      // Remove leading zero
      if (this.selectedSettingValue.length > 1 && this.selectedSettingValue.charAt(0) === '0') {
        const copyValue = this.selectedSettingValue
        for (let i = 0; i < copyValue.length; i++) {
          if (copyValue.charAt(i) === '0') {
            this.selectedSettingValue = this.selectedSettingValue.substr(1)
          } else {
            break
          }
        }
      }
    },
    isNumber(val) {
      return !isNaN(parseInt(val, 10))
    },
    searchMembers: _.debounce(function (value) {
      if (!value) return
      this.isLoading = true

      // Search for members
      return this.$axios
        .$get('api/web/searchmembers?name=' + value)
        .then((res) => {
          if (value && value.length > 0) {
            this.pushToSearchResults(res, this.players)
          }
        })
        .finally(() => (this.isLoading = false))
    }, 500)
  }
}
</script>

<style>
</style>
