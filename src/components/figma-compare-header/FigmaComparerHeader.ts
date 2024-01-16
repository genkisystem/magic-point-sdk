import { checkedIcon, closeIconSvg, uncheckedIcon } from "@icons";
import { createDivElement } from "@utils";
import i18next from "i18next";
import { Component } from "../common";

export class FigmaComparerHeader implements Component {
    private containerElement: HTMLElement;
    private _activeStepIndex: number = 0;

    constructor(
        private steps: string[],
        private onClose: () => void,
        activeStepIndex: number = 0,
    ) {
        this.steps = steps;
        this._activeStepIndex = activeStepIndex;

        this.containerElement = createDivElement({
            className: "modal-components-wizard-he",
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
            ? "wizard-step-complete"
            : "wizard-step-incomplete1";
        const iconSrc = isActive ? checkedIcon : uncheckedIcon;
        const dividerClass = isActive ? "divider" : "divider1";
        return `
            <div class="${className}">
                <div class="${dividerClass}"></div>
                <div class="icon-text">
                    <div class="step-icon">${iconSrc}</div>
                    <div class="step-text">${stepName}</div>
                </div>
            </div>
        `;
    }

    renderComponent() {
        this.containerElement.innerHTML = "";

        const baseHeadParent = createDivElement({
            className: "modal-components-base-head-parent",
        });
        const baseHead = createDivElement({
            className: "modal-components-base-head",
        });
        const textIcon = createDivElement({
            className: "text-icon",
        });
        const figmaCompare = createDivElement({
            className: "figma-compare",
            innerHTML: i18next.t("figma:compareHeader.text"),
        });
        const closeDiv = createDivElement({
            className: "modal-components-close-d",
        });
        const closeIcon = createDivElement({
            className: "close-icon",
            innerHTML: closeIconSvg,
        });

        closeIcon.addEventListener("click", () => {
            this.onClose();
        });

        const wizardSteps6 = createDivElement({
            className: "wizard-steps-6",
        });
        wizardSteps6.innerHTML = this.steps
            .map((step, index) => this.createWizardStep(step, index))
            .join("");

        const stepperLoaded = createDivElement({
            className: "wizard-stepper-loaded",
        });
        stepperLoaded.appendChild(wizardSteps6);

        textIcon.appendChild(figmaCompare);
        baseHead.appendChild(textIcon);
        closeDiv.appendChild(closeIcon);
        baseHead.appendChild(closeDiv);
        baseHeadParent.appendChild(baseHead);
        baseHeadParent.appendChild(stepperLoaded);
        baseHeadParent.appendChild(
            createDivElement({ className: "spacer-24px" }),
        );
        baseHeadParent.appendChild(createDivElement({ className: "spacer" }));
        baseHeadParent.appendChild(createDivElement({ className: "filler" }));

        this.containerElement.appendChild(baseHeadParent);
    }

    render(): HTMLElement {
        return this.containerElement;
    }
}
