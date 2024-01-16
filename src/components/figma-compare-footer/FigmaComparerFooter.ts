import { createDivElement } from "@utils";
import { ButtonComponent, IButtonConfig } from "../button/ButtonComponent";

export interface FooterButtonConfigs {
    cancelButtonConfig?: IButtonConfig;
    previousButtonConfig?: IButtonConfig;
    nextButtonConfig?: IButtonConfig;
}

export class FooterComponent {
    private componentElement: HTMLElement;
    private _activeStepIndex: number;

    private cancelButtonConfig?: IButtonConfig;
    private previousButtonConfig?: IButtonConfig;
    private nextButtonConfig?: IButtonConfig;

    constructor(configs: FooterButtonConfigs, initialActiveStepIndex?: number) {
        this.cancelButtonConfig = configs.cancelButtonConfig;
        this.previousButtonConfig = configs.previousButtonConfig;
        this.nextButtonConfig = configs.nextButtonConfig;

        this.componentElement = createDivElement({ className: "footer" });

        this._activeStepIndex = initialActiveStepIndex ?? 0;
        this.renderComponent();
    }

    set activeStepIndex(newValue: number) {
        this._activeStepIndex = newValue;
        this.renderComponent();
    }

    get activeStepIndex() {
        return this._activeStepIndex;
    }

    updateButtonConfigs(configs: {
        cancelButtonConfig?: IButtonConfig;
        previousButtonConfig?: IButtonConfig;
        nextButtonConfig?: IButtonConfig;
    }) {
        if (configs.cancelButtonConfig) {
            this.cancelButtonConfig = {
                ...this.cancelButtonConfig,
                ...configs.cancelButtonConfig,
            };
        }
        if (configs.previousButtonConfig) {
            this.previousButtonConfig = {
                ...this.previousButtonConfig,
                ...configs.previousButtonConfig,
            };
        }
        if (configs.nextButtonConfig) {
            this.nextButtonConfig = {
                ...this.nextButtonConfig,
                ...configs.nextButtonConfig,
            };
        }
        this.renderComponent();
    }

    renderComponent() {
        this.componentElement.innerHTML = "";

        const leftButtons = createDivElement({ className: "left-buttons" });
        if (this.cancelButtonConfig) {
            const cancelButton = new ButtonComponent(this.cancelButtonConfig);
            leftButtons.appendChild(cancelButton.render());
        }

        const rightButtons = createDivElement({ className: "right-buttons" });
        if (this.previousButtonConfig) {
            this.previousButtonConfig.disabled = this._activeStepIndex === 0;
            const previousButton = new ButtonComponent(
                this.previousButtonConfig,
            );
            rightButtons.appendChild(previousButton.render());
        }

        if (this.nextButtonConfig) {
            const nextButton = new ButtonComponent(this.nextButtonConfig);
            rightButtons.appendChild(nextButton.render());
        }

        this.componentElement.appendChild(leftButtons);
        this.componentElement.appendChild(rightButtons);
    }

    render(): HTMLElement {
        return this.componentElement;
    }
}
