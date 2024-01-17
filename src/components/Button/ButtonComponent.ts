import { Component } from "../common";

export interface IButtonConfig {
    id?: string;
    text?: string;
    variant?: "text" | "contained" | "outlined";
    color?: "primary" | "secondary" | "error" | "warning";
    disabled?: boolean;
    startIcon?: HTMLElement;
    endIcon?: HTMLElement;
    extendClasses?: string[];
    preClick?: () => Promise<boolean | Error>;
    onClick?: (e: MouseEvent) => void;
}

const BUTTON_BASE_CLASS = "button";

export class ButtonComponent implements Component {
    private componentElement: HTMLElement;
    private config: IButtonConfig;

    constructor(config: IButtonConfig) {
        this.config = config;
        this.componentElement = document.createElement("button");
        this.renderComponent();
    }

    renderComponent(): void {
        const {
            id,
            text,
            variant,
            color,
            disabled,
            startIcon,
            endIcon,
            extendClasses,
            onClick,
            preClick,
        } = this.config;
        this.componentElement.innerHTML = "";
        if (id) {
            this.componentElement.id = id;
        }
        this.componentElement.className = `${BUTTON_BASE_CLASS} ${
            variant ? variant : ""
        } ${color ? color : ""} ${extendClasses?.join(" ") || ""}`;
        if (disabled) {
            (this.componentElement as HTMLButtonElement).disabled = true;
            this.componentElement.classList.add("disabled");
        }

        if (onClick) {
            this.componentElement.addEventListener(
                "click",
                async (e: MouseEvent) => {
                    let shouldProceed = true;

                    if (preClick) {
                        try {
                            const result = await preClick();
                            if (typeof result === "boolean") {
                                shouldProceed = result;
                            } else if (result instanceof Error) {
                                console.error("Pre-click error:", result);
                                shouldProceed = false;
                            }
                        } catch (error) {
                            console.error("Error during pre-click:", error);
                            shouldProceed = false;
                        }
                    }

                    if (shouldProceed) {
                        onClick(e);
                    }
                },
            );
        }

        if (startIcon) {
            this.componentElement.appendChild(startIcon);
        }

        if (text) {
            const buttonText = document.createElement("span");
            buttonText.textContent = text;
            this.componentElement.appendChild(buttonText);
        }

        if (endIcon) {
            this.componentElement.appendChild(endIcon);
        }
    }

    render(): HTMLElement {
        return this.componentElement;
    }
}
