import { createDivElement } from "@utils";

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
        this.checkContainer();
        this._container!.appendChild(element);
    }

    public findElementByClass(className: string): HTMLElement | null {
        this.checkContainer();
        return this._container!.querySelector(`.${className}`);
    }

    public findElementById(id: string): HTMLElement | null {
        this.checkContainer();
        return this._container!.querySelector(`#${id}`);
    }

    public removeElement(element: HTMLElement): void {
        this.checkContainer();
        this._container!.removeChild(element);
    }

    public showLoading(): void {
        const loadingModal = createDivElement({ className: "loading-modal" });
        const loadingSpinner = createDivElement({
            className: "loading-spinner",
        });
        loadingModal.appendChild(loadingSpinner);
        this.addElement(loadingModal);
    }

    public hideLoading(): void {
        const loadingModal = this.findElementByClass("loading-modal");
        if (loadingModal) {
            this.removeElement(loadingModal);
        }
    }

    private checkContainer(): void {
        if (!this._container) {
            throw new Error("Container is not set.");
        }
    }
}

export const uiManager = UIManager.getInstance();
