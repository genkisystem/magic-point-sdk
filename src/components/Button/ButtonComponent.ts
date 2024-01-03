import { Component } from "../common";
import css from "./button.scss";

export interface IButtonConfig {
    text?: string;
    variant?: "text" | "contained" | "outlined";
    color?: "primary" | "secondary" | "error" | "warning";
    disabled?: boolean;
    startIcon?: HTMLElement;
    endIcon?: HTMLElement;
    extendClasses?: string[];
    preClick?: () => Promise<boolean | Error>;
    onClick?: () => void;
}

const BUTTON_BASE_CLASS = css["button"];

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
        this.componentElement.className = `${BUTTON_BASE_CLASS} ${variant ? css[variant] : ""
            } ${color ? css[color] : ""} ${extendClasses?.join(" ") || ""}`;
        if (disabled) {
            (this.componentElement as HTMLButtonElement).disabled = true;
            this.componentElement.classList.add(css["disabled"]);
        }

        if (onClick) {
            this.componentElement.addEventListener("click", async () => {
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
                    onClick();
                }
            });
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