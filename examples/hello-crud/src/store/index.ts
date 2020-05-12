import Vue from 'vue';
import Vuex from 'vuex';
import { IApiRouteConfig, register } from 'vuex-class-crud';

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {},
  mutations: {},
  actions: {},
  modules: {},
});

const apiRoutes: IApiRouteConfig = {
  config: {
    prefix: 'api',
    location: 'https://api.tvmaze.com',
  },
  routes: {
    shows: {
      api: '/search/shows',
      initial: {},
    },
    show: {
      api: '/shows/{id}',
      initial: {},
    },
  },
};
register(store, apiRoutes);

export default store;
