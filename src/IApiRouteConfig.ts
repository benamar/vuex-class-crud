import { IObject, IObjectIndexer } from 'ts-utils2'
import { IVRequestOptions } from './IEntity'

export { IObject } from 'ts-utils2'

export interface IAction {
  data: any;
  name: string;
}

export interface IRouteConfig extends IObjectIndexer<any> {
  api?: string;
  initial: any;
  name?: string;
  prefix?: string;
  startAt?: number;
  successActions?: [IAction];
  type?: any;
}

export interface IApiRoute extends IObjectIndexer<any> {
  [id: string]: IRouteConfig;
}

export interface IApiConfig extends IObjectIndexer<any> {
  prefix?: string;
  location?: string;
  headers?: IObject;
}

export interface IApiRouteConfig extends IObjectIndexer<any> {
  config?: IApiConfig;
  routes: IApiRoute;
}

export type IEntityFunc<O> = (content?: IVRequestOptions) => Promise<O>;
export type IEntityObjFunc = (content?: IVRequestOptions) => Promise<IObject>;
