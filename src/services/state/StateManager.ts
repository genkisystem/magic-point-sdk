export enum StateKeys {
    FigmaTeamIds = "figmaTeamIds",
    Assignee = "assignee",
    Status = "status",
    Issue = "issue",
    InitAssignee = 'initAssignee',
    InitStatus = 'initStatus',
    InitIssue = 'initIssue',
}

type Listener<T> = (state: T) => void;
type State<T> = Record<string, T>;

export class StateManager {
    private state: State<any> = {};
    private listeners: Record<string, Listener<any>[]> = {};

    constructor(private scope: string = "") {}

    public getState<T>(key: StateKeys): T | undefined {
        const scopedKey = this.getScopedKey(key);
        return this.state[scopedKey] as T;
    }

    public setState<T>(key: StateKeys, value: T): void {
        const scopedKey = this.getScopedKey(key);
        this.state[scopedKey] = value;
        this.notifyListeners(scopedKey, value);
    }

    public subscribe<T>(key: StateKeys, listener: Listener<T>): void {
        const scopedKey = this.getScopedKey(key);
        if (!this.listeners[scopedKey]) {
            this.listeners[scopedKey] = [];
        }
        this.listeners[scopedKey].push(listener);
    }

    public unsubscribe<T>(key: StateKeys, listener: Listener<T>): void {
        const scopedKey = this.getScopedKey(key);
        if (this.listeners[scopedKey]) {
            this.listeners[scopedKey] = this.listeners[scopedKey].filter(
                (l) => l !== listener
            );
        }
    }

    private notifyListeners<T>(key: StateKeys, value: T): void {
        const scopedKey = this.getScopedKey(key);
        if (this.listeners[scopedKey]) {
            this.listeners[scopedKey].forEach((listener) => listener(value));
        }
    }

    private getScopedKey(key: StateKeys): StateKeys {
        return this.scope ? (`${this.scope}_${key}` as StateKeys) : key;
    }
}

export const globalStateManager = new StateManager();
export const createScopedStateManager = (scope: string) =>
    new StateManager(scope);
