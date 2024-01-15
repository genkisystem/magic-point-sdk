import { createButton, createDivElement } from "../../utils/html";
import { Component } from "../common";
import { FormManager } from "../form";
import { Task } from "../list-task/types/Task";
import { Type } from "../list-task/types/Type";
import css from "./task.scss";

export interface ITask {
    title: string;
    description: string;
    image: string;
    pageX: number;
    pageY: number;
    taskStatus?: Type;
    assignee?: Type | null;
    issueType?: Type;
    pointCoordinate: string;
    screenSize: number;
}

export interface TaskExtended extends Task { }

export class TaskEditorComponent implements Component {
    private taskData: ITask;
    private element: HTMLElement;
    // TODO: mapping
    private formManager: FormManager = new FormManager({
        apiKey: "ap8BuTMGR43fFzXuDze1Ve2pU7ZZvEjmvQMETTyPQRWMGMsrrMxiAsD9jvjKl52NZ4gKhuYu72mjd7wSCkQOCTwoOi62oazYzR5f3I1kmgUZhzNymAhA8HN5aRxtgOad",
        lng: 'en'
    });
    private onSubmit: (updatedTask: ITask) => void;
    private onCancel: () => void;

    constructor(
        taskData: ITask,
        onCancel: () => void,
        onSubmit: (updatedTask: ITask) => void
    ) {
        this.taskData = { ...taskData };
        this.onCancel = onCancel;
        this.onSubmit = onSubmit;

        this.element = createDivElement({ className: css["task-editor"] });
        this.renderComponent();
    }

    private createButtonDiv(): HTMLElement {
        const buttonDiv = createDivElement({ className: css["buttons"] });

        const cancelButton = createButton({
            text: "Cancel",
            variant: "outlined",
            color: "primary",
            onClick: () => this.onCancel(),
        });
        const submitButton = createButton({
            text: "OK",
            variant: "contained",
            color: "primary",
            onClick: () => this.handleSubmit(),
        });

        buttonDiv.appendChild(cancelButton);
        buttonDiv.appendChild(submitButton);

        return buttonDiv;
    }

    private handleSubmit() {
        const updatedData = this.formManager.collectFormData();
        if (updatedData.appData) {
            this.onSubmit({
                title: updatedData.appData.title,
                description: updatedData.appData.description,
                image: updatedData.appData.base64Images[0] ?? "",
                pageX: this.taskData.pageX,
                pageY: this.taskData.pageY,
                taskStatus: updatedData.appData.taskStatus,
                assignee: updatedData.appData.assignee,
                issueType: updatedData.appData.issueType,
                pointCoordinate: '',
                screenSize: 0.1
            });
        }
    }

    private renderForm(): void {
        const formDiv = createDivElement({ className: css["form-container"] });
        this.element.appendChild(formDiv);

        if (this.taskData.image) {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    console.error("Failed to get canvas context");
                    return;
                }

                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                // Now use this canvas for your formManager or other purposes
                this.formManager.createFormToDiv(canvas, formDiv, {
                    title: this.taskData.title,
                    description: this.taskData.description,
                    pointDom: "",
                    taskStatus: this.taskData.taskStatus
                        ? this.taskData.taskStatus
                        : { id: 1, name: "" },
                    assignee: this.taskData.assignee
                        ? this.taskData.assignee
                        : { id: 1, name: "" },
                    issueType: this.taskData.issueType
                        ? this.taskData.issueType
                        : { id: 1, name: "" },
                    endPoint: window.location.pathname,
                    base64Images: [this.taskData.image],
                    pointCoordinate: '',
                    screenSize: 0.1
                });
            };

            img.onerror = () => {
                console.error("Failed to load image");
            };
            const prefix = "data:image/png;base64,";
            if (!this.taskData.image.startsWith(prefix)) {
                this.taskData.image = prefix + this.taskData.image;
            }

            img.src = this.taskData.image;
        }
    }

    renderComponent(): void {
        this.element.innerHTML = "";
        this.renderForm();
        this.element.appendChild(this.createButtonDiv());
    }

    render(): HTMLElement {
        return this.element;
    }
}
