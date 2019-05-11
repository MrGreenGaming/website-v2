<template>
  <div class="pt-4" style="min-height:800px;">
    <h1 class="mb-3">
      MTA Toptimes
    </h1>
    <v-card class="mb-3">
      <v-toolbar flat color="primary" dark dense class="slim-toolbar-padding">
        <v-icon>format_list_numbered</v-icon>
        <v-toolbar-title class="subheading ml-2">
          Top Times
        </v-toolbar-title>
      </v-toolbar>

      <v-container column fluid>
        <v-flex class="mb-3">
          <v-btn dark class="mx-0" color="primary" to="/mta/toptimes/player" active-class="tops-active-btn">
            Player Tops
          </v-btn>
          <v-btn dark color="primary" to="/mta/toptimes/map" active-class="tops-active-btn">
            Map Tops
          </v-btn>
        </v-flex>
        <v-divider class="mb-3" />
        <v-flex>
          <nuxt-child />
          <!--<router-view/> -->
        </v-flex>
      </v-container>
    </v-card>
  </div>
</template>

<script>
export default {
  head() {
    return {
      title: 'Top Times - Mr. Green Gaming'
    }
  },
  data() {
    return {
      search: '',
      headers: [
        {
          text: 'From/To',
          align: 'left',
          sortable: false,
          value: 'fromto'
        },
        { text: 'Name', value: 'name', align: 'left', width: '200px' },
        { text: 'GC Amount', value: 'amount', align: 'left' },
        { text: 'Date', value: 'date', align: 'left', width: '150px' },
        { text: 'Message', value: 'message', align: 'left' }
      ],
      transactions: [
        {
          name: 'Dubby',
          fromto: 'FROM',
          amount: 560,
          date: '14-1-2019',
          message: 'Lorem ipsum dolor sit amet.'
        },
        {
          name: 'Mihoje',
          fromto: 'FROM',
          amount: 10,
          date: '13-1-2019',
          message:
						'Lorem ipsum dolor sit amet. Lorem ipsum dolor sitLorem ipsum dolor sit amet. Lorem ipsum dolor sitae'
        }
      ]
    }
  },
  methods: {
    getColorFromString: function (str) {
      if (str === 'TO') {
        return 'red'
      } else {
        return 'green'
      }
    }
  }
}
</script>

<style scoped>
.tops-active-btn {
	background: black !important;
}
</style>
