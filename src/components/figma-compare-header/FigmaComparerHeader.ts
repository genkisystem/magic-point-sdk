import checkedIcon from "../../asset/checked-circle.svg";
import closeIconSvg from "../../asset/close-icon.svg";
import uncheckedIcon from "../../asset/unchecked-circle.svg";
import { createDivElement } from "../../utils/html";
import { Component } from "../common";
import css from "./figma-header.scss";

export class FigmaComparerHeader implements Component {
    private containerElement: HTMLElement;
    private _activeStepIndex: number = 0;

    constructor(
        private steps: string[],
        private onClose: () => void,
        activeStepIndex: number = 0
    ) {
        this.steps = steps;
        this._activeStepIndex = activeStepIndex;

        this.containerElement = createDivElement({
            className: css["modal-components-wizard-he"],
        });

        this.renderComponent();
    }

    set activeStepIndex(newValue: number) {
        this._activeStepIndex = newValue;
        this.renderComponent();
    }

    get activeStepIndex() {
        return this._activeStepIndex;
    }

    private createWizardStep(stepName: string, index: number): string {
        const isActive = index < this._activeStepIndex;
        const className = isActive
            ? css["wizard-step-complete"]
            : css["wizard-step-incomplete1"];
        const iconSrc = isActive ? checkedIcon : uncheckedIcon;
        const dividerClass = isActive ? css["divider"] : css["divider1"];
        return `
            <div class="${className}">
                <div class="${dividerClass}"></div>
                <div class="${css["icon-text"]}">
                    <div class="${css["step-icon"]}">${iconSrc}</div>
                    <div class="${css["step-text"]}">${stepName}</div>
                </div>
            </div>
        `;
    }

    renderComponent() {
        this.containerElement.innerHTML = "";

        const baseHeadParent = createDivElement({
            className: css["modal-components-base-head-parent"],
        });
        const baseHead = createDivElement({
            className: css["modal-components-base-head"],
        });
        const textIcon = createDivElement({
            className: css["text-icon"],
        });
        const figmaCompare = createDivElement({
            className: css["figma-compare"],
            innerHTML: "Figma compare",
        });
        const closeDiv = createDivElement({
            className: css["modal-components-close-d"],
        });
        const closeIcon = createDivElement({
            className: css["close-icon"],
            innerHTML: closeIconSvg,
        });

        closeIcon.addEventListener("click", () => {
            this.onClose();
        });

        const wizardSteps6 = createDivElement({
            className: css["wizard-steps-6"],
        });
        wizardSteps6.innerHTML = this.steps
            .map((step, index) => this.createWizardStep(step, index))
            .join("");

        const stepperLoaded = createDivElement({
            className: css["wizard-stepper-loaded"],
        });
        stepperLoaded.appendChild(wizardSteps6);

        textIcon.appendChild(figmaCompare);
        baseHead.appendChild(textIcon);
        closeDiv.appendChild(closeIcon);
        baseHead.appendChild(closeDiv);
        baseHeadParent.appendChild(baseHead);
        baseHeadParent.appendChild(stepperLoaded);
        baseHeadParent.appendChild(
            createDivElement({ className: css["spacer-24px"] })
        );
        baseHeadParent.appendChild(
            createDivElement({ className: css["spacer"] })
        );
        baseHeadParent.appendChild(
            createDivElement({ className: css["filler"] })
        );

        this.containerElement.appendChild(baseHeadParent);
    }

    render(): HTMLElement {
        return this.containerElement;
    }
}
