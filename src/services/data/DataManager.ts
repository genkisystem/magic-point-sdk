import { assigneeApi, issueApi, statusApi } from "../apis";
import { StateKeys, globalStateManager } from "../state/StateManager";

export interface DataApiInterface<T> {
    getData(): Promise<{ appData?: T[] }>;
}

export class DataManager {
    private static instance: DataManager;
    private initialized: boolean = false;

    public static getInstance(): DataManager {
        return this.instance || (this.instance = new DataManager());
    }

    public get isInitialized(): boolean {
        return this.initialized;
    }

    public async init(): Promise<void> {
        if (!this.initialized) {
            await this.fetchData();
            this.initialized = true;
        } else {
            console.warn("DataManager is already initialized.");
        }
    }

    private async fetchData(): Promise<void> {
        try {
            await Promise.all([
                this.fetchDataAndSetState(assigneeApi, StateKeys.Assignee),
                this.fetchDataAndSetState(statusApi, StateKeys.Status),
                this.fetchDataAndSetState(issueApi, StateKeys.Issue),
            ]);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

    public async fetchDataAndSetState<T>(
        api: DataApiInterface<T>,
        stateKey: StateKeys,
    ): Promise<T[]> {
        const res = await api.getData();
        const data = res?.appData ?? [];
        globalStateManager.setState(stateKey, data);
        return data;
    }
}

export const dataManager = DataManager.getInstance();
