import Controller from "sap/ui/core/mvc/Controller";
import JSONModel from "sap/ui/model/json/JSONModel";
import Model from "sap/ui/model/Model";

export class BaseController extends Controller {
  public getModel<T = JSONModel>(name?: string) {
    return this.getView()?.getModel(name) as T;
  }

  public setModel(model: Model, name: string) {
    return this.getView()?.setModel(model, name);
  }
}
