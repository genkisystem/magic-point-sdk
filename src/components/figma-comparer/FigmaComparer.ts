import { FigmaClient, HtmlImageComparer } from "@services";
import { createDivElement } from "@utils";
import i18next from "i18next";
import { GenericRequest } from "../../base";
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

export class FigmaComparer implements Component {
    private readonly STEPS: string[] = [
        i18next.t("figma:comparer.steps.login"),
        i18next.t("figma:comparer.steps.screenSelection"),
        i18next.t("figma:comparer.steps.tasksEdition"),
    ];

    private readonly DEFAULT_CANCEL_BUTTON_CONFIG: IButtonConfig = {
        text: i18next.t("common:buttonText.cancel"),
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
        initialActiveStep?: number,
    ) {
        this.componentElement = createDivElement({
            className: "figma-comparer",
        });
        this.activeStep = initialActiveStep ?? 0;

        this.initializeDataAndComponents();
        this.renderComponent();
    }

    private initializeDataAndComponents(): void {
        this.htmlComparer = new HtmlImageComparer();
        this.headerComponent = new FigmaComparerHeader(
            this.STEPS,
            this.onClose,
            this.activeStep,
        );

        this.bodyComponent = new FigmaComparerBody(
            this.figmaClient,
            this.onSelectedItemChange.bind(this),
            this.onTasksChange.bind(this),
            this.updateFooter.bind(this),
            this.showLoading.bind(this),
            this.hideLoading.bind(this),
            this.teamIds,
            this.activeStep,
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
            text: i18next.t("common:buttonText.previous"),
            variant: "contained",
            color: "primary",
            onClick: this.handlePrevious.bind(this),
        };
    }

    private createNextButtonConfig(): IButtonConfig {
        return {
            text: i18next.t("common:buttonText.next"),
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
            .findDifferencePosition(this.selectedFigmaScreen.imageUrl)
            .then((diffPosition) => {
                this.handleImageComparisonResult(diffPosition);
            })
            .catch((error) => {
                console.error("Error during image comparison:", error);
                console.trace();
            })
            .finally(() => {
                this.hideLoading();
            });
    }

    private handleImageComparisonResult(diffPosition: any): void {
        if (diffPosition) {
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
        this.updateComponentsStep();
        this.updateFooterComponent();
    }

    showLoading() {
        const loadingModal = createDivElement({ className: "loading-modal" });
        const loadingSpinner = createDivElement({
            className: "loading-spinner",
        });
        loadingModal.appendChild(loadingSpinner);
        this.componentElement.appendChild(loadingModal);
    }

    hideLoading() {
        const loadingModal =
            this.componentElement.querySelector(".loading-modal");
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
