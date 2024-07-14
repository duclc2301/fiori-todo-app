export interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

export type FilterKey = "active" | "completed" | "all";
