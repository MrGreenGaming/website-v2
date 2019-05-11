<template>
  <!-- <no-ssr> -->
  <nav>
    <v-toolbar height="64px" dark app color="primary">
      <v-flex sm12 md2>
        <!-- <a href="" style="color:white; text-decoration:none;"> -->

        <v-layout class="headline" row align-center>
          <nuxt-link to="/" style="color:white; text-decoration:none;">
            <v-layout row align-center>
              <v-img
                :src="require('@/assets/images/logos/mrgreen-logo.png')"
                contain
                min-width="45px"
                min-height="45px"
                max-width="45px"
                max-height="45px"
                class="mr-3"
              />
              <span style="flex-shrink:0; height:35px;" class="mrgreen-header-text font-weight-light"><b>Mr.Green</b>Gaming</span>
            </v-layout>
          </nuxt-link>
          <v-spacer class="hidden-md-and-up" />

          <v-btn flat dark icon class="hidden-md-and-up" @click.stop="drawer = !drawer">
            <v-icon>menu</v-icon>
          </v-btn>
        </v-layout>
      </v-flex>

      <v-flex class="hidden-sm-and-down">
        <v-tabs dark slider-color="white" color="rgba(0,0,0,0)" height="64px" centered>
          <v-tab
            v-for="item in menuItems"
            :key="item.title"
            style="position:relative;"
            nuxt
            :to="item.route"
          >
            <no-ssr>
              <div
                v-if="item.submenus"
                style="width:100%;height:100%;position:absolute;top:0;left:0;"
              >
                <v-menu v-if="item.submenus" open-on-hover offset-y transition="slide-y-transition">
                  <div
                    slot="activator"
                    style="width:100%;height:100%;position:absolute;top:0;left:0;"
                  />
                  <v-list v-if="item.submenus" dense>
                    <v-list-tile
                      v-for="submenu in item.submenus"
                      :key="submenu.title"
                      :to="submenu.route"
                      ripple
                      @click="true"
                    >
                      {{ submenu.title }}
                    </v-list-tile>
                  </v-list>
                </v-menu>
              </div>
            </no-ssr>
            {{ item.title }}
            <v-icon v-if="item.submenus">
              arrow_drop_down
            </v-icon>
          </v-tab>
          <!-- Admin tab -->
          <v-tab
            v-if="isAdmin"
            style="position:relative;"
            nuxt
            to="/admin"
            @click="true"
          >
            Admin
          </v-tab>
        </v-tabs>
      </v-flex>

      <v-flex sm2 class="hidden-sm-and-down">
        <v-toolbar-items>
          <v-spacer />

          <v-menu
            v-model="userMenu"
            left
            :close-on-content-click="false"
            :nudge-width="200"
            offset-x
          >
            <template v-slot:activator="{ on }">
              <v-btn fab flat dark v-on="on">
                <v-avatar color="#3d3d3d">
                  <v-icon v-if="!$auth.$state.loggedIn" dark>
                    account_circle
                  </v-icon>

                  <img v-if="$auth.$state.loggedIn" :src="$auth.$state.user.photoUrl" alt="">
                </v-avatar>
              </v-btn>
            </template>

            <v-list v-if="$auth.$state.loggedIn" dense style="width:300px;" class="mt-0 pt-0">
              <v-container class="py-0 py-2 topUserMenu-user">
                <v-layout row align-center>
                  <v-avatar color="#3d3d3d">
                    <img :src="$auth.$state.user.photoUrl" alt="">
                  </v-avatar>
                  <v-layout column>
                    <v-flex class="pl-2 font-weight-medium title" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" v-html="$auth.$state.user.formattedName || $auth.$state.user.name" />
                    <v-flex class="pl-2 body-2 font-weight-light">
                      {{ $auth.$state.user.primaryGroup.name || "" }}
                    </v-flex>
                  </v-layout>
                </v-layout>
              </v-container>

              <v-list-tile
                v-for="(item, i) in userMenuItemsLoggedIn"
                :key="i"
                @click="true"
              >
                <v-list-tile-title @click="clickedUserMenu(item.action)">
                  {{ item.title }}
                </v-list-tile-title>
              </v-list-tile>
            </v-list>

            <v-list v-if="!$auth.$state.loggedIn" dense style="width:300px;" class="mt-0 pt-0">
              <v-list-tile
                v-for="(item, i) in userMenuItemsLoggedOut"
                :key="i"
                @click="true"
              >
                <v-list-tile-title @click="clickedUserMenu(item.action)">
                  {{ item.title }}
                </v-list-tile-title>
              </v-list-tile>
            </v-list>
          </v-menu>
        </v-toolbar-items>
      </v-flex>
    </v-toolbar>

    <v-navigation-drawer v-model="drawer" app right temporary>
      <v-container>
        <v-layout align-center column>
          <v-avatar color="#3d3d3d">
            <v-icon v-if="!$auth.$state.loggedIn" dark>
              account_circle
            </v-icon>
            <img v-if="$auth.$state.loggedIn" :src="$auth.$state.user.photoUrl" alt="">
          </v-avatar>
          <v-flex v-if="$auth.$state.loggedIn" class="title pt-1" v-html="$auth.$state.user.formattedName || $auth.$state.user.name" />
          <v-layout row>
            <!-- Buttons -->
            <v-btn v-if="$auth.$state.loggedIn" small @click="clickedUserMenu('visitprofile')">
              Visit Profile
            </v-btn>
            <v-btn v-if="$auth.$state.loggedIn" small @click="clickedUserMenu('logout')">
              Log Out
            </v-btn>

            <v-btn v-if="!$auth.$state.loggedIn" small @click="clickedUserMenu('login')">
              Log In
            </v-btn>
            <v-btn v-if="!$auth.$state.loggedIn" small @click="clickedUserMenu('register')">
              Register
            </v-btn>
          </v-layout>
        </v-layout>
      </v-container>
      <v-list class="pt-0" dense>
        <template v-for="(item, index ) in menuItems">
          <v-list-tile :key="index" nuxt :to="item.route" @click="true">
            <v-list-tile-action>
              <v-icon>{{ item.icon }}</v-icon>
            </v-list-tile-action>

            <v-list-tile-content>
              <v-list-tile-title>{{ item.title }}</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
          <template v-for="submenu in item.submenus">
            <v-list-tile :key="submenu.title" nuxt :to="submenu.route">
              <v-list-tile-action>
                <v-icon>arrow_right_alt</v-icon>
              </v-list-tile-action>
              <v-list-tile-content class="pl-4">
                <v-list-tile-title>{{ submenu.title }}</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
          </template>

          <v-divider v-if="index + 1 < menuItems.length" :key="`divider-${index}`" />
        </template>
      </v-list>
    </v-navigation-drawer>
  </nav>
  <!-- </no-ssr> -->
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  data() {
    return {
      drawer: false,
      userMenu: false,
      userMenuItemsLoggedIn: [
        { title: 'Visit Profile', action: 'visitprofile' },
        { title: 'Log Out', action: 'logout' }
      ],
      userMenuItemsLoggedOut: [
        { title: 'Log In', action: 'login' },
        { title: 'Register', action: 'register' }
      ],
      menuItems: [
        { title: 'Home', icon: 'home', route: '/' },
        { title: 'Servers', icon: 'storage', route: '/servers' },
        { title: 'Forums', icon: 'forum', route: '/forums' },
        {
          title: 'GreenCoins',
          icon: 'monetization_on',
          route: '/greencoins',
          submenus: [
            { title: 'Donate (VIP)', route: '/greencoins/donate' }
            // { title: "GC Transfer", route: "/greencoins/transfer" }
          ]
        },
        {
          title: 'MTA',
          icon: 'directions_car',
          route: '/mta',
          submenus: [
            { title: 'Leaderboards', route: '/mta/leaderboards' },
            { title: 'Stats', route: '/mta/stats' },
            { title: 'Tops', route: '/mta/toptimes' },
            // { title: "Team", route: "/mta/team" },
            { title: 'Map Upload', route: '/mta/mapupload' }
          ]
        }
      ]
    }
  },
  computed: {
    ...mapGetters(['isAuthenticated', 'loggedInUser', 'isAdmin'])
  },
  mounted() {},
  methods: {
    clickedUserMenu(action) {
      switch (action) {
        case 'logout':
          this.$auth.logout()
          this.userMenu = false
          break
        case 'visitprofile':
          const theUrl = this.$auth.user.profileUrl || false
          if (theUrl) {
            window.location = theUrl
          }
          break
        case 'login':
          this.$auth.loginWith('forums')
          break
        case 'register':
          window.location = 'https://mrgreengaming.com/forums/register/'
          break
      }
    }
  }
}
</script>

<style scoped>
.headerIcon {
	opacity: 0.75;
}
.headerIcon:hover {
	opacity: 1;
}
.v-tabs__div:hover {
	background: rgba(255, 255, 255, 0.1);
}
.topUserMenu-user {
	background: rgb(245, 245, 245);
}
</style>
