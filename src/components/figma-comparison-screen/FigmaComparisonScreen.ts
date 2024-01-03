import i18next from "i18next";
import bugSvg from "../../asset/bug.svg";
import collapsedIcon from "../../asset/collapsed-icon.svg";
import editSvg from "../../asset/editSvg.svg";
import figmaDark from "../../asset/figma-dark.svg";
import liveWebsite from "../../asset/live-website.svg";
import overlaySvg from "../../asset/overlay.svg";
import settingSvg from "../../asset/setting.svg";
import sliderSvg from "../../asset/slider.svg";
import unCollapsedIcon from "../../asset/un-collapsed-icon.svg";
import { GenericRequest } from "../../base";
import { ImageOverlay } from "../../services/image-comparator/overlay/ImageOverlay";
import { ImageComparisonSlider } from "../../services/image-comparator/slide/ImageComparatorSlide";
import { CanvasWithDots } from "../../services/image-comparer/ImageComparer";
import { resizeCanvas } from "../../utils/canvas";
import { getComposedPathForHTMLElement, getPointDom } from "../../utils/dom";
import {
    createButton,
    createDivElement,
    findElementAtPosition,
} from "../../utils/html";
import { ButtonComponent } from "../Button/ButtonComponent";
import { Component } from "../common";
import { FooterButtonConfigs } from "../figma-compare-footer/FigmaComparerFooter";
import { Task } from "../list-task/types/Task";
import { TaskEditorModal } from "../task-editor-modal/TaskEditorModal";
import { ITask } from "../task-editor/TaskEditorComponent";
import css from "./comparison.scss";

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
        private diffData?: CanvasWithDots
    ) {
        this.modeNameDisplay = createDivElement({
            className: css["mode-name-display"],
        });

        this.progressBar = document.createElement("input");

        this.imagePanel = createDivElement();
        this.overlayPanel = createDivElement();
        this.imageOverlay = new ImageOverlay(this.overlayPanel);

        this.imagePanel.style.position = "absolute";
        this.sliderPanel = createDivElement({ className: css["image-panel"] });
        this.imageSlider = new ImageComparisonSlider(this.sliderPanel);
        this.taskEditorModal = new TaskEditorModal();
        this.componentElement = createDivElement({
            className: css["modal-components-content-b"],
        });
        this.leftPanel = createDivElement({ className: css["left"] });
        this.previewElement = createDivElement({ className: css["right"] });
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
            })
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
                containerHeight
            );
            this.resizedBugCanvas = resizeCanvas(
                bugCanvas,
                containerWidth,
                containerHeight
            );
            this.resizedWebCanvas = resizeCanvas(
                webCanvas,
                containerWidth,
                containerHeight
            );

            this.imageSlider.create(
                this.resizedFigmaCanvas.toDataURL(),
                this.resizedBugCanvas.toDataURL()
            );
            this.imageSlider.disableSlider();
            this.handleDisplayBug();
        });
    }

    private createCollapsibleItems(): void {
        this.previewElement.innerHTML = "";
        if (!this.tasks) return;

        const taskParent = createDivElement({ className: css["task-parent"] });
        this.tasks.forEach((t, index) => {
            const task = this.createTask(t, index);
            taskParent.appendChild(task);
        });
        this.previewElement.appendChild(taskParent);
    }

    private createTask(t: ITask, index: number): HTMLElement {
        const task = createDivElement({ className: css["task"] });
        task.appendChild(this.createTaskHeader(index));
        task.appendChild(this.createTaskInner(t, index));
        return task;
    }

    private createTaskHeader(index: number): HTMLElement {
        const taskHeader = createDivElement({ className: css["task-header"] });

        const collapseDiv = createDivElement({
            className: css["collapse-div"],
        });
        const collapseButton = this.createCollapseButton(taskHeader);
        const taskTitle = createDivElement({ className: css["task-title"] });
        taskTitle.textContent = `#${index + 1}`;

        collapseDiv.appendChild(collapseButton);
        collapseDiv.appendChild(taskTitle);

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = css["task-checkbox"];
        checkbox.checked = this.checkedTasks.includes(index);

        checkbox.addEventListener("change", (event) => {
            const isChecked = checkbox.checked;
            this.handleCheckboxChange(index, isChecked);
        });

        const checkboxWrapper = document.createElement("div");
        checkboxWrapper.className = css["checkbox-wrapper"];
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
                (item) => item !== index
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
            this.checkedTasks.includes(i)
        );

        const originalWidth = document.body.style.width;
        const originalHeight = document.body.style.height;
        const originalMaxHeight = document.body.style.maxHeight;
        const originalMinHeight = document.body.style.minHeight;

        document.body.style.width = `${1920}px`;
        document.body.style.height = `${1080}px`;
        document.body.style.maxHeight = `${1080}px`;
        document.body.style.minHeight = `${1080}px`;

        const request = selectedTask.map((t): GenericRequest<Task> => {
            let pDom = "";

            const element = findElementAtPosition(
                document.body,
                t.pageX,
                t.pageY
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
                },
            };
        });

        document.body.style.width = originalWidth;
        document.body.style.height = originalHeight;
        document.body.style.minHeight = originalMinHeight;
        document.body.style.maxHeight = originalMaxHeight;

        return request;
    }

    private getModeName(mode: CompareMode): string {
        switch (mode) {
            case CompareMode.Bug:
                return i18next.t('figma:comparisonScreen.modeName.bug');
            case CompareMode.Slider:
                return i18next.t('figma:comparisonScreen.modeName.slider');
            case CompareMode.FigmaDark:
                return i18next.t('figma:comparisonScreen.modeName.figmaDark');
            case CompareMode.LiveWebsite:
                return i18next.t('figma:comparisonScreen.modeName.liveWebsite');
            case CompareMode.Overlay:
                return i18next.t('figma:comparisonScreen.modeName.overlay');
            default:
                return "";
        }
    }

    private createControlPanel(): HTMLElement {
        const controlPanel = createDivElement({
            className: css["control-panel"],
        });

        const panelHeader = createDivElement({
            className: css["panel-header"],
        });
        const controlPanelIcon = document.createElement("span");
        controlPanelIcon.innerHTML = settingSvg;

        panelHeader.appendChild(controlPanelIcon);

        this.modeNameDisplay.textContent = this.getModeName(this.mode);
        panelHeader.appendChild(this.modeNameDisplay);

        const panelBody = createDivElement({ className: css["panel-body"] });
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
            CompareMode.FigmaDark
        );
        const liveBtn = this.createButtonWithIcon(
            liveWebsite,
            CompareMode.LiveWebsite
        );
        const sliderBtn = this.createButtonWithIcon(
            sliderSvg,
            CompareMode.Slider
        );
        const overlayBtn = this.createButtonWithIcon(
            overlaySvg,
            CompareMode.Overlay
        );
        const bugBtn = this.createButtonWithIcon(bugSvg, CompareMode.Bug);

        // Append buttons to the panel body
        [figmaBtn, liveBtn, sliderBtn, overlayBtn, bugBtn].forEach((btn) =>
            panelBody.appendChild(btn)
        );

        controlPanel.appendChild(panelHeader);
        controlPanel.appendChild(panelBody);

        this.progressBar.type = "range";
        this.progressBar.min = "0";
        this.progressBar.max = "100";
        this.progressBar.value = "50";
        this.progressBar.className = css["progress-bar"];
        this.progressBar.style.display = "none";

        controlPanel.appendChild(this.progressBar);

        return controlPanel;
    }

    private createButtonWithIcon(
        iconSvg: string,
        mode: CompareMode
    ): HTMLElement {
        const button = createButton({
            extendClasses: [css["button"]],
        });
        const icon = document.createElement("span");
        icon.innerHTML = iconSvg;
        button.appendChild(icon);

        button.setAttribute("data-mode", mode);
        // Set initial button style based on the default mode
        if (this.mode === mode) {
            button.classList.add(css["active"]);
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
            this.resizedFigmaCanvas?.toDataURL() ?? ""
        );
        this.imageOverlay.setOverlayImage(
            this.resizedBugCanvas?.toDataURL() ?? "",
            parseInt(this.progressBar.value) / 100
        );

        // Update overlay opacity on progress bar change
        this.progressBar.addEventListener("input", () => {
            const opacity = parseInt(this.progressBar.value) / 100;
            this.imageOverlay.adjustOverlayOpacity(opacity);
        });
    }

    private updateButtonStyles(): void {
        const buttons = this.componentElement.querySelectorAll(
            `.${css["button"]}`
        );
        buttons.forEach((button) => {
            const mode = button.getAttribute("data-mode");
            if (this.mode === mode) {
                button.classList.add(css["active"]);
            } else {
                button.classList.remove(css["active"]);
            }
        });
    }

    // Method to create a collapsible button
    private createCollapseButton(taskHeader: HTMLElement): HTMLElement {
        const collapseButton = createDivElement({
            className: css["collapse-button"],
        });
        const collapseIcon = document.createElement("span");
        collapseIcon.classList.add(css["collapse-icon"]);
        collapseIcon.innerHTML = unCollapsedIcon;
        collapseButton.appendChild(collapseIcon);

        collapseButton.addEventListener("click", () =>
            this.toggleCollapse(taskHeader, collapseIcon)
        );
        return collapseButton;
    }

    // Toggle collapse functionality
    private toggleCollapse(
        taskHeader: HTMLElement,
        collapseIcon: HTMLElement
    ): void {
        const taskInner = taskHeader.nextElementSibling as HTMLElement;
        const isCollapsed = taskInner.classList.toggle(css["collapsed"]);
        collapseIcon.innerHTML = isCollapsed ? collapsedIcon : unCollapsedIcon;
    }

    private createTaskInner(t: ITask, index: number): HTMLElement {
        const taskInner = createDivElement({ className: css["task-inner"] });

        // Title Label and Read-Only Field
        const titleLabel = document.createElement("label");
        titleLabel.className = css["input-label"];
        titleLabel.textContent = i18next.t('figma:comparisonScreen.taskInnerCreation.title');
        taskInner.appendChild(titleLabel);

        const titleField = createDivElement({
            className: css["read-only-field"],
        });
        titleField.textContent = t.title;
        taskInner.appendChild(titleField);

        // Description Label and Read-Only Field
        const descriptionLabel = document.createElement("label");
        descriptionLabel.className = css["input-label"];
        descriptionLabel.textContent = i18next.t('figma:comparisonScreen.taskInnerCreation.description');
        taskInner.appendChild(descriptionLabel);

        const descriptionField = createDivElement({
            className: css["read-only-field"],
        });
        descriptionField.innerHTML = t.description;
        taskInner.appendChild(descriptionField);
        const icon = document.createElement("span");
        icon.innerHTML = editSvg;

        const eButton = new ButtonComponent({
            startIcon: icon,
            extendClasses: [css["edit-button"]],
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