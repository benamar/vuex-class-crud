import Vue from 'vue';
import Vuex from 'vuex';
import { IApiRouteConfig, IObject, register } from '../../../../dist';

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
    hooks: {
      afterRequest: (response: IObject) => {
        console.log('*********** received ***', response);
      },
    },
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
    walterWhite: {
      api: 'https://www.breakingbadapi.com/api/characters/1',
      initial: {},
      fetchFormat: (body: IObject) => body[0],
    },
  },
};
register(store, apiRoutes);

export default store;
