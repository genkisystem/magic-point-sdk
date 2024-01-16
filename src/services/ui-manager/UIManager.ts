export class UIManager {
    private static _instance: UIManager;
    private _container: HTMLElement | null;

    private constructor(container?: HTMLElement) {
        this._container = container || null;
    }

    public static getInstance(): UIManager {
        return this._instance || (this._instance = new UIManager());
    }

    public setContainer(container: HTMLElement | null): void {
        this._container = container;
    }

    public addElement(element: HTMLElement): void {
        console.trace("Adding element:", element);
        if (!this._container) {
            console.warn("Container is not set. Unable to add element.");
            return;
        }
        this._container.appendChild(element);
    }

    public findElementById(id: string): HTMLElement | null {
        if (!this._container) {
            console.warn("Container is not set. Unable to find element.");
            return null;
        }

        return this._container.querySelector(`#${id}`);
    }

    public removeElement(element: HTMLElement): void {
        if (!this._container) {
            console.warn("Container is not set. Unable to remove element.");
            return;
        }

        this._container.removeChild(element);
    }
}

export const uiManager = UIManager.getInstance();
