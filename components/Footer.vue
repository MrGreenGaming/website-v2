<template>
  <v-footer dark height="auto">
    <v-card class="flex" flat tile>
      <v-card-actions class="primary justify-center">
        <span>
          &copy;{{ new Date().getFullYear() }} —
          <strong>MrGreenGaming.com</strong>
        </span>
      </v-card-actions>
    </v-card>
  </v-footer>
</template>

<script>
export default {
  data: () => ({})
}
</script>
