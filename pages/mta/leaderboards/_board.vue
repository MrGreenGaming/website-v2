<template>
  <v-container class="mx-0 px-0" fluid style="min-height:800px">
    <h1>Leaderboards - {{ currentBoard }}</h1>
    <h3>Leaderboards are refreshed every hour.</h3>
    <div v-html="boardSubtitle[currentMode]" />
    <b v-if="currentMode === 'donations' && $auth.state.loggedIn">
      <a :href="$auth.$state.user.profileUrl+'edit/#core_pfield_30'" target="_blank">Opt-in/out of this list? Click Here.</a>
    </b>
    <br>
    <v-btn dark class="mx-0" @click="goBack()">
      Back
    </v-btn>
    <v-layout wrap class="pt-4">
      <v-flex xs12 class="px-2 mb-3">
        <v-card>
          <v-toolbar
            flat
            color="primary"
            dark
            dense
            class="slim-toolbar-padding"
          >
            <v-toolbar-title class="title ml-2">
              {{ currentBoard }}
            </v-toolbar-title>
            <v-spacer />
          </v-toolbar>

          <v-container fluid>
            <v-list v-if="typeof leaderboard === 'object' && Object.keys(leaderboard).length > 0">
              <v-flex v-for="rank in leaderboard" :key="rank.rank">
                <v-list-tile @click="">
                  <span
                    class="font-size-bold mr-3"
                    style="width:30px;"
                  >{{ rank.rank }}.</span>
                  <v-list-tile-content class="font-weight-bold">
                    <no-ssr>
                      <a
                        v-if="currentMode !== 'donations'"
                        style="text-decoration: none; max-width:200px; overflow: hidden; text-overflow: ellipsis;"
                        :href="rank.profileUrl"
                        target="_blank"
                        v-html="rank.formattedName || rank.name || rank.forumid"
                      />
                      <a
                        v-else
                        style="text-decoration: none; max-width:200px; overflow: hidden; text-overflow: ellipsis;"
                        :href="rank.profileUrl"
                        target="_blank"
                        v-html="rank.formattedName || rank.name || 'Anonymous'"
                      />
                    </no-ssr>
                  </v-list-tile-content>
                  <v-list-tile-content
                    style="text-align:right; align-items: flex-end!important;"
                    class="align-end"
                  >
                    <no-ssr> {{ getPointsString(rank.points) }} </no-ssr>
                  </v-list-tile-content>
                </v-list-tile>
                <v-divider />
              </v-flex>
            </v-list>

            <!-- If empty or loading -->
            <v-list v-else>
              <v-flex v-for="rank in 100" :key="rank">
                <v-list-tile @click="">
                  <span
                    class="font-size-bold mr-3"
                    style="width:30px;"
                  >{{ rank }}.</span>
                </v-list-tile>
                <v-divider />
              </v-flex>
            </v-list>
          </v-container>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
export default {
  scrollToTop: true,
  watchQuery: ['board'],
  data() {
    return {
      leaderboard: [],
      currentBoard: '',
      currentMode: '',
      boardNames: {
        total: 'Top Overall Players',
        race: 'Top Race Players',
        nts: 'Top NTS Players',
        dd: 'Top DD Players',
        sh: 'Top SH Players',
        dl: 'Top DL Players',
        rtf: 'Top RTF Players',
        greencoins: 'Top GreenCoins hoarders',
        donations: 'Top Donators'
      },
      pointNames: {
        total: 'points',
        race: 'points',
        nts: 'points',
        dd: 'kills',
        sh: 'kills',
        dl: 'kills',
        rtf: 'points',
        greencoins: 'GC',
        donations: '€'
      },
      boardSubtitle: {
        total: `Rankings are calculated by setting toptimes. Each toptime rank rewards different amounts of points. <br> 
              <b>Top 1: </b> 10 points - <b>Top 2: </b> 9 points - <b>Top 3: </b> 8 points - <b>Top 4: </b> 7 points - <b>Top 5: </b> 6 points - 
              <b>Top 6: </b> 5 points - <b>Top 7: </b> 4 points - <b>Top 8: </b> 3 points - <b>Top 9: </b> 2 points - <b>Top 10: </b> 1 point`,
        race: `Rankings are calculated by setting toptimes. Each toptime rank rewards different amounts of points. <br> 
              <b>Top 1: </b> 10 points - <b>Top 2: </b> 9 points - <b>Top 3: </b> 8 points - <b>Top 4: </b> 7 points - <b>Top 5: </b> 6 points - 
              <b>Top 6: </b> 5 points - <b>Top 7: </b> 4 points - <b>Top 8: </b> 3 points - <b>Top 9: </b> 2 points - <b>Top 10: </b> 1 point`,
        nts: `Rankings are calculated by setting toptimes. Each toptime rank rewards different amounts of points. <br> 
              <b>Top 1: </b> 10 points - <b>Top 2: </b> 9 points - <b>Top 3: </b> 8 points - <b>Top 4: </b> 7 points - <b>Top 5: </b> 6 points - 
              <b>Top 6: </b> 5 points - <b>Top 7: </b> 4 points - <b>Top 8: </b> 3 points - <b>Top 9: </b> 2 points - <b>Top 10: </b> 1 point`,
        dd: `Rankings are calculated by setting toptimes. Every <b>kill</b> from a <b>top 10</b> to <b>top 1</b> will be added together and counted as points.`,
        sh: `Rankings are calculated by setting toptimes. Every <b>kill</b> from a <b>top 10</b> to <b>top 1</b> will be added together and counted as points.`,
        dl: `Rankings are calculated by setting toptimes. Every <b>kill</b> from a <b>top 10</b> to <b>top 1</b> will be added together and counted as points.`,
        rtf: `Rankings are calculated by setting toptimes. Each toptime rank rewards different amounts of points. <br> 
              <b>Top 1: </b> 10 points - <b>Top 2: </b> 9 points - <b>Top 3: </b> 8 points - <b>Top 4: </b> 7 points - <b>Top 5: </b> 6 points - 
              <b>Top 6: </b> 5 points - <b>Top 7: </b> 4 points - <b>Top 8: </b> 3 points - <b>Top 9: </b> 2 points - <b>Top 10: </b> 1 point`,
        greencoins: 'Top GreenCoins Hoarders',
        donations: 'Top donators. Thank you for supporting Mr. Green Gaming!'
      },
      isLoading: true
    }
  },
  watch: {
    $route(to, from) {
      // react to route changes...
    }
  },
  asyncData() {
    // http://localhost:3000/api/web/getleaderboardstop/?amount=5&racemode=nts&racemode=race&racemode=dd&racemode=dl&racemode=sh&racemode=rtf&racemode=total
  },

  created() {},
  mounted() {
    const _board = this.$route.params.board
    this.checkAllowedQuery(_board)
    this.getRankings()
  },
  methods: {
    async getRankings() {
      let ranking
      const board = this.$route.params.board
      try {
        ranking = await this.$axios.$get(
          '/api/web/getleaderboardstop/?amount=1005&racemode=' + board
        )
      } catch (err) {
        console.error(err)
        ranking = false
        return
      }

      this.leaderboard = ranking[Object.keys(ranking)[0]]
      this.currentBoard = this.boardNames[Object.keys(ranking)[0]]
    },
    goBack() {
      this.$router.push('/mta/leaderboards/')
    },
    checkAllowedQuery(q) {
      if (!this.boardNames[q]) {
        this.$router.push('/mta/leaderboards/')
      } else {
        this.currentBoard = this.boardNames[q]
        this.currentMode = q
      }
    },
    getPointsString(points) {
      if (this.currentMode === 'donations') {
        const formatter = new Intl.NumberFormat('en-UK', {
          style: 'currency',
          currency: 'EUR'
        })
        return formatter.format(points)
      } else {
        const formattedPoints = new Intl.NumberFormat('en-UK', { maximumSignificantDigits: 3 }).format(points)
        return `${formattedPoints} ${this.pointNames[this.currentMode]}`
      }
    }
  }
}
</script>
