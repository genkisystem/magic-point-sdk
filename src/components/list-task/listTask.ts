import css from './listTask.scss';
import tagCss from '../tag/tag.scss'

import editIcon from '../../asset/edit.svg';
import minimize from '../../asset/minimize.svg';
import trash from '../../asset/trash.svg';

import { Base, ConfigurationOptions, Response } from '../../base';
import { EventBusInstance } from '../EventBus/index';
import { FormManager } from '../form';
import { ModalManager } from '../modal/modal';
import { NotificationManager, notification } from '../notification';
import { Task } from './types/Task';
import i18next from 'i18next';
import { checkTaskScreenSizeToRender } from '../../utils';

const FILTER_VALUE = ['ALL', 'SHOWN', 'HIDDEN', "NOT_FOUND"] as const
type Filter = typeof FILTER_VALUE[number];
export class ListTaskManager extends Base {
    // private isLoading: boolean = false;
    private listTask: Task[] = [];
    private HTMLElement: HTMLElement | null = null;
    private updateFormElement: FormManager;
    private modalManager: ModalManager;
    private notificationManager: NotificationManager;
    private filter: string = FILTER_VALUE[0];

    constructor(config: ConfigurationOptions, private magicPointContainer: HTMLElement) {
        super(config);
        this.fetchListTask()
        this.updateFormElement = new FormManager(config)
        this.modalManager = new ModalManager()
        this.setupDocumentEventHandler()
        this.notificationManager = notification
        this.renderTaskAsDot = this.renderTaskAsDot.bind(this)
        this.resetAllRenderState = this.resetAllRenderState.bind(this)
        this.rePositionTask = this.rePositionTask.bind(this)
        this.setupEventBuses()
    }

    private setupEventBuses(): void {
        EventBusInstance.on('reset-tasks-is-render-state', this.resetAllRenderState)
        EventBusInstance.on('re-render-tasks', this.renderTaskAsDot)
    }

    public setListTask(listTask: Task[]) {
        this.listTask = listTask
    }

    public async fetchListTask(renderTaskAsDot: boolean = true) {
        this.listTask = await this.invoke<Response<Task[]>>('GET', `sdk/tasks?url-path=${window.location.pathname}`, null).then((res) => {
            return res && !res.hasError && res.appData.length > 0 ? res.appData : []
        })
        this.setupListTask()

        if (renderTaskAsDot) {
            EventBusInstance.emit('clear-tags')
            this.renderTaskAsDot()
        }
    }

    private setupDocumentEventHandler() {
        document.onkeydown = (e) => {
            this.turnTaskListToDotByPressESC(e)
        }
        window.onresize = (e: UIEvent) => this.rePositionTask()
    }

    private rePositionTask() {
        for (const task of this.listTask) {
            if (task.isRender) {
                const element = this.findElementByDomString(task.pointDom)
                if (!element) {
                    EventBusInstance.emit('remove-dot', this.findTaskIndex(task))
                    continue
                }

                // re-calc coordinate to show the point correctly
                // if element has display = "inline" then element.clientWidth = 0 so we get width by element.offsetWidth
                const coordinates: { x: number, y: number } = this.splitAndCalcCoordinate(task)!
                coordinates.x = coordinates.x * (element.clientWidth || element.offsetWidth) / (task.hostElementOriginCoordinates?.width ?? 1)
                coordinates.y = coordinates.y * (element.clientHeight || element.offsetHeight) / (task.hostElementOriginCoordinates?.height ?? 1)
                const dotElement = document.querySelectorAll(`.${tagCss['draggable-div']}`)[this.findTaskIndex(task)] as HTMLDivElement
                dotElement.style.left = coordinates.x.toString() + 'px'
                dotElement.style.top = coordinates.y.toString() + 'px'
            }
        }
    }

    private findTaskIndex(fTask: Task): number {
        return this.listTask.filter(task => !!task.isRender).findIndex((task) => task.id === fTask.id)
    }

    public setupListTask(): void {
        if (this.HTMLElement) {
            this.HTMLElement.remove()
        }
        const listTaskElement = this.getListTaskHTML()
        if (listTaskElement) {
            this.magicPointContainer.appendChild(listTaskElement)
            this.addEditEventListener()
            this.addDeleteEventListener()
            this.addMinimizeEventListener()
            this.addFilterEventListener()
            this.HTMLElement = listTaskElement
        }
    }

    private addFilterEventListener(): void {
        const allCheckbox = document.getElementById('all')!
        const shownCheckbox = document.getElementById('shown')!
        const hiddenCheckbox = document.getElementById('hidden')!
        const notfoundCheckbox = document.getElementById('not-found')!

        allCheckbox.onclick = (e) => this.updateFilterData(e, "ALL")
        shownCheckbox.onclick = (e) => this.updateFilterData(e, "SHOWN")
        hiddenCheckbox.onclick = (e) => this.updateFilterData(e, "HIDDEN")
        notfoundCheckbox.onclick = (e) => this.updateFilterData(e, "NOT_FOUND")
    }

    private updateFilterData(e: MouseEvent, filter: Filter) {
        e.stopPropagation()
        this.filter = filter
        this.setupListTask()
        this.turnDotToTaskList()
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
        const base64Image = await this.getTaskImage(this.listTask[elementIndex].id!)
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

    private async getTaskImage(id: number): Promise<string> {
        const base64Image = await this.invoke<Response<string[]>>("GET", `sdk/attachments/${id}`)
        return base64Image.appData[0]
    }

    private turnDotToTaskList(): void {
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

    private turnTaskListToDotByPressESC(e: KeyboardEvent): void {
        if (e.key === "Escape" && this.HTMLElement?.classList.contains(`${css['slide-in']}`)) {
            this.HTMLElement!.classList.remove(`${css['slide-in']}`)
            this.HTMLElement!.classList.add(`${css['dotted-list']}`, `${css['dot-blink']}`)
        }
    }

    private getListTaskHTML(): HTMLDivElement | null {
        if (this.listTask?.length <= 0) return null

        let localListTask = structuredClone(this.listTask)
        switch (this.filter) {
            case FILTER_VALUE[1]: {
                localListTask = localListTask.filter(task => task.isRender === true)
                break
            }
            case FILTER_VALUE[2]: {
                localListTask = localListTask.filter(task => !task.isRender)
                break
            }
            case FILTER_VALUE[3]: {
                localListTask = localListTask.filter(task => checkTaskScreenSizeToRender(task.screenSize) && !this.findElementByDomString(task.pointDom))
                break
            }
            case FILTER_VALUE[0]:
            default: break
        }
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
                    <input class="${css['filter-checkbox']}" ${this.filter === FILTER_VALUE[0] ? "checked" : ''} type="checkbox" name="" id="all">
                    <label class="${css['type-text']}" for="all">${i18next.t('listTask:filters.all')}</label>
                </div>
                <div class="${css['option-wrap']}">
                    <input class="${css['filter-checkbox']}" ${this.filter === FILTER_VALUE[1] ? "checked" : ''} type="checkbox" name="" id="shown">
                    <label class="${css['type-text']}" for="shown">${i18next.t('listTask:filters.shown')}</label>
                </div>
                <div class="${css['option-wrap']}">
                    <input class="${css['filter-checkbox']}" ${this.filter === FILTER_VALUE[2] ? "checked" : ''} type="checkbox" name="" id="hidden">
                    <label class="${css['type-text']}" for="hidden">${i18next.t('listTask:filters.hidden')}</label>
                </div>
                <div class="${css['option-wrap']}">
                    <input class="${css['filter-checkbox']}" ${this.filter === FILTER_VALUE[3] ? "checked" : ''} type="checkbox" name="" id="not-found">
                    <label class="${css['type-text']}" for="not-found">${i18next.t('listTask:filters.notFound')}</label>
                </div>
            </div>
        </div>

        <hr class="${css['hr']}">

        <!-- Task element -->
        ${localListTask.map((task) => {
            return `
                        <div class="${css['task']}">
                            <div class="${css['task-info']}">
                                <h2 class="${css['task-title']}">${task.title}</>
                                    <p class="${css['task-assignee']}">Assignee: ${task.assignee?.name || 'Unassigned'}</p>
                                    <p class="${css['issue-type']}">Issue type: ${task.issueType.name}</p>
                                    <p class="${css['time-created']}">Last updated: ${task.createdDate || task.updatedDate || ''}</p>
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
            this.turnDotToTaskList()
        }
        return listTaskWrapper

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

    private resetAllRenderState(): void {
        this.listTask.forEach(task => task.isRender ? task.isRender = undefined : task)
    }

    private renderTaskAsDot(): void {
        if (!this.listTask) return
        for (const task of this.listTask) {
            if (!task.pointDom || task.pointDom.length === 0) {
                task.isRender = false;
                continue
            }

            if ((task.isRender == null || task.isRender == undefined) && checkTaskScreenSizeToRender(task.screenSize)) {
                const dotCoordinate = this.splitAndCalcCoordinate(task)
                if (!dotCoordinate) {
                    task.isRender = false
                    continue
                }
                task.isRender = true
                EventBusInstance.emit('create-tags', dotCoordinate.x, dotCoordinate.y, task.title)
            }
        }
    }

    private splitAndCalcCoordinate(task: Task): { x: number, y: number } | null {
        const element = this.findElementByDomString(task.pointDom)
        if (element) {
            const [width, height] = [element.clientWidth || element.offsetWidth, element.clientHeight || element.offsetHeight]
            if (!task.hostElementOriginCoordinates) task.hostElementOriginCoordinates = { width, height }
            const { left: xRect, top: yRect } = element.getBoundingClientRect()
            const [taskX, taskY] = task.pointCoordinate?.split("#") || [0, 0]
            const coordinate = {
                x: xRect + parseFloat(taskX),
                y: yRect + parseFloat(taskY)
            }
            return coordinate
        } else {
            return null
        }
    }

    private findElementByDomString(domString: string): HTMLElement | null {
        if (!domString || domString.length <= 0) return null
        const el = document.querySelector(domString) as HTMLElement;
        if (el?.isConnected) {
            return el
        }

        return null
    }
}
