import { Component, SelectItem } from "../common";

export interface ISelectBoxConfig {
    options: SelectItem[];
    selectedValue?: string;
    disabled?: boolean;
    extendClasses?: string[];
    onChange?: (selectedValue: string) => void;
}

const SELECT_BOX_BASE_CLASS = "select-box";

export class SelectBoxComponent implements Component {
    private componentElement: HTMLSelectElement;
    private config: ISelectBoxConfig;

    constructor(config: ISelectBoxConfig) {
        this.config = config;
        this.componentElement = document.createElement("select");
        this.renderComponent();
    }

    renderComponent(): void {
        const { options, selectedValue, disabled, extendClasses, onChange } =
            this.config;
        this.componentElement.innerHTML = "";
        this.componentElement.className = `${SELECT_BOX_BASE_CLASS} ${
            extendClasses?.join(" ") || ""
        }`;
        this.componentElement.disabled = disabled || false;

        options.forEach((option) => {
            const optionElement = document.createElement("option");
            optionElement.value = option.value;
            optionElement.textContent = option.display;

            if (selectedValue && option.value === selectedValue) {
                optionElement.selected = true;
            }

            this.componentElement.appendChild(optionElement);
        });

        if (onChange) {
            this.componentElement.addEventListener("change", () => {
                onChange(this.componentElement.value);
            });
        }
    }

    render(): HTMLSelectElement {
        return this.componentElement;
    }
}
