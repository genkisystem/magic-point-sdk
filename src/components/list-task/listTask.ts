import css from './listTask.scss'

import editIcon from '../../asset/edit.svg'
import trash from '../../asset/trash.svg'
import minimize from '../../asset/minimize.svg'

import { Base, ConfigurationOptions, Response } from '../../base';
import { Task } from './types/Task';
import { FormManager } from '../form';
import { EventBusInstance } from '../EventBus';
import { ModalManager } from '../modal/modal';
import { NotificationManager, notification } from '../notification';
export class ListTaskManager extends Base {
    // private isLoading: boolean = false;
    private listTask: Task[] = [];
    private HTMLElement: HTMLElement | null = null;
    private updateFormElement: FormManager;
    private modalManager: ModalManager;
    private notificationManager: NotificationManager;

    constructor(config: ConfigurationOptions) {
        super(config);
        this.fetchListTask()
        this.updateFormElement = new FormManager(config)
        this.modalManager = new ModalManager()
        this.setupDocumentEventHandler()
        this.notificationManager = notification
    }

    public setListTask(listTask: Task[]) {
        this.listTask = listTask
    }

    public async fetchListTask() {
        this.listTask = await this.invoke<Response<Task[]>>('GET', `sdk/tasks?url-path=${window.location.pathname}`, null).then((res) => {
            return res && !res.hasError ? res.appData : []
        })
        this.setupListTask()
    }

    private setupDocumentEventHandler() {
        document.onkeydown = (e) => {
            this.turnTaskLitToDotByPressESC(e)
        }
    }

    public setupListTask(): void {
        if (this.HTMLElement) {
            this.HTMLElement.remove()
        }

        const listTaskElement = this.getListTaskHTML()
        if (listTaskElement) {
            document.body.appendChild(listTaskElement)
            this.addEditEventListener()
            this.addDeleteEventListener()
            this.addMinimizeEventListener()
            this.HTMLElement = listTaskElement
        }
    }

    private addMinimizeEventListener() {
        console.log('add minimize event listener')
        const minimizeBtnElement = document.querySelector(`.${css['minimize-btn']}`) as HTMLDivElement
        minimizeBtnElement.onclick = (e) => {
            e.stopPropagation()
            this.minimizeListTaskByClick()
        }
    }

    private minimizeListTaskByClick() {
        this.turnTaskListToDot()
    }

    private addEditEventListener() {
        console.log('add edit event listener')
        const editElements = document.querySelectorAll(`.${css['edit-wrap']}`) as unknown as HTMLDivElement[]
        editElements.forEach((element, index) => {
            element.onclick = (e) => this.onEditClick(e, index)
        })
    }

    private async onEditClick(e: MouseEvent, elementIndex: number): Promise<void> {
        e.stopPropagation()
        this.turnTaskListToDot()
        const base64Image = await this.getBase64Image(this.listTask[elementIndex].id!)
        const canvas = await this.createCanvasFromBase64(base64Image)
        this.updateFormElement.createForm(canvas, this.listTask[elementIndex])
        EventBusInstance.on('fetchTask', () => {
            this.fetchListTask()
        })
    }

    private addDeleteEventListener() {
        console.log('add delete event listener')
        const deleteElements = document.querySelectorAll(`.${css['delete-wrap']}`) as unknown as HTMLDivElement[]
        deleteElements.forEach((element, index) => {
            element.onclick = () => this.onDeleteClick(index)
        })
    }

    private onDeleteClick(index: number) {
        this.modalManager.showModal(`Are you sure you want to delete this task?`, () => {
            this.deleteTask(this.listTask[index].id!);
        })
    }

    private async deleteTask(id: number) {
        const res = await this.invoke<Response<string[]>>("DELETE", `sdk/tasks/${id}`)
        if (res && !res.hasError) {
            this.notificationManager.createNotification("DELETE", "SUCCESS")
            this.setupListTask()
        } else {
            this.notificationManager.createNotification("DELETE", "FAILED")
        }
    }

    // private minimizeListTaskByPressESC() {
    //     const escEvent = new KeyboardEvent('keydown', {
    //         key: 'Escape',
    //         code: 'Escape',
    //         bubbles: false, // Set to true if the event should bubble up through the DOM
    //         cancelable: false // Set to true if the event can be canceled
    //     });
    //     document.dispatchEvent(escEvent)
    // }

    private async getBase64Image(id: number): Promise<string> {
        const base64Image = await this.invoke<Response<string[]>>("GET", `sdk/attachments/${id}`)
        return base64Image.appData[0]
    }

    private turnDotToTaskList(e: Event): void {
        if (this.HTMLElement?.classList.contains(`${css['dot-blink']}`) || this.HTMLElement?.classList.contains(`${css['dotted-list']}`)) {
            this.HTMLElement.classList.remove(`${css['dot-blink']}`, `${css['dotted-list']}`)
            this.HTMLElement.classList.add(`${css['dot-unblink']}`, `${css['slide-in']}`)
        }
    }

    private turnTaskListToDot(): void {
        if (!this.HTMLElement?.classList.contains(`${css['dotted-list']}`)) {
            this.HTMLElement?.classList.add(`${css['dotted-list']}`)
            this.HTMLElement?.classList.remove(`${css['slide-in']}`)
        }
    }

    private turnTaskLitToDotByPressESC(e: KeyboardEvent): void {
        if (e.key === "Escape" && this.HTMLElement?.classList.contains(`${css['slide-in']}`)) {
            this.HTMLElement!.classList.remove(`${css['slide-in']}`)
            this.HTMLElement!.classList.add(`${css['dotted-list']}`, `${css['dot-blink']}`)
        }
    }

    public getListTaskHTML(): HTMLDivElement | null {
        if (this.listTask.length > 0) {
            const listTaskWrapper = document.createElement('div')
            listTaskWrapper.id = `${css['list-task-wrapper']}`
            listTaskWrapper.classList.add(`${css['slide-in']}`, `${css['dotted-list']}`, `${css['dot-blink']}`)
            listTaskWrapper.innerHTML = `
        <div class="${css['operator-wrap']}">
            <div class="${css['minimize-btn']}">
                ${minimize}
            </div>
            <div class="${css['filter']}">
                <div class="${css['option-wrap']}">
                    <input class="${css['filter-checkbox']}" type="checkbox" name="" id="">
                    <p class="${css['type-text']}">All</p>
                </div>
                <div class="${css['option-wrap']}">
                    <input class="${css['filter-checkbox']}" type="checkbox" name="" id="">
                    <p class="${css['type-text']}">Shown</p>
                </div>
                <div class="${css['option-wrap']}">
                    <input class="${css['filter-checkbox']}" type="checkbox" name="" id="">
                    <p class="${css['type-text']}">Hidden</p>
                </div>
            </div>
        </div>

        <hr class="${css['hr']}">

        <!-- Task element -->
        ${this.listTask.map((task, index) => {
                return `
                        <div class="${css['task']}">
                            <div class="${css['task-info']}">
                                <h2 class="${css['task-title']}">${task.title}</>
                                    <p class="${css['task-assignee']}">Assignee: ${task.assignee?.name || 'Unassigned'}</p>
                                    <p class="${css['issue-type']}">Issue type: ${task.issueType.name}</p>
                                    <p class="${css['time-created']}">Time Created: ${task.createdDate || ''}</p>
                            </div>
                            <div class="${css['task-status']} ${css[`task-status-${this.getTaskStatusCssPostfixClass(task.taskStatus.name)}`] || css['task-status-default']}">${task.taskStatus.name}</div>
                            <div class="${css['edit-wrap']}">
                                ${editIcon}
                            </div>
                            <div class="${css['delete-wrap']}">
                                ${trash}
                            </div>
                        </div>
                        <hr>
                        `}).join("")}
        `
            // set up event handlers
            listTaskWrapper.onclick = (e) => {
                e.stopPropagation()
                this.turnDotToTaskList(e)
            }
            return listTaskWrapper
        }

        return null
    }

    private getTaskStatusCssPostfixClass(taskStatusName: string): string {
        return taskStatusName.replaceAll(' ', '-').toLowerCase()
    }

    private createCanvasFromBase64(base64String: string): Promise<HTMLCanvasElement> {
        return new Promise<HTMLCanvasElement>((resolve) => {
            const BASE64_IMAGE_PREFIX = "data:image/png;base64,"
            // Create an Image object
            var img = new Image();

            // Set the source of the image to the base64 string
            img.src = BASE64_IMAGE_PREFIX + base64String;

            // Create a canvas element
            var canvas = document.createElement('canvas');

            img.onload = function () {
                // Set the canvas dimensions to the image dimensions
                canvas.width = img.width;
                canvas.height = img.height;

                // Get the context of the canvas
                var ctx = canvas.getContext('2d')!;

                // Draw the image onto the canvas
                ctx.drawImage(img, 0, 0);
                resolve(canvas)
            };

            // Handle possible errors in loading the image (e.g., invalid base64 string)
            img.onerror = function () {
                console.error('Error loading the image');
            };
        })
    }

}