<template>
  <div class="home">
    <HelloCrudWorld msg="Welcome to vuex-class-crud App"/>
  </div>
</template>

<script>
  // @ is an alias to /src
  import HelloCrudWorld from '@/components/HelloCrudWorld.vue'

  export default {
    name: 'Home',
    components: {
      HelloCrudWorld,
    },
  }
</script>
