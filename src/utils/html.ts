import {
    ButtonComponent,
    IButtonConfig,
} from "../components/Button/ButtonComponent";

import {
    ISelectBoxConfig,
    SelectBoxComponent,
} from "../components/select-box/SelectBoxComponent";

export class DivElementConfig {
    constructor(
        public className?: string,
        public innerHTML?: string,
    ) { }
}

/**
 * Creates a div element with the specified configuration.
 * @param config The configuration object for the div element.
 * @returns The created div element.
 */
export const createDivElement = (
    config: DivElementConfig = new DivElementConfig(),
): HTMLElement => {
    const { className, innerHTML } = Object.freeze(config);
    const element = document.createElement("div");
    if (className) element.className = className;
    if (innerHTML) element.innerHTML = innerHTML;
    return element;
};

/**
 * Creates a button element based on the given configuration.
 * @param config The configuration for the button component.
 * @returns The rendered button element.
 */
export const createButton = (config: IButtonConfig): HTMLElement => {
    return new ButtonComponent({ ...config }).render();
};

export const createSelectBox = (config: ISelectBoxConfig): HTMLElement => {
    return new SelectBoxComponent({ ...config }).render();
};

export const findElementAtPosition = (
    root: HTMLElement,
    x: number,
    y: number,
): HTMLElement | null => {
    let foundElement: HTMLElement | null = null;

    for (let child of Array.from(root.children)) {
        if (child instanceof HTMLElement) {
            let rect: DOMRect = child.getBoundingClientRect();

            // Check if the coordinates are within this element's bounds
            if (
                x >= rect.left &&
                x <= rect.right &&
                y >= rect.top &&
                y <= rect.bottom
            ) {
                // Instead of returning immediately, continue to search for a more nested element
                foundElement = child;
                let deeperElement = findElementAtPosition(child, x, y);
                if (deeperElement) {
                    foundElement = deeperElement;
                }
            }
        }
    }

    return foundElement;
};

export const convertCoordinates = (
    x: number,
    y: number,
    wOriginal: number,
    hOriginal: number,
    wActual: number,
    hActual: number,
): { xActual: number; yActual: number } => {
    const xActual = (x / wOriginal) * wActual;
    const yActual = (y / hOriginal) * hActual;
    return { xActual, yActual };
};

export const getNewCoordinates = (
    originalWidth: number,
    originalHeight: number,
    newWidth: number,
    newHeight: number,
    originalX: number,
    originalY: number,
): { newX: number; newY: number } => {
    // Calculate scaling factors
    const scaleX = newWidth / originalWidth;
    const scaleY = newHeight / originalHeight;

    // Apply scaling factors to the original coordinates
    const newX = originalX * scaleX;
    const newY = originalY * scaleY;

    return { newX, newY };
};
