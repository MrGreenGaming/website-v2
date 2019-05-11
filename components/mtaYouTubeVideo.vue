<template>
  <v-card elevation-10 class="videoWrapper">
    <!-- <video width="100%" height="100%" autoplay muted loop>
      <source :src="require('../assets/video/mrgreenIntroVideo.mp4')" type="video/mp4">
    </video> -->
    <iframe
      :src="'https://www.youtube-nocookie.com/embed/'+$props.videoid+'?rel=0&amp;showinfo=0&amp;start=39&amp;autoplay=1&amp;mute=1'"
      frameborder="0"
      class="videoEmbed"
      allow="autoplay; encrypted-media"
      allowfullscreen
    />
  </v-card>
</template>

<script>
export default {
  props: {
    videoid: {
      type: String,
      default: 'Z-Fw0Ou6u7A'
    }
  },
  data() {
    return {}
  }
}
</script>
<style scoped>
.videoWrapper {
	position: relative;
	width: 100%;
	height: 0;
	padding-bottom: 56.25%;
}
.videoEmbed {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
}
</style>
