<template>
  <v-card>
    <v-toolbar flat color="primary" dark dense class="slim-toolbar-padding">
      <v-icon>history</v-icon>
      <v-toolbar-title class="subheading ml-2">
        GreenCoins Transfer History
      </v-toolbar-title>
    </v-toolbar>

    <v-container fluid>
      <v-text-field
        v-model="search"
        append-icon="search"
        label="Search"
        single-line
        hide-details
        class="mb-3"
      />

      <v-data-table
        :headers="headers"
        :items="transactions"
        :search="search"
      >
        <template slot="items" slot-scope="props">
          <td :class="getColorFromString(props.item.fromto)+'--text font-weight-bold'">
            {{ props.item.fromto }}
          </td>
          <td class="font-weight-bold">
            {{ props.item.name }}
          </td>
          <td class="font-weight-bold">
            {{ props.item.amount }}
          </td>
          <td>{{ props.item.date }}</td>
          <td>{{ props.item.message }}</td>
        </template>
        <v-alert slot="no-results" :value="true" color="error" icon="warning">
          Your search for "{{ search }}" found no results.
        </v-alert>
      </v-data-table>
    </v-container>
  </v-card>
</template>

<script>
export default {
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
          message: 'Lorem ipsum dolor sit amet. Lorem ipsum dolor sitLorem ipsum dolor sit amet. Lorem ipsum dolor sitae'
        },
        {
          name: 'Cena',
          fromto: 'TO',
          amount: 5,
          date: '13-1-2019',
          message: 'Lorem ipsum dolor sit amet.'
        },
        {
          name: 'Ywa',
          fromto: 'FROM',
          amount: 800,
          date: '13-1-2019',
          message: 'Lorem ipsum dolor sit amet. Lorem ipsum dolor sitLorem ipsum dolor sit amet. Lorem ipsum dolor sitae.'
        },
        {
          name: 'Santiii733',
          fromto: 'TO',
          amount: 20,
          date: '12-1-2019',
          message: 'Lorem ipsum dolor sit amet.'
        },
        {
          name: 'Cena',
          fromto: 'FROM',
          amount: 500,
          date: '12-1-2019',
          message: 'Lorem ipsum dolor sit amet.'
        },
        {
          name: 'Cena',
          fromto: 'FROM',
          amount: 30,
          date: '12-1-2019',
          message: 'Lorem ipsum dolor sit amet. Lorem ipsum dolor sitLorem ipsum dolor sit amet. Lorem ipsum dolor sitae.'
        },
        {
          name: 'Cena',
          fromto: 'TO',
          amount: 10,
          date: '10-1-2019',
          message: 'Lorem ipsum dolor sit amet. Lorem ipsum dolor sitLorem ipsum dolor sit amet. Lorem ipsum dolor sitae.'
        },
        {
          name: 'Cena',
          fromto: 'TO',
          amount: 70,
          date: '10-1-2019',
          message: 'Lorem ipsum dolor sit amet.'
        },
        {
          name: 'Cena',
          fromto: 'FROM',
          amount: 800,
          date: '10-1-2019',
          message: 'Lot.'
        },
        {
          name: 'Cena',
          fromto: 'TO',
          amount: 888,
          date: '8-1-2019',
          message: 'Lorem ipsum dolor sit amet.'
        },
        {
          name: 'Cena',
          fromto: 'TO',
          amount: 900,
          date: '8-1-2019',
          message: 'Lorem ipsum dolor sit amet. Lorem ipsum dolor sitLorem ipsum dolor sit amet. Lorem ipsum dolor sitae.'
        },
        {
          name: 'Cena',
          fromto: 'FROM',
          amount: 954,
          date: '8-1-2019',
          message: 'Lorem ipsum dolor sit amet.'
        },
        {
          name: 'Cena',
          fromto: 'FROM',
          amount: 560,
          date: '6-1-2019',
          message: 'Lorem ipsum dolor sit amet. Lorem ipsum dolor sitLorem ipsum dolor sit amet. Lorem ipsum dolor sitae.'
        },
        {
          name: 'Cena',
          fromto: 'TO',
          amount: 575,
          date: '5-1-2019',
          message: '.'
        },
        {
          name: 'Cena',
          fromto: 'FROM',
          amount: 605,
          date: '5-1-2019',
          message: '.'
        },
        {
          name: 'Cena',
          fromto: 'FROM',
          amount: 568,
          date: '5-1-2019',
          message: 'Lorem ipsum dolor sit amet.'
        },
        {
          name: 'Cena',
          fromto: 'TO',
          amount: 7544,
          date: '4-1-2019',
          message: '.'
        },
        {
          name: 'Cena',
          fromto: 'TO',
          amount: 8752,
          date: '3-1-2019',
          message: 'Lorem ipsum dolor sit amet.'
        },
        {
          name: 'Cena',
          fromto: 'FROM',
          amount: 560,
          date: '1-1-2019',
          message: 'Lorem ipsum dolor sit amet. Lorem ipsum dolor sitLorem ipsum dolor sit amet. Lorem ipsum dolor sitae.'
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
