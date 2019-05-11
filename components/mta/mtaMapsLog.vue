<template>
  <div column wrap class="mt-3">
    <v-card class="mb-3">
      <v-toolbar flat color="primary" dark dense class="slim-toolbar-padding">
        <v-icon>folder</v-icon>
        <v-toolbar-title class="subheading ml-2">
          Uploaded Maps Log
        </v-toolbar-title>
      </v-toolbar>

      <v-container column fluid>
        <v-card flat>
          <!-- <v-card-title>
              <v-layout wrap>
                <v-flex class="xs12 sm12 mb-3" align-center justify-center>
                  <v-layout align-center justify-center wrap>
                    <v-chip color="primary" dark>
                      <v-avatar class="mr-0">
                        <v-icon>check_circle</v-icon>
                      </v-avatar><b class="mr-1">5809</b> Maps Uploaded
                    </v-chip>
                    <v-chip color="red" dark>
                      <v-avatar class="mr-0">
                        <v-icon>delete_forever</v-icon>
                      </v-avatar><b class="mr-1">9595</b> Maps Deleted
                    </v-chip>
                    <v-chip color="blue" dark>
                      <v-avatar class="mr-0">
                        <v-icon>fiber_new</v-icon>
                      </v-avatar><b class="mr-1">200</b> Maps Waiting
                    </v-chip>
                  </v-layout>
                </v-flex>

                <v-flex class="xs12 sm12">
                  <v-text-field
                    v-model="search"
                    append-icon="search"
                    label="Search"
                    single-line
                    hide-details
                  />
                </v-flex>
              </v-layout>
            </v-card-title> -->
          <no-ssr>
            <!-- <div class="text-xs-center pt-2" style="width:100%; overflow-x:hidden;">
              <v-pagination v-model="pagination.page" :total-visible="$vuetify.breakpoint.xs ? 3 : 5" :length="mapLogTotalItems" @input="onPageChange" />
            </div> -->
            <v-data-table
              :headers="computedHeaders"
              :items="mapLog"
              :rows-per-page-items="mapsRowsPerPageItem"
            >
              <!-- :custom-filter="customFilter" -->
              <template slot="items" slot-scope="props">
                <td v-if="!$vuetify.breakpoint.smAndDown">
                  {{ props.item.uploadid }}
                </td>
                <td>
                  <v-layout column>
                    <span class="font-weight-bold body-1">{{ props.item.resname }}</span>
                    <v-layout class="caption" row>
                      <span class="">{{ getBetterDate(props.item.date) }}</span>
                      <span v-if="props.item.uploadername" class="mx-1"> - Uploader: <a class="font-weight-bold">{{ props.item.uploadername }}</a></span>
                    </v-layout>
                  </v-layout>
                </td>
                <td>
                  <v-layout v-if="props.item.status == 'Accepted'" column>
                    <v-layout row align-center>
                      <v-tooltip top>
                        <v-icon slot="activator" size="35" color="green" class="mr-2">
                          check_circle
                        </v-icon>
                        <span> Accepted</span>
                      </v-tooltip>
                      <v-layout justify-center column class="my-1 hidden-sm-and-down">
                        <span v-if="props.item.comment" class="caption mb-1 font-italic">"{{ props.item.comment }}"</span>
                        <span v-if="props.item.manager">Accepted by: <a class="font-weight-bold">{{ props.item.manager }}</a></span>
                      </v-layout>
                    </v-layout>
                  </v-layout>

                  <v-layout v-if="props.item.status == 'Declined'" column>
                    <v-layout row align-center>
                      <v-tooltip top>
                        <v-icon slot="activator" size="35" color="red" class="mr-2">
                          cancel
                        </v-icon>
                        <span>Declined</span>
                      </v-tooltip>
                      <v-layout justify-center column class="my-1 hidden-sm-and-down">
                        <span v-if="props.item.comment" class="caption mb-1 font-italic">"{{ props.item.comment }}"</span>
                        <span v-if="props.item.manager">Declined by: <a class="font-weight-bold">{{ props.item.manager }}</a></span>
                      </v-layout>
                    </v-layout>
                  </v-layout>

                  <v-layout v-if="props.item.status == 'Deleted'" column>
                    <v-layout row align-center>
                      <v-tooltip top>
                        <v-icon slot="activator" size="35" color="red" class="mr-2">
                          delete_forever
                        </v-icon>
                        <span>Deleted</span>
                      </v-tooltip>
                      <v-layout justify-center column class="my-1 hidden-sm-and-down">
                        <span v-if="props.item.comment" class="caption mb-1 font-italic">"{{ props.item.comment }}"</span>
                        <span v-if="props.item.manager">Deleted by: <a class="font-weight-bold">{{ props.item.manager }}</a></span>
                      </v-layout>
                    </v-layout>
                  </v-layout>

                  <v-layout v-if="props.item.status == 'Update'" column>
                    <v-layout row align-center>
                      <v-tooltip top>
                        <v-icon slot="activator" size="35" color="blue" class="mr-2">
                          update
                        </v-icon>
                        <span>Updated</span>
                      </v-tooltip>
                      <v-layout justify-center column class="my-1 hidden-sm-and-down">
                        <span v-if="props.item.comment" class="caption mb-1 font-italic">"{{ props.item.comment }}"</span>
                        <span v-if="props.item.uploadername">Author: <a class="font-weight-bold">{{ props.item.uploadername }}</a></span>
                      </v-layout>
                    </v-layout>
                  </v-layout>

                  <v-layout v-if="props.item.status == 'Restored'" column>
                    <v-layout row align-center>
                      <v-tooltip top>
                        <v-icon slot="activator" size="35" color="orange" class="mr-2">
                          settings_backup_restore
                        </v-icon>
                        <span>Restored</span>
                      </v-tooltip>
                      <v-layout justify-center column class="my-1 hidden-sm-and-down">
                        <span v-if="props.item.manager">Restored by: <a class="font-weight-bold">{{ props.item.manager }}</a></span>
                      </v-layout>
                    </v-layout>
                  </v-layout>

                  <v-layout v-if="props.item.status == 'New'" column>
                    <v-layout row align-center>
                      <v-tooltip top>
                        <v-icon slot="activator" color="primary" size="35" class="mr-2">
                          fiber_new
                        </v-icon>
                        <span>New</span>
                      </v-tooltip>
                      <v-layout justify-center column class="my-1 hidden-sm-and-down">
                        <span v-if="props.item.comment" class="caption mb-1 font-italic">"{{ props.item.comment }}"</span>
                        <span v-if="props.item.uploadername">Uploaded by: <a class="font-weight-bold">{{ props.item.uploadername }}</a></span>
                      </v-layout>
                    </v-layout>
                  </v-layout>
                </td>
              </template>
              <v-alert slot="no-results" :value="true" color="error" icon="warning">
                Your search for "{{ search }}" found no results.
              </v-alert>
            </v-data-table>
            <!-- <div class="text-xs-center pt-2" style="width:100%; overflow-x:hidden;">
              <v-pagination v-model="pagination.page" :total-visible="$vuetify.breakpoint.xs ? 3 : 5" :length="mapLogTotalItems" @input="onPageChange" />
            </div> -->
          </no-ssr>
        </v-card>
      </v-container>
    </v-card>
  </div>
</template>

<script>

export default {
  data() {
    return {
      mapsRowsPerPageItem: [100],
      pagination: {
        page: 1,
        rowsPerPage: 50,
        totalItems: 0
      },
      search: '',
      headers: [
        {
          text: '#',
          value: 'id',
          width: '30px',
          sortable: false,
          hide: 'smAndDown'
        },
        { text: 'Map', value: 'name', width: '450px', sortable: false },
        { text: 'Status', value: 'status', sortable: false }
      ],
      mapLog: [
        // {
        // 	id: 10004,
        // 	mapName: "sh-time-machine",
        // 	uploadername: "Zullolo",
        // 	date: "2019-02-11",
        // 	status: "Restored",
        // 	manager: "michael",
        // 	comment: ""
        // },
      ],
      mapLogCache: [],
      mapLogTotalItems: 0
    }
  },
  computed: {
    computedHeaders() {
      return this.headers.filter(
        h => !h.hide || !this.$vuetify.breakpoint[h.hide]
      )
    }
  },

  mounted() {
    this.getMapLog(1)
  },
  methods: {
    async onPageChange(page) {
      await this.getMapLog(page)
    },
    getBetterDate(date) {
      const dateObj = new Date(date)
      return dateObj.toLocaleDateString() || ''
    },
    async getMapLog(page) {
      let mapLog
      try {
        mapLog = await this.$axios.$get('/api/web/getmaplog/?page=' + page)
      } catch (err) {
        // console.log(err);
      }

      // Used with server side pagination, not implemented yet
      // if (mapLog && mapLog.items && mapLog.total) {
      //   const theMapLog = mapLog.items
      //   const totalItems = mapLog.total
      //   this.mapLog = theMapLog
      //   this.mapLogTotalItems = totalItems
      // }

      if (mapLog) {
        this.mapLog = mapLog
      }
    },
    // TODO: Implement actual searching trough this big array
    customFilter(items, search, filter) {
      if (search.trim() === '') return items
      search = search.toString().toLowerCase()

      return items.filter(function (row) {
        if (row.resname.toLowerCase().includes(search)) {
          return true
        }
        if (row.uploadername.toLowerCase().includes(search)) {
          return true
        }
        if (row.manager.toLowerCase().includes(search)) {
          return true
        }
        return false
      })
    }
  }
}
</script>

<style scoped>
.tops-active-btn {
	background: black !important;
}
</style>
