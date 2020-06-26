import { IObject, IObjectIndexer } from 'ts-utils2'

export interface IVParam extends IObjectIndexer<any> {
  input?: string;
  output?: string;
}

// # sourceMappingURL=IEntity.js.map
export interface IVRequestOptions extends IObjectIndexer<any> {
  body?: any;
  params?: IVParam;
  headers?: IObject;
  errCallback?: Function;
}
