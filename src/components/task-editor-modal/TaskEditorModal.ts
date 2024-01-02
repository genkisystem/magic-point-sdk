import { BaseModal } from "../base-modal/BaseModal";
import { ITask, TaskEditorComponent } from "../task-editor/TaskEditorComponent";

export class TaskEditorModal {
    private myModal: BaseModal;
    private taskData: ITask | null = null;
    private onTaskUpdate: ((updatedTask: ITask) => void) | null = null;

    constructor() {
        this.myModal = new BaseModal("md");
    }

    public initialize(
        taskData: ITask,
        onTaskUpdate: (updatedTask: ITask) => void
    ): void {
        this.taskData = taskData;
        this.onTaskUpdate = onTaskUpdate;
    }

    private setupModal(): void {
        if (!this.taskData || !this.onTaskUpdate) {
            throw new Error(
                "Task data and update callback must be initialized before showing the modal."
            );
        }

        const myComponent = new TaskEditorComponent(
            this.taskData,
            () => this.hideModal(),
            (updatedTask: ITask) => this.updateTaskData(updatedTask)
        );
        this.myModal.setBody(myComponent);
    }

    private updateTaskData(updatedTask: ITask): void {
        if (!this.onTaskUpdate) {
            throw new Error("Update callback function is not initialized.");
        }

        this.taskData = updatedTask;
        this.onTaskUpdate(updatedTask);
        this.hideModal();
    }

    public showModal(): void {
        this.setupModal();
        this.myModal.show();
    }

    public hideModal(): void {
        this.myModal.hide();
    }
}
