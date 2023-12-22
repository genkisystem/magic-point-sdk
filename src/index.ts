import { toPng } from "html-to-image";
import hand from "./asset/hand-slapped.svg";
import penTool from "./asset/pen-tool.svg";
import { Base, ConfigurationOptions, Request } from "./base";
import { FormManager } from "./components/form";
import css from "./index.scss";
import { ModalManager } from "./components/modal";
import { notification } from "./components/notification";
import { TagManager } from "./components/tag";
import { ListTaskManager } from "./components/list-task";
import { Task } from "./components/list-task/types/Task";
// import { applyMixins } from "./utils";
import { NotificationManager } from './components/notification/notification';
import { EventBusInstance } from "./components/EventBus";

class MagicPoint extends Base {
    private isFormOpen: boolean = false;
    private tagManager: TagManager;
    private notificationManager: NotificationManager;
    private formManager: FormManager;
    private modalManager: ModalManager;
    private listTaskManager: ListTaskManager
    private RENDER_TASK_OPERATOR = {
        RENDER: true,
        NOT_RENDER: false
    }

    constructor(config: ConfigurationOptions) {
        super(config);
        console.log("add magic dot listener");
        this.tagManager = new TagManager();
        this.notificationManager = notification;
        console.log("notificationManager: ", this.notificationManager);
        this.formManager = new FormManager(config);
        this.modalManager = new ModalManager();
        this.listTaskManager = new ListTaskManager(config);
        console.log('task manager: ', this.listTaskManager)
        this.configTrix();
        this.initializeBindings();
        this.insertMagicPointToggle();
        this.setupEventBuses()
    }

    private initializeBindings(): void {
        this.createDotEventListenerHandler =
            this.createDotEventListenerHandler.bind(this);
    }

    private enableMagicPoint(): void {
        this.addCreateDotEventListener();
        document.body.classList.add(css["red-dot-cursor"]);
    }

    private disableMagicPoint() {
        this.removeCreateDotEventListener();
        document.body.classList.remove(css["red-dot-cursor"]);
    }

    private async createTask(data: any): Promise<boolean> {
        let res: any = await this.post("sdk/task", data);
        if (!res?.hasError) {
            this.notificationManager.createNotification("CREATE", "SUCCESS", res.appData);
            this.listTaskManager.fetchListTask(this.RENDER_TASK_OPERATOR.NOT_RENDER)
        } else {
            this.notificationManager.createNotification("CREATE", "FAILED", res.appData);
        }
        this.closeForm();
        return !res?.hasError
    }

    private closeForm() {
        this.formManager.closeForm();
        this.isFormOpen = false;
    }

    // Event listener
    private addCreateDotEventListener(): void {
        document.body.addEventListener(
            "click",
            this.createDotEventListenerHandler
        );
    }

    private removeCreateDotEventListener(): void {
        document.body.removeEventListener(
            "click",
            this.createDotEventListenerHandler
        );
    }

    private configTrix() {
        document.addEventListener("trix-before-initialize", () => { });
    }

    private createDotEventListenerHandler(e: MouseEvent) {
        this.formManager.setCurrentDomString(this.getPointDomTree(e))
        this.autoCaptureCurrentUserView(e).then((canvas: HTMLCanvasElement) => {
            this.isFormOpen = true;
            this.formManager.createForm(canvas);
            this.setupFormSubmission(e);
        });

        this.disableMagicPoint();
    }

    private getPointDomTree(e: MouseEvent): string {
        let composedPath = e.composedPath()
        composedPath.splice(-3) // remove window, document, html tag
        let pointDomTreeSelectorString = []
        for (const nodeInPath of composedPath as HTMLElement[]) {
            let singleNodeCSSSelector = ''

            singleNodeCSSSelector += nodeInPath.tagName.toLowerCase()

            if (nodeInPath.id) {
                singleNodeCSSSelector += `#${nodeInPath.id}`
            } else {
                if (nodeInPath.parentNode!.childNodes.length > 0) { // nodeType = 3 is mean it is the text node, we dont care about this node
                    singleNodeCSSSelector += `:nth-child(${Array.from(nodeInPath.parentNode!.childNodes).filter(node => node.nodeType !== 3).indexOf(nodeInPath) + 1})`
                }
            }
            pointDomTreeSelectorString.push(singleNodeCSSSelector)
        }
        console.log('pointDomTreeSelectorString', pointDomTreeSelectorString)
        return pointDomTreeSelectorString.reverse().join(' ')
    }

    private setupFormSubmission(e: MouseEvent): void {
        this.formManager.onSubmit((formData: Request<Task>) => {
            this.createTask(formData).then((isSuccess) => {
                if (isSuccess) {
                    this.tagManager.createTag(e.clientX, e.clientY);
                    this.enableMagicPoint();
                }
            })
        });
    }

    private async autoCaptureCurrentUserView(
        e: MouseEvent
    ): Promise<HTMLCanvasElement> {
        const outermostTag = this.findOutermostTag(e.target as HTMLElement);
        const base64png = await toPng(outermostTag);

        return new Promise<HTMLCanvasElement>((resolve) => {
            const canvas = document.createElement("canvas");
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const ctx = canvas.getContext("2d")!;
            ctx.fillStyle = "grey";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const image = new Image();
            image.src = base64png;

            image.onload = () => {
                const sx = window.scrollX * this.getDevicePixelRatio();
                const sy = window.scrollY * this.getDevicePixelRatio();
                const sw = window.innerWidth * this.getDevicePixelRatio();
                const sh = window.innerHeight * this.getDevicePixelRatio();
                const dw = window.innerWidth;
                const dh = window.innerHeight;

                ctx.drawImage(image, sx, sy, sw, sh, 0, 0, dw, dh);
                resolve(canvas);
            };
        });
    }

    private getDevicePixelRatio(): number {
        return window.devicePixelRatio || 1;
    }

    private findOutermostTag(element: HTMLElement) {
        let currentElement = element;
        while (currentElement.parentElement) {
            if (currentElement.parentElement.tagName.toLowerCase() === "body") {
                console.log("selected element: ", currentElement);
                return currentElement;
            }
            currentElement = currentElement.parentElement;
        }
        console.log("selected element: ", currentElement);
        return currentElement;
    }

    private toggleButtonClass(
        activeButton: HTMLElement,
        inactiveButton: HTMLElement
    ): void {
        activeButton.classList.add(css["active"]);
        inactiveButton.classList.remove(css["active"]);
    }

    private handleNormalButtonClick(
        normalButton: HTMLElement,
        magicButton: HTMLElement
    ): void {
        if (this.isFormOpen) {
            this.showConfirmationModal(normalButton, magicButton);
            return;
        }
        this.updateUI(normalButton, magicButton);
    }

    private showConfirmationModal(
        normalButton: HTMLElement,
        magicButton: HTMLElement
    ): void {
        const confirmationMessage = "Are you sure you want to proceed?";
        this.modalManager.showModal(confirmationMessage, () => {
            this.handleModalConfirmation(normalButton, magicButton);
        });
    }

    private handleModalConfirmation(
        normalButton: HTMLElement,
        magicButton: HTMLElement
    ): void {
        this.closeForm();
        this.updateUI(normalButton, magicButton);
    }

    private updateUI(
        normalButton: HTMLElement,
        magicButton: HTMLElement
    ): void {
        this.toggleButtonClass(normalButton, magicButton);
        this.disableMagicPoint();
    }

    private handleMagicButtonClick(
        magicButton: HTMLElement,
        normalButton: HTMLElement
    ): void {
        this.toggleButtonClass(magicButton, normalButton);
        this.enableMagicPoint();
    }

    private createButton(
        icon: string,
        clickHandler: () => void
    ): HTMLButtonElement {
        const button = document.createElement("button");
        button.innerHTML = icon;
        button.style.width = "50px";
        button.style.height = "50px";
        button.addEventListener("click", (e) => {
            clickHandler();
            e.stopPropagation();
        });
        return button;
    }

    private insertMagicPointToggle(): void {
        const div = document.createElement("div");
        Object.assign(div.style, {
            position: "fixed",
            top: "10px",
            right: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
        });

        const normalButton = this.createButton(hand, () =>
            this.handleNormalButtonClick(normalButton, magicButton)
        );
        normalButton.classList.add(css["active"]);
        const magicButton = this.createButton(penTool, () =>
            this.handleMagicButtonClick(magicButton, normalButton)
        );

        div.append(normalButton, magicButton);
        document.body.appendChild(div);
    }

    private setupEventBuses(): void {
        EventBusInstance.on('create-tags', (x, y) => {
            this.tagManager.createTag(x, y)
        })

        EventBusInstance.on('close-form', () => {
            console.log('close form')
            this.enableMagicPoint()
        })
    }

}

export default MagicPoint;
