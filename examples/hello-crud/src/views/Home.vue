<template>
  <div class="home">
    <HelloCrudWorld msg="Welcome to Your Vue.js App" />
  </div>
</template>

<script>
// @ is an alias to /src
import HelloCrudWorld from '@/components/HelloCrudWorld.vue';

export default {
  name: 'Home',
  components: {
     HelloCrudWorld,
  },
};
</script>
