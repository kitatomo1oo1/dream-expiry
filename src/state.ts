import type { DataSet, Discovery } from "./types";

export type Phase = "home" | "dreamSelect" | "age" | "dreamline" | "after" | "reflect";

export interface AppState {
  phase: Phase;
  occupationId: string | null;
  age: number;
  previousAge: number | null;
  discoveries: Discovery[];
}

type Listener = () => void;

const INITIAL_STATE: AppState = {
  phase: "home",
  occupationId: null,
  age: 10,
  previousAge: null,
  discoveries: [],
};

export class Store {
  private state: AppState = { ...INITIAL_STATE };
  private listeners: Listener[] = [];

  constructor(public readonly ds: DataSet) {}

  getState(): AppState {
    return this.state;
  }

  subscribe(listener: Listener): void {
    this.listeners.push(listener);
  }

  setState(patch: Partial<AppState>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener();
  }

  reset(): void {
    this.state = { ...INITIAL_STATE };
    for (const listener of this.listeners) listener();
  }
}
