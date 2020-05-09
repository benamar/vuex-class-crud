import { IObject, IObjectIndexer } from 'ts-utils2';

export interface IParam extends IObjectIndexer<any> {
  input?: string;
  output?: string;
}

// # sourceMappingURL=IEntity.js.map
export interface IContent extends IObjectIndexer<any> {
  body?: any;
  params?: IParam;
  headers?: IObject;
  errCallback?: Function;
}