import Quill from "quill";
import loading from "../../asset/Spinner-1s-200px.svg";

import { ImageEditorWrapper } from "../image-editor";
import css from "../../index.scss";
import formCss from './form.scss'
import './text-editor.css'

import { Base, ConfigurationOptions, Request, Response } from "../../base";
import { Type as Assignee, Type as IssueType, Type as IssueStatus } from "../list-task/types/Type";
import { Task } from "../list-task/types/Task";
import { EventBusInstance } from "../EventBus";
import { NotificationManager } from '../notification/notification';

export class FormManager extends Base {
    private form: HTMLFormElement | null = null;
    private imageEditorWrapper!: ImageEditorWrapper;
    private textEditor!: Quill;
    private notificationManager: NotificationManager;

    private onSubmitCallback: (data: Request<Task>) => void = () => { };
    private currentDomString: string;
    private assignees: Assignee[] = [];
    private issueTypes: IssueType[] = [];
    private issueStatuses: IssueStatus[] = [];
    private BASE64_IMAGE_PREFIX: string = "data:image/png;base64,"


    private currentSelectedAssignee: Assignee = {} as Assignee;
    private currentSelectedIssueType: IssueType = {} as IssueType;
    private currentSelectedIssueStatus: IssueStatus = {} as IssueStatus;
    private currentTaskToUpdate: Task = {} as Task;
    public types: { [key in 'assignee' | 'issueType' | 'issueStatus']: string } = {
        assignee: 'assignee',
        issueType: 'issue-type',
        issueStatus: 'issue-status'
    }

    constructor(config: ConfigurationOptions) {
        super(config)
        this.loadEditorStyles()
        this.currentDomString = ''
        this.notificationManager = new NotificationManager()
    }

    private isUpdatingTask(): boolean {
        return !!this.currentTaskToUpdate && Object.keys(this.currentTaskToUpdate).length > 0
    }

    async fetchType(type: string): Promise<void> {
        switch (type.toLowerCase()) {
            case this.types.assignee: {
                const res = await this.invoke<Response<Assignee[]>>('GET', 'sdk/assignees')
                if (res && !res.hasError && res.appData?.length > 0) {
                    this.assignees = [{ id: -1, name: '' }, ...res.appData]
                }
                break
            }
            case this.types.issueType: {
                const res = await this.invoke<Response<IssueType[]>>('GET', 'sdk/issue-types')
                if (res && !res.hasError && res.appData?.length > 0) {
                    this.issueTypes = res.appData
                }
                break
            }
            case this.types.issueStatus: {
                const res = await this.invoke<Response<IssueStatus[]>>('GET', 'sdk/statues')
                if (res && !res.hasError && res.appData?.length > 0) {
                    this.issueStatuses = res.appData
                }
                break
            }
            default: break
        }

    }

    public setCurrentDomString(domString: string) {
        this.currentDomString = domString;
    }

    public getCurrentDomString(): string {
        return this.currentDomString || this.currentTaskToUpdate.pointDom || ''
    }

    public createForm(canvasImage: HTMLCanvasElement, taskToUpdate?: Task): FormManager {
        if (taskToUpdate) {
            this.currentTaskToUpdate = taskToUpdate
        }
        const assigneePromise = this.fetchType(this.types['assignee'])
        const issueTypePromise = this.fetchType(this.types['issueType'])
        const issueStatusPromise = this.fetchType(this.types['issueStatus'])
        Promise.all([assigneePromise, issueTypePromise, issueStatusPromise]).then(() => {
            this.form = this.getFormHTML()
            this.configureForm();
            this.initializeTextEditor();
            this.initializeImageEditor(canvasImage.toDataURL());

            if (this.currentTaskToUpdate && Object.keys(this.currentTaskToUpdate).length > 0) {
                this.injectTaskDataToForm(this.currentTaskToUpdate)
            }
        })



        return this;
    }

    public closeForm(): void {
        this.form?.remove();
        document.body.classList.remove(css["no-scroll"]);
        EventBusInstance.emit('close-form');
    }

    private configureForm(): void {
        if (!this.form) return;
        document.body.appendChild(this.form);
        document.body.classList.add(css["no-scroll"]);
        this.setupFormListeners();
    }

    public onSubmit(callback: (data: Request<Task>) => void): FormManager {
        this.onSubmitCallback = callback;
        return this;
    }

    private initializeTextEditor(): void {
        const editorElement = document.querySelector("#editor");
        if (editorElement) {
            this.textEditor = new Quill(editorElement, {
                debug: "info",
                theme: "snow",
            });
        }
        console.info(this.textEditor);
    }

    private initializeImageEditor(image: string): void {
        this.imageEditorWrapper = new ImageEditorWrapper(
            `#${formCss['canvas-holder']}`,
            image
        );
    }

    private addEventSubmitData(): void {
        const submitBtn = document.getElementById(`${formCss['submit-btn']}`);
        if (submitBtn) {
            submitBtn.addEventListener("click", (e: MouseEvent) => {
                e.stopPropagation();
                if (this.isUpdatingTask()) {
                    this.updateTask()
                } else {
                    this.submitData();
                }
            });
        }
    }

    private async updateTask(): Promise<void> {
        this.toggleLoading(true)
        const formData = this.collectFormData();
        const res: Response<Task> = await this.invoke('PUT', `sdk/task/${formData.appData.id}`, formData)
        if (res && !res.hasError && Object.keys(res.appData).length > 0) {
            EventBusInstance.emit('fetchTask') // emit event to re-fetch task
            this.notificationManager.createNotification("UPDATE", 'SUCCESS', res.appData)
            // this.toggleLoading(false)
            // this.closeForm()
        } else {
            this.notificationManager.createNotification("UPDATE", 'FAILED')
        }
        this.toggleLoading(false)
        this.closeForm()

    }

    private addEventSelectOnChange(): void {
        const issueTypeSelectElement = document.getElementById(`${formCss['task-type']}`)!
        const issueStatusSelectElement = document.getElementById(`status`)!
        const assigneeSelectElement = document.getElementById(`assignee`)!

        issueTypeSelectElement.onchange = ((e: Event) => this.setCurrentSelectedFormFieldState(this.types.issueType, (e.target as HTMLSelectElement).selectedIndex))
        assigneeSelectElement.onchange = ((e: Event) => this.setCurrentSelectedFormFieldState(this.types.assignee, (e.target as HTMLSelectElement).selectedIndex))
        issueStatusSelectElement.onchange = ((e: Event) => this.setCurrentSelectedFormFieldState(this.types.issueStatus, (e.target as HTMLSelectElement).selectedIndex))
    }

    private setCurrentSelectedFormFieldState(field: string, index: number): void {
        switch (field.toLowerCase()) {
            case this.types.assignee: {
                if (this.isUpdatingTask()) {
                    console.log('assignee triggered')
                    this.currentTaskToUpdate!.assignee = this.assignees[index];
                    break
                }

                this.currentSelectedAssignee = this.assignees[index];
                break;
            }

            case this.types.issueStatus: {
                if (this.isUpdatingTask()) {
                    console.log('status triggered')
                    this.currentTaskToUpdate!.taskStatus = this.issueStatuses[index];
                    break
                }

                this.currentSelectedIssueStatus = this.issueStatuses[index];
                break;
            }

            case this.types.issueType: {
                if (this.isUpdatingTask()) {
                    console.log('type triggered')
                    this.currentTaskToUpdate!.issueType = this.issueTypes[index];
                    break
                }

                this.currentSelectedIssueType = this.issueTypes[index];
                break;
            }

            default: {
                console.log("Type not found!");
                break;
            }
        }
    }

    private async submitData(): Promise<void> {
        try {
            const formData = this.collectFormData();
            this.onSubmitCallback(formData);
        } catch (error) {
            console.error("Error in form submission:", error);
        }
    }

    private collectFormData(): Request<Task> {
        this.toggleLoading(true);
        const taskRequest: Request<Task> = {
            appData: {
                assignee: this.getCurrentSelectedAssignee(),
                title: this.getCurrentTaskTitle(),
                description: this.getCurrentDescription(),
                base64Images: this.getBase64Images(),
                pointDom: this.getCurrentDomString(),
                issueType: this.getCurrentSelectedIssueType(),
                taskStatus: this.getCurrentSelectedIssueStatus(),
                endPoint: window.location.pathname
            },
        };

        if (this.isUpdatingTask()) {
            taskRequest.appData.id = this.currentTaskToUpdate?.id
        }
        this.toggleLoading(false);
        console.log('formData: ', taskRequest.appData)
        return taskRequest
    }

    private getCurrentSelectedAssignee(): Assignee {
        if (this.isUpdatingTask()) {
            return this.currentTaskToUpdate?.assignee || {} as Assignee;
        }
        return this.currentSelectedAssignee
    }

    private getCurrentSelectedIssueStatus(): IssueStatus {
        if (this.isUpdatingTask()) {
            return this.currentTaskToUpdate?.taskStatus!
        }

        if (!this.currentSelectedIssueStatus || Object.keys(this.currentSelectedIssueStatus).length <= 0) {
            return this.issueStatuses[0]
        }
        return this.currentSelectedIssueStatus
    }

    private getCurrentSelectedIssueType(): IssueType {
        if (this.isUpdatingTask()) {
            return this.currentTaskToUpdate?.issueType!
        }

        if (!this.currentSelectedIssueType || Object.keys(this.currentSelectedIssueType).length <= 0) {
            return this.issueTypes[0]
        }
        return this.currentSelectedIssueType
    }

    private getCurrentTaskTitle(): string {
        const title = document.getElementById(`${formCss['subject']}`) as HTMLInputElement;
        return title.value || "Default task title"
    }

    private getBase64Images(): string[] {
        const attachImage = this.imageEditorWrapper
            .getImageDataUrl()
            ?.replace(this.BASE64_IMAGE_PREFIX, "")!;

        return [attachImage]
    }

    private getCurrentDescription(): string {
        const description = document.querySelector("#editor .ql-editor")?.innerHTML;
        return description || "No description"
    }

    private toggleLoading(isLoading: boolean): void {
        const loadingIcon = document.getElementById(
            `${formCss['loading']}`
        ) as HTMLDivElement;
        const submitIcon = document.getElementById(
            `${formCss['submit-btn']}`
        ) as HTMLDivElement;
        if (isLoading) {
            loadingIcon.classList.remove(formCss["hide"]);
            submitIcon.classList.add(formCss["hide"]);
        } else {
            loadingIcon.classList.add(formCss["hide"]);
            submitIcon.classList.remove(formCss["hide"]);
        }
    }

    private loadEditorStyles(): void {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdn.quilljs.com/1.3.6/quill.snow.css";
        link.crossOrigin = "anonymous";
        document.head.appendChild(link);
    }

    private loadSubmitButtonContent(): string {
        return this.isUpdatingTask() ? 'Update' : 'Submit'
    }

    private getFormHTML(task?: Task): HTMLFormElement {
        const formElement = document.createElement("form");
        formElement.classList.add(formCss['form-wrapper'])

        formElement.innerHTML = `
        <div class="${formCss['first-col']}">
            <div id="${formCss['canvas-holder']}"></div>
        </div>
        <div class="${formCss['second-col']}">
            <div class="${formCss['row']}">
                <select name="" id="${formCss['task-type']}">
                    ${this.issueTypes.map((issueType) => {
            return `<option value="${issueType.id}">${issueType.name}</option>`
        }).join("")}
                </select>
            </div>
            <div class="${formCss['row']}">
                <div class="${formCss['subject-wrap']}">
                    <input type="text" name="" id="${formCss['subject']}" placeholder="Subject">
                </div>
            </div>
            <div class="${formCss['row']} ${formCss['no-margin']}">
                <div class="${formCss['assignee-wrap']}">
                    <label class="${formCss['label']}" for="assignee">Assignee</label>
                    <select class="${formCss['value']}" name="" id="assignee">
                    ${this.assignees.map((assignee) => {
            return `<option value="${assignee.id}">${assignee.name}</option>`
        }).join("")}
                    </select>
                </div>
                <div class="${formCss['task-status-wrap']}">
                    <label class="${formCss['label']}" for="status">Status</label>
                    <select class="${formCss['value']}" name="" id="status">
                    ${this.issueStatuses.map((issueStatus) => {
            return `<option value="${issueStatus.id}">${issueStatus.name}</option>`
        }).join("")}
                    </select>
                </div>
            </div>
            <div class="${formCss['row']}">
                <div id="editor" class="${formCss['text-area']}"></div>
            </div>
            <div class="${formCss['row']} ${formCss['row-actions']}">
                <div class="${formCss['btn-wrap']}">
                    <div id="${formCss['cancel-btn']}">Cancel</div>
                </div>
                <div class="${formCss['btn-wrap']}">
                    <div id="${formCss['submit-btn']}">${this.loadSubmitButtonContent()}</div>
                    <div class="${formCss['hide']}" id="${formCss['loading']}">
                        ${loading}
                    </div>
                </div>
            </div>
        </div>
        `
        return formElement
    }

    private setupFormListeners() {
        this.addEventSubmitData()
        this.addEventSelectOnChange()
        this.addEventCancelForm()
    }

    private addEventCancelForm() {
        const cancelBtn = document.getElementById(`${formCss['cancel-btn']}`)
        if (cancelBtn) {
            cancelBtn.onclick = (e: MouseEvent) => {
                e.stopPropagation()
                this.closeForm()
            }
        }
    }

    private injectTaskDataToForm(task: Task) {
        console.log('UPDATE: inject task data to form')
        const issueTypeSelectElement = document.getElementById(`${formCss['task-type']}`) as HTMLSelectElement
        const issueStatusSelectElement = document.getElementById(`status`) as HTMLSelectElement
        const assigneeSelectElement = document.getElementById(`assignee`) as HTMLSelectElement
        const descriptionElement = document.querySelector("#editor .ql-editor")!
        const taskTitleElement = document.getElementById(`${formCss['subject']}`) as HTMLInputElement

        Array.from(issueTypeSelectElement.options).forEach((option, index) => {
            if (option.value === task.issueType.id.toString()) {
                issueTypeSelectElement.selectedIndex = index
                this.currentSelectedIssueType = task.issueType
            }
        })
        Array.from(issueStatusSelectElement.options).forEach((option, index) => {
            if (option.value === task.taskStatus.id.toString()) {
                issueStatusSelectElement.selectedIndex = index
                this.currentSelectedIssueStatus = task.taskStatus
            }
        })
        Array.from(assigneeSelectElement.options).forEach((option, index) => {
            if (option.value === task.assignee?.id.toString()) {
                assigneeSelectElement.selectedIndex = index
                this.currentSelectedIssueType = task.issueType
            }
        })

        descriptionElement.innerHTML = task.description
        taskTitleElement.value = task.title

    }
}
