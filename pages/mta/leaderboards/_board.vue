<template>
  <v-container class="mx-0 px-0" fluid style="min-height:800px">
    <h1>Leaderboards - {{ currentBoard }}</h1>
    <h3>Leaderboards are refreshed every 2 hours.</h3>
    Rankings are calculated by setting a <b>top 10</b> to <b>top 1</b>. <br>
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
                <v-list-tile @click="true">
                  <span
                    class="font-size-bold mr-3"
                    style="width:30px;"
                  >{{ rank.rank }}.</span>
                  <v-list-tile-content class="font-weight-bold">
                    <no-ssr>
                      <a
                        style="text-decoration: none; max-width:200px; overflow: hidden; text-overflow: ellipsis;"
                        :href="rank.profileUrl"
                        target="_blank"
                        v-html="rank.formattedName || rank.name || rank.forumid"
                      />
                    </no-ssr>
                  </v-list-tile-content>
                  <v-list-tile-content
                    style="text-align:right; align-items: flex-end!important;"
                    class="align-end"
                  >
                    <no-ssr> {{ rank.points }} points </no-ssr>
                  </v-list-tile-content>
                </v-list-tile>
                <v-divider />
              </v-flex>
            </v-list>

            <!-- If empty or loading -->
            <v-list v-else>
              <v-flex v-for="rank in 100" :key="rank">
                <v-list-tile @click="true">
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
        rtf: 'Top RTF Players'
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
    }
  }
}
</script>
