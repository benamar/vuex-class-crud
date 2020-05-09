import axios, {AxiosInstance, AxiosRequestConfig,} from 'axios';
import { IObject } from 'ts-utils2';
import { IApiConfig } from './IApiRouteConfig';
import { Store } from 'vuex';

const defaultCallBack = () => false;

export interface IRequestHandlerConf extends IObject {
  method: string;
  url: string;
  data?: any;
  params?: IObject;
  headers?: IObject;
  errCallback?: Function;
  hooks?: { afterRequest?: (content?: IObject) => void, hasHooks?: boolean };
}

export enum IRequestMethods {
  get = 'get',
  post = 'post',
  put = 'put',
  delete = 'delete',
  patch = 'patch',
  head = 'head',
}

export interface IRequestHandler {
  exec: (method: string, conf: IRequestHandlerConf) => Promise<IObject>;
  execute: (conf: IRequestHandlerConf) => Promise<IObject>;
}

class RequestHandler implements IRequestHandler {
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;
  private accessToken: string | undefined;
  private readonly withHeaders: boolean;
  private store: Store<any>;
  private readonly moduleName: string;

  constructor(apiConf: IApiConfig, store: Store<any>, moduleName: string) {
    // prefix: string = '', location = `${process.env.VUE_APP_BACKEND_HOST}`, withHeaders = false
    this.baseUrl = (apiConf && apiConf.location ?
      apiConf.location.replace(/\/$/, '') : process.env.VUE_APP_BACKEND_HOST)
      + '/' + (apiConf ? apiConf.prefix : '');
    this.baseUrl = this.baseUrl.replace('//', '/')
      .replace('http:/', 'http://')
      .replace('https:/', 'https://');
    // console.log('====> RequestHandler for baseUrl', this.baseUrl,'prefix',apiConf.prefix);
    this.withHeaders = apiConf && apiConf.withHeaders;
    this.store = store;
    this.moduleName = moduleName;
    this.client = axios.create({
      baseURL: this.baseUrl,
    });
  }

  public setAccessToken(token: string | undefined) {
    this.accessToken = token;
  }

  public async exec(method: string, _config: IRequestHandlerConf)
    : Promise<IObject> {
    return this.execute({ ..._config, method });
  }

  public async execute(_config: IRequestHandlerConf): Promise<IObject> {
    // inject the accessToken for each request
    const Authorization = `Bearer ${this.accessToken}`;
    const headers = { Authorization, ..._config.headers };
    const config = { ..._config, headers };
    // console.log('received headers', config.headers,
    //  'reqHandler calling ', config.url, 'with params :', config);
    try {
      const req = await this.client(<AxiosRequestConfig>config);
      if (config.hooks) {
        // console.log('check hooks', config.hooks.afterRequest);
        if (config.hooks.afterRequest) {
          config.hooks.afterRequest(req);
        } else {
          console.log('no hook found');
        }
      }
      const { data, headers } = req;
      if (this.withHeaders) {
        return { data, headers, req };
      }
      return data;
    } catch (e)
    {
      // check if: User not registered
      const { response } = e;
      console.log('RequestHandler received', response && response.data);
      if (response) {
        const { data, status, statusText } = response;
        if (!data) {
          this.store.commit(this.moduleName + 'setUnauthorizedUser', true);
        } else {
          const { code, message } = data;
          if (data === 'Authentication Failed: User not registered') {
            const message = 'This account is not authorized or not yet registred for this action';
            this.store.commit('setUnauthorizedUser', { message, code,  status });
          }

          if (code === 500) {
            console.log('set error event setLastErrorMessage', { message, code,  status });
            this.store.commit(this.moduleName + 'setLastErrorMessage', { message, code, status });
          }
          if (status === 500) {
            console.log('set error event setLastErrorMessage', { message, code,  status });
            this.store.commit(this.moduleName + 'setLastErrorMessage', { message: statusText,  status });
          }

          if (
            (status === 401 && statusText.indexOf('expired') !== -1) ||
            (code === 401 && message.indexOf('expired'))
          ) {
            const message = 'Session timed out';
            console.log('setUnauthorizedUser', { message, code,  status });
            this.store.commit(this.moduleName + 'setUnauthorizedUser', true);
          }
          if (code === 403 && message === 'error.jwt.auth.info_not_found') {
            const message = 'This account is not authorized or not yet registred for this action';
            this.store.commit(this.moduleName + 'setUnauthorizedUser', { message, code,  status });
          }

          if (typeof config.errCallback === 'function') {
            config.errCallback(data);
          }
        }
      } else {
        const message = 'serveur not responding!';
        this.store.commit(this.moduleName + 'setUnauthorizedUser', { message, code: 999,  status });
      }

      throw e;
    }
  }
}

for (let method in IRequestMethods) {
  if (IRequestMethods.hasOwnProperty(method)) {
    // @ts-ignore
    RequestHandler.prototype[method] = async function(
      url: string, data: any = null, params: object = {},
      headers: IObject = {}, errCallback: Function = defaultCallBack) {
      return this.execute({ url, data, params, headers, errCallback, method });
    };
    // @ts-ignore
    RequestHandler.prototype[`${method}2`] = async function(config: IRequestHandlerConf): Promise<object> {
      return this.execute({ ...config, method });
    };
  }
}


export default RequestHandler;
