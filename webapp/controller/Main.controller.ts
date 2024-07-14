import { FilterKey, Todo } from "fioritodoapp/types/todo";
import Button, { Button$PressEvent } from "sap/m/Button";
import Dialog from "sap/m/Dialog";
import { ButtonType, DialogType } from "sap/m/library";
import List from "sap/m/List";
import MessageBox from "sap/m/MessageBox";
import { SearchField$LiveChangeEvent } from "sap/m/SearchField";
import { SegmentedButton$SelectionChangeEvent } from "sap/m/SegmentedButton";
import Text from "sap/m/Text";
import { ValueState } from "sap/ui/core/library";
import View from "sap/ui/core/mvc/View";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import FilterType from "sap/ui/model/FilterType";
import JSONModel from "sap/ui/model/json/JSONModel";
import ListBinding from "sap/ui/model/ListBinding";
import { Button$ClickEvent } from "sap/ui/webc/main/Button";
import { BaseController } from "./BaseController";

/**
 * @namespace fioritodoapp.controller
 */
export default class Main extends BaseController {
  private view: View;
  private filters: Filter[];
  private statusFilters: Filter[];
  private query: string;
  private filterKey: FilterKey;
  private deleteDialog: Dialog;

  public onInit() {
    this.view = <View>this.getView();
    this.filters = [];
    this.statusFilters = [];

    this.view.setModel(
      new JSONModel({
        newTodo: "",
        todos: [
          {
            id: crypto.randomUUID(),
            title: "Start this app",
            completed: true,
          },
          {
            id: crypto.randomUUID(),
            title: "Learn OpenUI5",
            completed: false,
          },
          {
            id: crypto.randomUUID(),
            title: "Learn React",
            completed: false,
          },
        ],
        itemsRemovable: true,
        completedCount: 1,
        filterText: "",
      }),
      "todo"
    );
  }

  public addTodo() {
    const todoModel = this.getModel("todo");

    const todo = <string>todoModel.getProperty("/newTodo");
    const todos = (<Todo[]>todoModel.getProperty("/todos")).slice();

    todos.push({
      id: crypto.randomUUID(),
      title: todo,
      completed: false,
    });

    todoModel.setProperty("/todos", todos);
    todoModel.setProperty("/newTodo", "");
  }

  public onSearch(event: SearchField$LiveChangeEvent) {
    const todoModel = this.getModel("todo");

    this.query = event.getSource().getValue(); // Same event.target in React
    this.filters = [];

    if (this.query.length) {
      todoModel.setProperty("/itemsRemovable", false);
      const filter = new Filter("title", FilterOperator.Contains, this.query);
      this.filters.push(filter);
    } else {
      todoModel.setProperty("/itemsRemovable", true);
    }

    this.applyListFilters();
  }

  public onFilter(event: SegmentedButton$SelectionChangeEvent) {
    this.statusFilters = [];
    this.filterKey = <FilterKey>event.getParameter("item")?.getKey();

    switch (this.filterKey) {
      case "active": {
        this.statusFilters.push(
          new Filter("completed", FilterOperator.EQ, false)
        );
        break;
      }
      case "completed": {
        this.statusFilters.push(
          new Filter("completed", FilterOperator.EQ, true)
        );
        break;
      }
      case "all":
      default:
    }

    this.applyListFilters();
  }

  public onClearCompleted() {
    const todoModel = this.getModel("todo");

    const todos = (<Todo[]>todoModel.getProperty("/todos")).slice();
    const newTodos = todos.filter((todo) => !todo.completed);
    todoModel.setProperty("/todos", newTodos);
  }

  public onOpenDelete(event: Button$ClickEvent) {
    const todoModel = this.getModel("todo");

    const selectedId = <string>(
      event.getSource().getBindingContext("todo")?.getProperty("id")
    );

    MessageBox.information("Are you sure you want to delete?", {
      actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
      emphasizedAction: MessageBox.Action.OK,
      onClose: (action: unknown) => {
        if (action === MessageBox.Action.OK) {
          const todos = (<Todo[]>todoModel.getProperty("/todos")).slice();
          const newTodos = todos.filter((todo) => todo.id !== selectedId);

          todoModel.setProperty("/todos", newTodos);
        }
      },
    });
  }

  public onOpenDeleteDialog(event: Button$ClickEvent) {
    const todoModel = this.getModel("todo");
    const path = <string>event.getSource().getBindingContext("todo")?.getPath();

    if (!this.deleteDialog) {
      this.deleteDialog = new Dialog({
        type: DialogType.Message,
        title: "Confirm",
        state: ValueState.Information,
        content: new Text({ text: "Are you sure you want to delete?" }),
        beginButton: new Button({
          type: ButtonType.Emphasized,
          text: "OK",
          press: (event: Button$PressEvent) => {
            const selectedId = <string>(
              event.getSource().getBindingContext("todo")?.getProperty("id")
            );

            const todos = (<Todo[]>todoModel.getProperty("/todos")).slice();
            const newTodos = todos.filter((todo) => todo.id !== selectedId);

            todoModel.setProperty("/todos", newTodos);

            this.deleteDialog.close();
          },
        }),
        endButton: new Button({
          text: "Cancel",
          press: () => {
            this.deleteDialog.close();
          },
        }),
      });
    }

    this.view.addDependent(this.deleteDialog);
    this.deleteDialog.bindElement(`todo>${path}`);
    this.deleteDialog.open();
  }

  private applyListFilters() {
    const todoModel = this.getModel("todo");
    const list = <List>this.byId("todoList");
    const binding = <ListBinding>list.getBinding("items");

    binding.filter(
      this.filters.concat(this.statusFilters),
      "todos" as FilterType
    );

    let filterText = "";

    if (this.filterKey && this.filterKey !== "all") {
      if (this.filterKey === "active") {
        filterText = "Active items";
      } else {
        filterText = "Completed items";
      }

      if (this.query) {
        filterText += "containing";
      }
    } else if (this.query) {
      filterText = `Items containing "${this.query}"`;
    }

    todoModel.setProperty("/filterText", filterText);
  }
}
