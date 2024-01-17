import { CanvasWithDots, FigmaClient } from "@services";
import { createDivElement } from "@utils";
import { GenericRequest } from "../../base";
import { Component } from "../common";
import { FooterButtonConfigs } from "../figma-compare-footer/FigmaComparerFooter";
import { FigmaComparisonScreen } from "../figma-comparison-screen/FigmaComparisonScreen";
import { FigmaLoginBody } from "../figma-login/FigmaLogin";
import { FigmaSelectionScreen } from "../figma-selection-screen/FigmaSelectionScreen";
import { Task } from "../list-task/types/Task";
import { TreeItem } from "../tree/tree";

export class FigmaComparerBody implements Component {
    private _activeStepIndex: number;
    private container: HTMLElement;
    private _diffData?: CanvasWithDots;

    private loginScreen!: HTMLElement;

    constructor(
        private figmaClient: FigmaClient,
        private onSelectedItemChange: (selectedItem: TreeItem) => void,
        private onTaskChange: (t: GenericRequest<Task>[]) => void,
        private updateFooter: (configs: FooterButtonConfigs) => void,
        private teamIds: string[],
        initialActiveScreenIndex?: number,
    ) {
        this._activeStepIndex = initialActiveScreenIndex ?? 0;
        this.container = createDivElement({ className: "figma-comparer-body" });

        this.renderComponent();
    }

    set activeStepIndex(newValue: number) {
        this._activeStepIndex = newValue;
        this.renderComponent();
    }

    get activeStepIndex() {
        return this._activeStepIndex;
    }

    set diffData(newValue: CanvasWithDots | undefined) {
        this._diffData = newValue;
        this.renderComponent();
    }

    get diffData() {
        return this._diffData;
    }

    renderComponent(): void {
        this.container.innerHTML = "";

        switch (this._activeStepIndex) {
            case 0:
                if (!this.loginScreen) {
                    this.loginScreen = new FigmaLoginBody(
                        this.figmaClient,
                        this.updateFooter,
                        this.teamIds,
                    ).render();
                }
                this.container.appendChild(this.loginScreen);
                break;
            case 1:
                const selection = new FigmaSelectionScreen(
                    this.figmaClient,
                    this.updateFooter,
                    this.onSelectedItemChange,
                );
                this.container.appendChild(selection.render());
                break;
            case 2:
                const compare = new FigmaComparisonScreen(
                    this.updateFooter,
                    this.onTaskChange,
                    this.diffData,
                );
                this.container.appendChild(compare.render());
                break;
        }
    }

    render(): HTMLElement {
        return this.container;
    }
}
