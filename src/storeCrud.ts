import { mapActions, mapState, Module, Store } from 'vuex';
import { capitalize, clone, IObject, sleep } from 'ts-utils2';
import Entity from './Entity';
import { IApiRouteConfig } from './IApiRouteConfig';



const methods: string[] = ['fetch', 'create', 'post', 'remove', 'patch', 'put'];

function transform(items: IObject[]) {
  const mapped: IObject = {};
  if (Array.isArray(items)) {
    for (const item of items) {
      mapped[item.id] = item;
    }
    // console.log('transform channels', mapped);
    return mapped;
  }
  return items;
}


export function createCrud(apiConfigRoutes: IApiRouteConfig) {
  const root = false;
  const commitOptions = { root };
  const crudStore: Module<any, any> = {
    namespaced: true,
    state: {$instances: {}}, mutations: {}, actions: {},
  };
  Object.keys(apiConfigRoutes.routes).forEach(name => {
    const cName = capitalize(name);
    const suffixes = [''];
    crudStore.state[name] = apiConfigRoutes.routes[name].initial;

    if (Array.isArray(apiConfigRoutes.routes[name].initial)) {
      crudStore.state['mapped' + cName] = transform(apiConfigRoutes.routes[name].initial);
    }

    for (const suffix of suffixes) {
      if (crudStore.mutations) {
        crudStore.mutations['set' + cName + suffix] = (
          _state: IObject,
          data: IObject | IObject[],
        ) => {
           console.log('store set ', name + suffix, data);
          _state[name + suffix] = data;
          if (Array.isArray(data)) {
            _state['mapped' + cName] = transform(data as IObject[]);
          }
        };

        crudStore.mutations['update' + cName + suffix] = (
          _state: IObject,
          data: IObject,
        ) => {
           console.log('store update ', name + suffix, data);
          if (Array.isArray(data) && Array.isArray(_state[name + suffix])) {
            const currentItems = clone(_state[name + suffix]) as IObject[];
            for (let idx = 0; idx < data.length; idx++) {
              const newData = data[idx];
              let found = false;
              for (let iCurrent = 0; iCurrent < currentItems.length; iCurrent++) {
                const currentItem = currentItems[iCurrent];
                if (currentItem.id + '' === newData.id + '') {
                  currentItems[iCurrent] = { ...currentItem, ...newData };
                  found = true;
                }
              }
              if (!found) {
                currentItems.push(newData);
              }
            }
            _state[name + suffix] = currentItems;
            if (Array.isArray(currentItems)) {
              console.log('change mapped' + cName, transform(currentItems));
              _state['mapped' + cName] = transform(currentItems);
            }
          } else {
            _state[name + suffix] = {
              ..._state[name + suffix],
              ...data,
            };
          }
        };
      }
      if (crudStore.actions) {
        if (suffix) {
          crudStore.state[name + suffix] = false;
        }
        // actions['fetch' + cName + plural] = async ({commit, state}) => {
         // console.log('create action ', "set" + cName + suffix);
        crudStore.actions['set' + cName + suffix] = {
          root,
          handler: async (
            { commit }: any,
            payload: any,
          ) => {
            // console.log('commit', 'set' + cName + suffix, payload);
            commit('set' + cName + suffix, payload, commitOptions);
            return payload;
          },
        };

        crudStore.actions['update' + cName + suffix] = {
          root,
          handler: async (
            { commit }: any,
            payload: any,
          ) => {
            // console.log('commit', 'update' + cName + suffix, payload);
            commit('update' + cName + suffix, payload, commitOptions);
            return payload;
          },
        };
      }
    }

    if (apiConfigRoutes.routes[name].api) {
      for (const method of methods) {
        if (crudStore.actions) {
          crudStore.actions[method + cName] = {
            root,
            handler: async function(
              store: any,
              data: any,
            ) {
              console.log('vuex action', name, method, 'auth', store.auth);
              let token: string = await apiConfigRoutes.authToken(store);
              if (token) {
                store.state.$instances[name].setAccessToken(token);
                // @ts-ignore
                const result = await store.state.$instances[name][method](data);
                // if (commit) {
                console.log('vuex action', name, method, result);
                // }
                return result;
              }
            },
          };
        }
      }
    }
  });

  console.log('->state:', crudStore.state);
  console.log('->mutations:', crudStore.mutations);
  console.log('->actions:', crudStore.actions);
  return crudStore;
}// store.registerModule('crudStore', crudStore);
export function mapStore(apiConfigRoutes: IApiRouteConfig, store: any, moduleName : string) {
  const state: { [id: string]: any } = {};
  const actions: { [id: string]: any } = {};

  Object.keys(apiConfigRoutes.routes).forEach(name => {
    const cName = capitalize(name);
    store.state[moduleName].$instances[name] = new Entity(apiConfigRoutes, store, name);
    state[name] = mapState([name, name + 'Errors', name + 'Success']);
    store.state[moduleName].$instances[name].state = store.state;
    actions[name] = mapActions([
      'set' + cName,
      'fetch' + cName,
      'create' + cName,
      'post' + cName,
      'put' + cName,
      'patch' + cName,
      'remove' + cName,
    ]);
  });

  return { state, actions };
}


export function register(store: Store<any>, apiConfigRoutes: IApiRouteConfig, moduleName = 'crud') {
  const crud = createCrud(apiConfigRoutes);
  console.log('register crud', crud);
  store.registerModule(moduleName, crud);
  const {state, actions} = mapStore(apiConfigRoutes, store, moduleName );
  console.log('component computed actions', actions);
  console.log('component computed state', state);
  return { state, actions };
}
