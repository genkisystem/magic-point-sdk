import { FormManager } from "@components/form";
import { Task } from "@components/list-task/types/Task";
import { Type } from "@components/list-task/types/Type";
import { ElementBounds } from "@services";
import { BASE64_IMAGE_PREFIX } from "@utils";
import { GenericRequest } from "src/base";

export interface ITask {
    title: string;
    description: string;
    image: string;
    pageX: number;
    pageY: number;
    taskStatus?: Type;
    assignee?: Type;
    issueType?: Type;
    pointCoordinate: string;
    screenSize: number;
    bugPosition: ElementBounds;
}

export class TaskEditorModal {
    private taskData!: ITask;
    private onTaskUpdate: ((updatedTask: ITask) => void) | null = null;
    private formManager: FormManager;
    private readonly noneOption: Type = { id: -1, name: "" };

    constructor() {
        this.formManager = new FormManager();
        this.setupFormSubmission();
    }

    public initialize(
        taskData: ITask,
        onTaskUpdate: (updatedTask: ITask) => void,
    ): void {
        this.taskData = taskData;
        this.onTaskUpdate = onTaskUpdate;
    }

    private setupFormSubmission(): void {
        this.formManager.setCallback((formData: GenericRequest<Task>) => {
            if (this.onTaskUpdate) {
                this.onTaskUpdate({
                    title: formData.appData.title,
                    description: formData.appData.description,
                    image: formData.appData.base64Images[0] ?? "",
                    pageX: this.taskData.pageX,
                    pageY: this.taskData.pageY,
                    taskStatus: formData.appData.taskStatus,
                    assignee: formData.appData.assignee
                        ? formData.appData.assignee
                        : undefined,
                    issueType: formData.appData.issueType,
                    pointCoordinate: `${0}#${0}`,
                    screenSize: window.innerWidth,
                    bugPosition: this.taskData.bugPosition,
                    });
            }
            this.formManager.closeForm();
        });
    }

    private renderForm(): void {
        if (!this.taskData) {
            return;
        }
        if (this.taskData) {
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

                this.formManager.createForm(canvas, {
                    title: this.taskData.title,
                    description: this.taskData.description,
                    pointDom: "",
                    taskStatus: this.taskData.taskStatus
                        ? this.taskData.taskStatus
                        : this.noneOption,
                    assignee: this.taskData.assignee
                        ? this.taskData.assignee
                        : this.noneOption,
                    issueType: this.taskData.issueType
                        ? this.taskData.issueType
                        : this.noneOption,
                    endPoint: window.location.pathname,
                    base64Images: [this.taskData.image],
                    pointCoordinate: `${0}#${0}`,
                    screenSize: window.innerWidth,
                });
            };

            img.onerror = () => {
                console.error("Failed to load image");
            };
            if (!this.taskData.image.startsWith(BASE64_IMAGE_PREFIX)) {
                this.taskData.image = BASE64_IMAGE_PREFIX + this.taskData.image;
            }

            img.src = this.taskData.image;
        }
    }

    public showModal(): void {
        this.renderForm();
    }
}
