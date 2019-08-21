<template>
  <v-container class="mx-0 px-0" fluid>
    <h1>Leaderboards</h1>
    <h3>Leaderboards are refreshed every hour.</h3>
    <v-layout wrap class="pt-4">
      <v-flex v-for="leaderboard in leaderboards" :key="leaderboard.name" xs12 sm6 class="px-2 mb-3">
        <v-card>
          <v-toolbar flat color="primary" dark dense class="slim-toolbar-padding">
            <v-toolbar-title class="title ml-2">
              {{ leaderboard.name }}
            </v-toolbar-title>
            <v-spacer />
          </v-toolbar>

          <v-container fluid>
            <div style="min-height:50px;">
              <div v-html="leaderboard.subtext" />
              <b v-if="leaderboard.modeName === 'donations' && $auth.state.loggedIn">
                <a :href="$auth.$state.user.profileUrl+'edit/#core_pfield_30'" target="_blank">Opt-in/out of this list? Click Here.</a>
              </b>
            </div>

            <v-divider />
            <!-- <no-ssr> -->
            <v-list>
              <v-list-tile v-for="rank in leaderBoardRankings[leaderboard.modeName]" :key="rank.rank" @click="">
                <span class="font-size-bold" style="width:30px;">{{ rank.rank }}.</span>
                <v-list-tile-content class="font-weight-bold">
                  <no-ssr>
                    <a v-if="leaderboard.modeName !== 'donations'" style="text-decoration: none; max-width:200px; overflow: hidden; text-overflow: ellipsis;" :href="rank.profileUrl" target="_blank" v-html="rank.formattedName || rank.name || rank.forumid" />
                    <a v-if="leaderboard.modeName === 'donations'" style="text-decoration: none; max-width:200px; overflow: hidden; text-overflow: ellipsis;" :href="rank.profileUrl" target="_blank" v-html="rank.formattedName || rank.name || 'Anonymous'" />
                  </no-ssr>
                </v-list-tile-content>
                <v-list-tile-content class="align-end">
                  {{ rank.value }}
                </v-list-tile-content>
              </v-list-tile>
            </v-list>
            <v-btn dark @click="goToBoard(leaderboard.queryName)">
              Show All
            </v-btn>
            <!-- </no-ssr> -->
          </v-container>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
export default {
  head() {
    return {
      title: 'Leaderboards - Mr. Green Gaming'
    }
  },
  data() {
    return {
      error: false,
      content: false,
      leaderBoardRankings: false,
      leaderboards: [
        // {
        //   name: 'Top Overall Players',
        //   modeName: 'total',
        //   subtext:
        // 		'Overall best players. ',
        //   queryName: 'total',
        //   content: [
        //     {
        //       rank: 1,
        //       name: 'KaliBwoyKaliBwoyKaliBwoyKaliBwoyKaliBwoy',
        //       value: '703 Tops'
        //     },
        //     { rank: 2, name: 'Cena', value: '680 Tops' },
        //     { rank: 3, name: 'Stig', value: '310 Tops' },
        //     { rank: 4, name: 'Abrahax', value: '205 Tops' },
        //     { rank: 5, name: 'Jack123', value: '120 Tops' }
        //   ]
        // },
        {
          name: 'Top Donators',
          modeName: 'donations',
          subtext:
						'Top donators. Thank you for your support!',
          queryName: 'donations',
          content: []
        },
        {
          name: 'Top GreenCoins Hoarders',
          modeName: 'greencoins',
          subtext:
						'These are the players that hoarded the most GreenCoins.',
          queryName: 'greencoins',
          content: []
        },
        {
          name: 'Top Race Players',
          modeName: 'race',
          subtext:
						'Best Race players. ',
          queryName: 'race',
          content: []
        },
        {
          name: 'Top NTS Players',
          modeName: 'nts',
          subtext:
						'Best Never The Same players. ',
          queryName: 'nts',
          content: []
        },
        {
          name: 'Top DD Players',
          modeName: 'dd',
          subtext:
						'Best Destruction Derby players. ',
          queryName: 'dd',
          content: []
        },
        {
          name: 'Top SH Players',
          modeName: 'sh',
          subtext:
						'Best Shooter players. ',
          queryName: 'sh',
          content: []
        },
        {
          name: 'Top DL Players',
          modeName: 'dl',
          subtext:
						'Best DeadLine players. ',
          queryName: 'dl',
          content: []
        },
        {
          name: 'Top RTF Players',
          modeName: 'rtf',
          subtext:
						'Best Reach The Flag players. ',
          queryName: 'rtf',
          content: []
        }
        // {
        // 	name: "Top CTF Players",
        // 	modeName: "ctf",
        // 	subtext:
        // 		"Best Capture The Flag players. Rankings are calculated by the amount of flags delivered.",
        // 	queryName: "",
        // 	content: [
        // 		{ rank: 1, name: "KaliBwoy", value: "800 Flags" },
        // 		{ rank: 2, name: "Cena", value: "750 Flags" },
        // 		{ rank: 3, name: "Stig", value: "742 Flags" },
        // 		{ rank: 4, name: "Abrahax", value: "565 Flags" },
        // 		{ rank: 5, name: "Jack123", value: "265 Flags" }
        // 	]
        // }
      ]
    }
  },
  async asyncData({ $axios }) {
    // Local/live change
    // return $axios
    //   .$get('/api/web/getleaderboardstop/?amount=5&racemode=nts&racemode=race&racemode=dd&racemode=dl&racemode=sh&racemode=rtf&racemode=total')
    //   .then((res) => {
    //     return { leaderBoardRankings: res }
    //   })
    //   .catch((e) => {
    //     console.log('Leaderboards asyncData Error:', e.config.url, e.response.status)
    //     // console.log('Leaderboards asyncData Error', e.response.status)
    //     return { leaderBoardRankings: [] }
    //   })
    let theData
    try {
      theData = await $axios.$get('/api/web/getleaderboardstop/?amount=5&racemode=nts&racemode=race&racemode=dd&racemode=dl&racemode=sh&racemode=rtf&racemode=donations&racemode=greencoins')
    } catch (e) {
      console.log('Leaderboards asyncData Error:', e.config.url, e.response.status)
      return { leaderBoardRankings: [] }
    }
    return { leaderBoardRankings: theData }
  },
  mounted() {
    this.getLeaderboardsData()
  },
  methods: {
    async getLeaderboardsData() {
      // This method is now in asyncData
      await this.$axios
        .$get('/api/web/getleaderboardstop/?amount=5&racemode=nts&racemode=race&racemode=dd&racemode=dl&racemode=sh&racemode=rtf&racemode=donations&racemode=greencoins')
        .catch((err) => {
          console.error(err)
        }).then((res) => {
          this.leaderBoardRankings = res
        })
    },
    goToBoard(query) {
      this.$router.push('/mta/leaderboards/' + query)
    }
  }
}
</script>
