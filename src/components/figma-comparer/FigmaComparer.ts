import { GenericRequest } from "../../base";
import { FigmaClient } from "../../figma/figma";
import { HtmlImageComparer } from "../../image-comparer/ImageComparer";
import { IButtonConfig } from "../Button/ButtonComponent";
import { Component } from "../common";
import { FigmaComparerBody } from "../figma-compare-body/FigmaComparerBody";
import {
    FooterButtonConfigs,
    FooterComponent,
} from "../figma-compare-footer/FigmaComparerFooter";
import { FigmaComparerHeader } from "../figma-compare-header/FigmaComparerHeader";
import { Task } from "../list-task/types/Task";
import { TreeItem } from "../tree/tree";
import css from "./figma-comparer.scss";

export class FigmaComparer implements Component {
    private readonly STEPS: string[] = [
        "Figma Login",
        "Screen Selection",
        "Tasks Edition",
    ];

    private readonly DEFAULT_CANCEL_BUTTON_CONFIG: IButtonConfig = {
        text: "Cancel",
        variant: "outlined",
        color: "primary",
        onClick: this.closeModal.bind(this),
    };

    private componentElement: HTMLElement;

    private headerComponent!: FigmaComparerHeader;
    private bodyComponent!: FigmaComparerBody;
    private footerComponent!: FooterComponent;

    private activeStep: number;
    private selectedFigmaScreen: TreeItem | null = null;
    private htmlComparer!: HtmlImageComparer;
    private tasks: GenericRequest<Task>[] | null = null;

    constructor(
        private figmaClient: FigmaClient,
        private onClose: () => void,
        private onCreateTasks: (tasks: GenericRequest<Task>[]) => Promise<void>,
        private teamIds: string[],
        initialActiveStep?: number
    ) {
        this.componentElement = document.createElement("div");
        this.componentElement.className = css["figma-comparer"];
        this.activeStep = initialActiveStep ?? 0;

        this.initializeDataAndComponents();
        this.renderComponent();
    }

    private initializeDataAndComponents(): void {
        this.htmlComparer = new HtmlImageComparer();
        this.headerComponent = new FigmaComparerHeader(
            this.STEPS,
            this.onClose,
            this.activeStep
        );
        this.bodyComponent = new FigmaComparerBody(
            this.figmaClient,
            this.onSelectedItemChange.bind(this),
            this.onTasksChange.bind(this),
            this.updateFooter.bind(this),
            this.showLoading.bind(this),
            this.hideLoading.bind(this),
            this.teamIds,
            this.activeStep
        );
        this.footerComponent = new FooterComponent({
            cancelButtonConfig: this.DEFAULT_CANCEL_BUTTON_CONFIG,
            previousButtonConfig: this.createPreviousButtonConfig(),
            nextButtonConfig: this.createNextButtonConfig(),
        });
    }

    private onSelectedItemChange = (selectedItem: TreeItem): void => {
        this.selectedFigmaScreen = selectedItem;
        this.updateFooterComponent();
    };

    private onTasksChange = (t: GenericRequest<Task>[]) => {
        this.tasks = t;
    };

    private updateFooter(configs: FooterButtonConfigs) {
        this.footerComponent.updateButtonConfigs(configs);
    }

    private updateFooterComponent(): void {
        const nextButtonConfig = this.createNextButtonConfig();
        this.footerComponent.updateButtonConfigs({ nextButtonConfig });
    }

    private createPreviousButtonConfig(): IButtonConfig {
        return {
            text: "Previous",
            variant: "contained",
            color: "primary",
            onClick: this.handlePrevious.bind(this),
        };
    }

    private createNextButtonConfig(): IButtonConfig {
        return {
            text: "Next",
            variant: "contained",
            color: "primary",
            onClick: this.handleNext.bind(this),
            disabled: this.shouldDisableNextButton(),
        };
    }

    private shouldDisableNextButton(): boolean {
        const userInfo = this.figmaClient.getUserInfo();

        if (this.activeStep === 0) {
            return !userInfo;
        } else if (this.activeStep === 1) {
            return !this.selectedFigmaScreen;
        }
        return false;
    }

    private handlePrevious(): void {
        // Check if the current step is greater than the first step
        if (this.activeStep > 0) {
            this.activeStep--;

            // Update footer component for specific steps
            if (this.activeStep === 1 || this.activeStep === 0) {
                this.updateFooterComponent();
            }

            // Update all components to reflect the new step
            this.updateComponentsStep();
        }
    }

    private handleNext(): void {
        if (this.shouldDisableNextButton()) return;

        switch (this.activeStep) {
            case 1:
                this.processImageComparisonStep();
                break;
            case 2:
                this.processTaskStep();
                break;
            default:
                this.goToNextStep();
        }
    }

    private processImageComparisonStep(): void {
        if (!this.selectedFigmaScreen?.imageUrl) {
            return;
        }

        this.showLoading();
        this.htmlComparer
            .findDifferencePosition(
                document.body,
                this.selectedFigmaScreen.imageUrl
            )
            .then((diffPosition) => {
                this.handleImageComparisonResult(diffPosition);
            })
            .catch((error) => {
                console.error("Error during image comparison:", error);
            })
            .finally(() => {
                this.hideLoading();
            });
    }

    private handleImageComparisonResult(diffPosition: any): void {
        if (diffPosition) {
            console.log("Difference found at position:", diffPosition);
            this.bodyComponent.diffData = diffPosition;
        } else {
            console.log("No differences found");
        }

        this.goToNextStep();
    }

    private processTaskStep() {
        if (!this.tasks) return;

        this.onCreateTasks(this.tasks).then(() => {
            this.closeModal();
        });
    }

    private goToNextStep(): void {
        if (this.activeStep < this.STEPS.length - 1) {
            this.activeStep++;
            this.updateComponentsStep();
        }
    }

    private updateComponentsStep(): void {
        this.headerComponent.activeStepIndex = this.activeStep;
        this.bodyComponent.activeStepIndex = this.activeStep;
        this.footerComponent.activeStepIndex = this.activeStep;
    }

    private closeModal() {
        this.reset();
        this.onClose?.();
    }

    private reset() {
        this.activeStep = 0;
        this.selectedFigmaScreen = null;
    }

    showLoading() {
        const loadingModal = document.createElement("div");
        loadingModal.className = css["loading-modal"];
        const loadingSpinner = document.createElement("div");
        loadingSpinner.className = css["loading-spinner"];
        loadingModal.appendChild(loadingSpinner);
        this.componentElement.appendChild(loadingModal);
    }

    hideLoading() {
        const loadingModal = this.componentElement.querySelector(
            `.${css["loading-modal"]}`
        );
        if (loadingModal) {
            this.componentElement.removeChild(loadingModal);
        }
    }

    renderComponent(): void {
        if (!this.componentElement.hasChildNodes()) {
            this.componentElement.appendChild(this.headerComponent.render());
            this.componentElement.appendChild(this.bodyComponent.render());
            this.componentElement.appendChild(this.footerComponent.render());
        } else {
            // Update existing components
            this.headerComponent.renderComponent();
            this.bodyComponent.renderComponent();
            this.footerComponent.renderComponent();
        }
    }

    render(): HTMLElement {
        return this.componentElement;
    }
}