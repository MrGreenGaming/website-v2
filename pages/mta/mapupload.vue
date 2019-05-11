<template>
  <div class="py-3">
    <h1>Map Upload</h1>
    <mapUpload />
    <mapLog />
  </div>
</template>

<script>
import mapLog from '@/components/mta/mtaMapsLog'
import mapUpload from '@/components/mta/mtaMapsUpload'
export default {
  components: {
    mapLog,
    mapUpload
  },
  head() {
    return {
      title: 'Map Upload - Mr. Green Gaming'
    }
  },
  data() {
    return {}
  },
  computed: {
    computedHeaders() {
      return this.headers.filter(
        h => !h.hide || !this.$vuetify.breakpoint[h.hide]
      )
    }
  },
  methods: {}
}
</script>

<style scoped>
.tops-active-btn {
	background: black !important;
}
</style>
