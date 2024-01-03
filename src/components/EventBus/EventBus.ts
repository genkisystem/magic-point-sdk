type EventCallback = (...args: any[]) => void;

export class EventBus {
    private listeners: { [event: string]: EventCallback[] } = {};

    on(event: string, listener: EventCallback): void {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(listener);
    }

    off(event: string, listener: EventCallback): void {
        if (!this.listeners[event]) {
            return;
        }
        this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }

    emit(event: string, ...args: any[]): void {
        if (!this.listeners[event]) {
            return;
        }
        this.listeners[event].forEach(listener => listener(...args));
    }
}