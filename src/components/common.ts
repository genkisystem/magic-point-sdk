import { ButtonComponent, IButtonConfig } from "./Button/ButtonComponent";

export interface SelectItem {
    display: string;
    value: string;
}

export interface Component {
    render(): HTMLElement;
    renderComponent(): void;
}

/**
 * BaseComponent provides basic functionalities for other components,
 * such as creating common DOM elements.
 */
export class BaseComponent {
    /**
     * Creates a div element with the specified class name.
     * @param className The class name to assign to the div element.
     * @returns The created div element.
     */
    protected createDivElement(className: string): HTMLElement {
        const element = document.createElement("div");
        element.className = className;
        return element;
    }

    /**
     * Creates a button element based on the given configuration.
     * @param config The configuration for the button component.
     * @returns The rendered button element.
     */
    protected createButton(config: IButtonConfig): HTMLElement {
        return new ButtonComponent({ ...config }).render();
    }
}