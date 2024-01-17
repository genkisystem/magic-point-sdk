import {
    bugSvg,
    collapsedIcon,
    editSvg,
    figmaDark,
    liveWebsite,
    overlaySvg,
    settingSvg,
    sliderSvg,
    unCollapsedIcon,
} from "@icons";

import { CanvasWithDots, ImageComparisonSlider, ImageOverlay } from "@services";

import {
    createButton,
    createDivElement,
    findElementAtPosition,
    getComposedPathForHTMLElement,
    getPointDom,
    resizeCanvas,
} from "@utils";

import i18next from "i18next";
import { GenericRequest } from "../../base";
import { ButtonComponent } from "../Button/ButtonComponent";
import { Component } from "../common";
import { FooterButtonConfigs } from "../figma-compare-footer/FigmaComparerFooter";
import { Task } from "../list-task/types/Task";
import { ITask, TaskEditorModal } from "../task-editor-modal/TaskEditorModal";

enum CompareMode {
    Bug = "Bug",
    Slider = "slider",
    FigmaDark = "figmaDark",
    LiveWebsite = "liveWebsite",
    Overlay = "overlay",
}

export class FigmaComparisonScreen implements Component {
    private static readonly CANVAS_MARGIN = 12;

    private componentElement: HTMLElement;
    private previewElement: HTMLElement;
    private taskEditorModal: TaskEditorModal;
    private tasks: ITask[];
    private checkedTasks: number[];
    private imageSlider: ImageComparisonSlider;
    private leftPanel: HTMLElement;

    private sliderPanel: HTMLElement;
    private overlayPanel: HTMLElement;
    private imageOverlay: ImageOverlay;
    private progressBar: HTMLInputElement;
    private modeNameDisplay: HTMLElement;

    private imagePanel: HTMLElement;

    private resizedFigmaCanvas: HTMLCanvasElement | null = null;
    private resizedWebCanvas: HTMLCanvasElement | null = null;
    private resizedBugCanvas: HTMLCanvasElement | null = null;

    private mode: CompareMode;

    constructor(
        private updateFooter: (configs: FooterButtonConfigs) => void,
        private onTasksChange: (t: GenericRequest<Task>[]) => void,
        private diffData?: CanvasWithDots,
    ) {
        this.modeNameDisplay = createDivElement({
            className: "mode-name-display",
        });

        this.progressBar = document.createElement("input");

        this.imagePanel = createDivElement();
        this.overlayPanel = createDivElement();
        this.imageOverlay = new ImageOverlay(this.overlayPanel);

        this.imagePanel.style.position = "absolute";
        this.sliderPanel = createDivElement({ className: "image-panel" });
        this.imageSlider = new ImageComparisonSlider(this.sliderPanel);
        this.taskEditorModal = new TaskEditorModal();
        this.componentElement = createDivElement({
            className: "figma-comparison-container",
        });
        this.leftPanel = createDivElement({
            className: "figma-comparison-left",
        });
        this.previewElement = createDivElement({
            className: "figma-comparison-right",
        });
        this.tasks = this.initializeTasks();
        this.checkedTasks = this.tasks.map((_, i) => i);
        this.mode = CompareMode.Bug;
        this.renderComponent();
        this.updateFooterBasedOnCheckedTasks();
    }

    private initializeTasks(): ITask[] {
        if (!this.diffData) return [];
        return this.diffData.diffPositions.map(
            (t, index): ITask => ({
                title: `Task #${index + 1} Title`,
                description: `Task #${index + 1} Description`,
                image: t.image ?? "data:image/png;base64,...",
                pageX: t.pageX,
                pageY: t.pageY,
                pointCoordinate: `${0}#${0}`,
                screenSize: window.innerWidth,
            }),
        );
    }
    private resizeCanvasAndInitSlider(target: HTMLElement): void {
        if (!this.diffData) return;

        requestAnimationFrame(() => {
            const { bugCanvas, figmaCanvas, webCanvas } = this.diffData!;
            const containerWidth =
                target.clientWidth - FigmaComparisonScreen.CANVAS_MARGIN;
            const containerHeight =
                target.clientHeight - FigmaComparisonScreen.CANVAS_MARGIN;

            this.resizedFigmaCanvas = resizeCanvas(
                figmaCanvas,
                containerWidth,
                containerHeight,
            );
            this.resizedBugCanvas = resizeCanvas(
                bugCanvas,
                containerWidth,
                containerHeight,
            );
            this.resizedWebCanvas = resizeCanvas(
                webCanvas,
                containerWidth,
                containerHeight,
            );

            this.imageSlider.create(
                this.resizedFigmaCanvas.toDataURL(),
                this.resizedWebCanvas.toDataURL(),
            );
            this.imageSlider.disableSlider();
            this.handleDisplayBug();
        });
    }

    private createCollapsibleItems(): void {
        this.previewElement.innerHTML = "";
        if (!this.tasks) return;

        const taskParent = createDivElement({ className: "task-parent" });
        if (this.tasks.length === 0) {
            const notFound = createDivElement({ className: "not-found" });
            notFound.textContent = "No errors found";
            taskParent.appendChild(notFound);
        }
        this.tasks.forEach((t, index) => {
            const task = this.createTask(t, index);
            taskParent.appendChild(task);
        });

        this.previewElement.appendChild(taskParent);
    }

    private createTask(t: ITask, index: number): HTMLElement {
        const task = createDivElement({ className: "task" });
        task.appendChild(this.createTaskHeader(index));
        task.appendChild(this.createTaskInner(t, index));
        return task;
    }

    private createTaskHeader(index: number): HTMLElement {
        const taskHeader = createDivElement({ className: "task-header" });

        const collapseDiv = createDivElement({
            className: "collapse-div",
        });
        const collapseButton = this.createCollapseButton(taskHeader);
        const taskTitle = createDivElement({ className: "task-title" });
        taskTitle.textContent = `#${index + 1}`;

        collapseDiv.appendChild(collapseButton);
        collapseDiv.appendChild(taskTitle);

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "task-checkbox";
        checkbox.checked = this.checkedTasks.includes(index);

        checkbox.addEventListener("change", (event) => {
            const isChecked = checkbox.checked;
            this.handleCheckboxChange(index, isChecked);
        });

        const checkboxWrapper = document.createElement("div");
        checkboxWrapper.className = "checkbox-wrapper";
        checkboxWrapper.appendChild(checkbox);

        taskHeader.appendChild(collapseDiv);
        taskHeader.appendChild(checkboxWrapper);
        return taskHeader;
    }

    private handleCheckboxChange(index: number, isChecked: boolean): void {
        if (isChecked) {
            this.checkedTasks.push(index);
        } else {
            this.checkedTasks = this.checkedTasks.filter(
                (item) => item !== index,
            );
        }
        this.updateFooterBasedOnCheckedTasks();
    }

    private updateFooterBasedOnCheckedTasks(): void {
        const configs: FooterButtonConfigs = {
            nextButtonConfig: {
                text: `Create ${this.checkedTasks.length} tasks`,
                disabled: this.checkedTasks.length > 0 ? false : true,
            },
        };
        this.onTasksChange(this.createTaskRequest());
        this.updateFooter(configs);
    }

    private createTaskRequest(): GenericRequest<Task>[] {
        const selectedTask = this.tasks.filter((_, i) =>
            this.checkedTasks.includes(i),
        );

        const originalStyles = {
            width: document.body.style.width,
            height: document.body.style.height,
            maxHeight: document.body.style.maxHeight,
            minHeight: document.body.style.minHeight,
            overflow: document.body.style.overflow,
        };

        document.body.style.width = `${1920}px`;
        document.body.style.height = `${1080}px`;
        document.body.style.maxHeight = `${1080}px`;
        document.body.style.minHeight = `${1080}px`;
        document.body.style.overflow = "hidden";

        const request = selectedTask.map((t): GenericRequest<Task> => {
            let pDom = "";

            const element = findElementAtPosition(
                document.body,
                t.pageX,
                t.pageY,
            );
            if (element) {
                pDom = getPointDom(getComposedPathForHTMLElement(element));
            }

            return {
                appData: {
                    assignee: t.assignee ?? {
                        id: 0,
                        name: "",
                    },
                    title: t.title,
                    description: t.description,
                    base64Images: [t.image],
                    pointDom: pDom,
                    issueType: t.issueType ?? {
                        id: 0,
                        name: "",
                    },
                    taskStatus: t.taskStatus ?? {
                        id: 0,
                        name: "",
                    },
                    endPoint: window.location.pathname,
                    screenSize: window.innerWidth,
                    pointCoordinate: `${0}#${0}`,
                },
            };
        });
        document.body.style.width = originalStyles.width;
        document.body.style.height = originalStyles.height;
        document.body.style.minHeight = originalStyles.minHeight;
        document.body.style.maxHeight = originalStyles.maxHeight;
        document.body.style.overflow = originalStyles.overflow;

        return request;
    }

    private getModeName(mode: CompareMode): string {
        switch (mode) {
            case CompareMode.Bug:
                return i18next.t("figma:comparisonScreen.modeName.bug");
            case CompareMode.Slider:
                return i18next.t("figma:comparisonScreen.modeName.slider");
            case CompareMode.FigmaDark:
                return i18next.t("figma:comparisonScreen.modeName.figmaDark");
            case CompareMode.LiveWebsite:
                return i18next.t("figma:comparisonScreen.modeName.liveWebsite");
            case CompareMode.Overlay:
                return i18next.t("figma:comparisonScreen.modeName.overlay");
            default:
                return "";
        }
    }

    private createControlPanel(): HTMLElement {
        const controlPanel = createDivElement({
            className: "control-panel",
        });

        const panelHeader = createDivElement({
            className: "panel-header",
        });
        const controlPanelIcon = document.createElement("span");
        controlPanelIcon.innerHTML = settingSvg;

        panelHeader.appendChild(controlPanelIcon);

        this.modeNameDisplay.textContent = this.getModeName(this.mode);
        panelHeader.appendChild(this.modeNameDisplay);

        const panelBody = createDivElement({ className: "panel-body" });
        panelBody.style.display = "none";

        // Toggle collapsible panel
        panelHeader.addEventListener("click", () => {
            panelBody.style.display =
                panelBody.style.display === "none" ? "flex" : "none";
            this.progressBar.style.display =
                this.mode === CompareMode.Overlay ? "block" : "none";
        });

        // Creating and adding event listeners to buttons
        const figmaBtn = this.createButtonWithIcon(
            figmaDark,
            CompareMode.FigmaDark,
        );
        const liveBtn = this.createButtonWithIcon(
            liveWebsite,
            CompareMode.LiveWebsite,
        );
        const sliderBtn = this.createButtonWithIcon(
            sliderSvg,
            CompareMode.Slider,
        );
        const overlayBtn = this.createButtonWithIcon(
            overlaySvg,
            CompareMode.Overlay,
        );
        const bugBtn = this.createButtonWithIcon(bugSvg, CompareMode.Bug);

        // Append buttons to the panel body
        [figmaBtn, liveBtn, sliderBtn, overlayBtn, bugBtn].forEach((btn) =>
            panelBody.appendChild(btn),
        );

        controlPanel.appendChild(panelHeader);
        controlPanel.appendChild(panelBody);

        this.progressBar.type = "range";
        this.progressBar.min = "0";
        this.progressBar.max = "100";
        this.progressBar.value = "50";
        this.progressBar.className = "progress-bar";
        this.progressBar.style.display = "none";

        controlPanel.appendChild(this.progressBar);

        return controlPanel;
    }

    private createButtonWithIcon(
        iconSvg: string,
        mode: CompareMode,
    ): HTMLElement {
        const button = createButton({
            extendClasses: ["mode-button"],
        });
        const icon = document.createElement("span");
        icon.innerHTML = iconSvg;
        button.appendChild(icon);

        button.setAttribute("data-mode", mode);
        // Set initial button style based on the default mode
        if (this.mode === mode) {
            button.classList.add("mode-button-active");
        }

        // Add an event listener to the button
        button.addEventListener("click", () => {
            this.setActiveMode(mode);
            this.handleModeChange(mode);
        });

        return button;
    }

    private setActiveMode(newMode: CompareMode): void {
        this.mode = newMode;
        this.modeNameDisplay.textContent = this.getModeName(newMode);
        this.updateButtonStyles();
    }

    private handleModeChange(mode: CompareMode): void {
        this.imageSlider.disableSlider();
        this.overlayPanel.style.display =
            mode === CompareMode.Overlay ? "block" : "none";
        this.progressBar.style.display =
            mode === CompareMode.Overlay ? "block" : "none";

        switch (mode) {
            case CompareMode.Bug:
                this.handleDisplayBug();
                break;
            case CompareMode.Slider:
                this.imageSlider.enableSlider();
                break;
            case CompareMode.FigmaDark:
                this.handleDisplayFigma();
                break;
            case CompareMode.LiveWebsite:
                this.handleDisplayLiveWebsite();
                break;
            case CompareMode.Overlay:
                this.handleDisplayOverlay();
                break;
        }
    }

    private handleDisplayBug() {
        if (!this.resizedBugCanvas) return;
        this.imagePanel.innerHTML = `<img src="${this.resizedBugCanvas.toDataURL()}" />`;
    }

    private handleDisplayFigma() {
        if (!this.resizedFigmaCanvas) return;
        this.imagePanel.innerHTML = `<img src="${this.resizedFigmaCanvas.toDataURL()}" />`;
    }

    private handleDisplayLiveWebsite() {
        if (!this.resizedWebCanvas) return;
        this.imagePanel.innerHTML = `<img src="${this.resizedWebCanvas.toDataURL()}" />`;
    }

    private handleDisplayOverlay() {
        this.imageOverlay.setBaseImage(
            this.resizedFigmaCanvas?.toDataURL() ?? "",
        );
        this.imageOverlay.setOverlayImage(
            this.resizedWebCanvas?.toDataURL() ?? "",
            parseInt(this.progressBar.value) / 100,
        );

        // Update overlay opacity on progress bar change
        this.progressBar.addEventListener("input", () => {
            const opacity = parseInt(this.progressBar.value) / 100;
            this.imageOverlay.adjustOverlayOpacity(opacity);
        });
    }

    private updateButtonStyles(): void {
        const buttons = this.componentElement.querySelectorAll(".mode-button");
        buttons.forEach((button) => {
            const mode = button.getAttribute("data-mode");
            if (this.mode === mode) {
                button.classList.add("mode-button-active");
            } else {
                button.classList.remove("mode-button-active");
            }
        });
    }

    // Method to create a collapsible button
    private createCollapseButton(taskHeader: HTMLElement): HTMLElement {
        const collapseButton = createDivElement({
            className: "collapse-button",
        });
        const collapseIcon = document.createElement("span");
        collapseIcon.classList.add("collapse-icon");
        collapseIcon.innerHTML = unCollapsedIcon;
        collapseButton.appendChild(collapseIcon);

        collapseButton.addEventListener("click", () =>
            this.toggleCollapse(taskHeader, collapseIcon),
        );
        return collapseButton;
    }

    // Toggle collapse functionality
    private toggleCollapse(
        taskHeader: HTMLElement,
        collapseIcon: HTMLElement,
    ): void {
        const taskInner = taskHeader.nextElementSibling as HTMLElement;
        const isCollapsed = taskInner.classList.toggle("collapsed");
        collapseIcon.innerHTML = isCollapsed ? collapsedIcon : unCollapsedIcon;
    }

    private createTaskInner(t: ITask, index: number): HTMLElement {
        const taskInner = createDivElement({ className: "task-inner" });

        const titleWrapper = createDivElement({ className: "title-wrapper" });

        const titleLabel = document.createElement("label");
        titleLabel.className = "input-label";
        titleLabel.textContent = i18next.t(
            "figma:comparisonScreen.taskInnerCreation.title",
        );
        titleWrapper.appendChild(titleLabel);

        const titleField = createDivElement({
            className: "read-only-field",
        });
        titleField.textContent = t.title;
        titleWrapper.appendChild(titleField);

        taskInner.appendChild(titleWrapper);

        const descriptionWrapper = createDivElement({
            className: "description-wrapper",
        });

        const descriptionLabel = document.createElement("label");
        descriptionLabel.className = "input-label";
        descriptionLabel.textContent = i18next.t(
            "figma:comparisonScreen.taskInnerCreation.description",
        );
        descriptionWrapper.appendChild(descriptionLabel);

        const descriptionField = createDivElement({
            className: "read-only-field",
        });
        descriptionField.innerHTML = t.description;
        descriptionWrapper.appendChild(descriptionField);

        taskInner.appendChild(descriptionWrapper);

        const icon = document.createElement("span");
        icon.innerHTML = editSvg;

        const eButton = new ButtonComponent({
            startIcon: icon,
            extendClasses: ["edit-button"],
            variant: "outlined",
            onClick: () => this.handleClickEdit(index),
        });

        taskInner.appendChild(eButton.render());

        return taskInner;
    }

    private handleClickEdit(index: number) {
        const selectedTask = this.tasks[index];

        this.taskEditorModal.initialize(selectedTask, (updatedTask) => {
            this.tasks[index] = updatedTask;
            this.renderComponent();
            this.updateFooterBasedOnCheckedTasks();
        });
        this.taskEditorModal.showModal();
    }

    renderComponent(): void {
        this.componentElement.innerHTML = "";
        const controlPanel = this.createControlPanel();
        this.leftPanel.appendChild(controlPanel);

        this.leftPanel.appendChild(this.imagePanel);
        this.leftPanel.appendChild(this.sliderPanel);
        this.leftPanel.appendChild(this.overlayPanel);

        this.componentElement.appendChild(this.leftPanel);
        this.componentElement.appendChild(this.previewElement);

        this.createCollapsibleItems();
        this.resizeCanvasAndInitSlider(this.sliderPanel);
    }

    render(): HTMLElement {
        return this.componentElement;
    }
}
