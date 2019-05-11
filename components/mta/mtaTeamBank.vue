<template>
  <v-layout column>
    <v-card class="mb-3">
      <v-toolbar flat color="primary" dark dense class="slim-toolbar-padding">
        <v-toolbar-title class="subheading ml-0">
          Team Bank
        </v-toolbar-title>
      </v-toolbar>
      <v-container fluid class="pb-1">
        <h2 class="font-weight-bold primary--text">
          Team GC: 5036 GC
        </h2>

        <v-dialog v-model="teamBankDepositDialog" max-width="600px">
          <v-btn slot="activator" style="height:40px;" class="subheading mx-0" color="primary" dark>
            Deposit GC
          </v-btn>
          <v-card>
            <v-card-title>
              <span class="headline">Team Bank Deposit</span>
            </v-card-title>
            <v-card-text>
              <v-container fluid class="px-2 py-0">
                <v-layout column>
                  <span class="subheading font-weight-bold mb-1 primary--text">Current GC: 14500 GC</span>
                  <span class="subheading font-weight-bold mb-3 primary--text">Team GC: 5000 GC</span>
                  <v-text-field
                    label="GreenCoins Amount"
                    type="number"
                    outline
                  />
                  <span class="font-weight-bold">GC deposits are not refundable, be sure you want to deposit and double check the amount.</span>
                </v-layout>
              </v-container>
            </v-card-text>
            <v-card-actions class="px-3">
              <v-btn dark color="primary" @click="teamBankDepositDialog = false">
                Deposit into bank
              </v-btn>
              <v-spacer />
              <v-btn color="primary darken-1" flat @click="teamBankDepositDialog = false">
                Cancel
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-card flat>
          <v-card-title>
            <!-- <v-spacer></v-spacer> -->
            <v-text-field
              v-model="search"
              append-icon="search"
              label="Search Transaction"
              single-line
              hide-details
            />
          </v-card-title>
          <v-data-table
            :headers="headers"
            :items="actions"
            :search="search"
            :disable-initial-sort="true"
          >
            <template slot="items" slot-scope="props">
              <td class="font-weight-bold">
                {{ props.item.source }}
              </td>
              <td class="">
                {{ props.item.action }}
              </td>
              <td :class="getColorFromNumber(props.item.amount)+'--text font-weight-bold'">
                {{ props.item.amount }}
              </td>
              <td class="">
                {{ props.item.date }}
              </td>
            </template>
            <v-alert slot="no-results" :value="true" color="error" icon="warning">
              Your search for "{{ search }}" found no results.
            </v-alert>
          </v-data-table>
        </v-card>
      </v-container>
    </v-card>
  </v-layout>
</template>

<script>
export default {
  data() {
    return {
      teamBankDepositDialog: false,
      search: '',
      headers: [
        { text: 'Source', align: 'left', value: 'name', sortable: false },
        { text: 'Action', value: 'action', sortable: false },
        { text: 'GC Amount', value: 'amount', sortable: false },
        { text: 'Date', value: 'date', sortable: false }
      ],
      actions: [
        { source: 'KaliBwoy', action: 'Deposit', amount: 1000, date: '2-1-2019' },
        { source: 'Auto-Renew', action: 'Team Renewal', amount: -5000, date: '5-1-2019' },
        { source: 'Cena', action: 'Deposit', amount: 1000, date: '10-1-2019' },
        { source: 'Stig', action: 'Deposit', amount: 100, date: '11-1-2019' },
        { source: 'KaliBwoy', action: 'Deposit', amount: 50, date: '11-1-2019' },
        { source: 'Stig', action: 'Deposit', amount: 6000, date: '20-1-2019' }
      ]
    }
  },
  methods: {
    unixToDate: function (stamp) {
      if (stamp) {
        const date = new Date(stamp * 1000)
        return date.toLocaleDateString()
      } else {
        return ''
      }
    },
    getColorFromNumber: function (num) {
      if (num < 0) {
        return 'red'
      } else {
        return 'green'
      }
    }
  }
}
</script>
