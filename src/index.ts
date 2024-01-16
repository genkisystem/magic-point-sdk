import { toPng } from "html-to-image";
import figmaIcon from "./asset/figma.svg";
import hand from "./asset/hand-slapped.svg";
import penTool from "./asset/pen-tool.svg";
import { Base, ConfigurationOptions, GenericRequest } from "./base";
import { EventBusInstance } from "./components/EventBus";
import { FormManager } from "./components/form";
import { ListTaskManager } from "./components/list-task";
import taskListCss from "./components/list-task/listTask.scss";
import { Task } from "./components/list-task/types/Task";
import { ModalManager } from "./components/modal";
import { notification } from "./components/notification";
import { NotificationManager } from "./components/notification/notification";
import { TagManager } from "./components/tag";
import css from "./index.scss";
import { FigmaComparerModal } from "./screens/figma-comparison-modal/FigmaCompareModal";
import { FigmaClient } from "./services/figma/figma";
import { UIManager } from "./services/ui-manager/UIManager";
import { createDivElement } from "./utils";
import { APP_ID } from "./utils/constants";
import { getPointDom } from "./utils/dom";
import { I18nManager } from './services/i18n';
import { defindeMediaQueriesAndSetupEventListener } from "./utils";

class MagicPoint extends Base {
    private isMagicPointEnabled: boolean = false;
    private isFormOpen: boolean = false;

    private tagManager: TagManager;
    private notificationManager: NotificationManager;
    private formManager: FormManager;
    private modalManager: ModalManager;
    private listTaskManager: ListTaskManager;

    private readonly RENDER_TASK_OPERATOR = {
        RENDER: true,
        NOT_RENDER: false,
    };

    private magicPointContainer: HTMLElement;

    private magicPointDiv: HTMLDivElement | null = null;

    private figmaClient: FigmaClient = new FigmaClient(
        "fQajLA73u5Megnj2UIfugu",
        "http://localhost:8080/api/figma/oauth-callback"
    );

    private figmaTeamIds: string[] = [];

    private figmaComparerModal: FigmaComparerModal = new FigmaComparerModal(
        this.figmaClient,
        this.createTasks.bind(this)
    );

    private uiManager: UIManager;

    constructor(config: ConfigurationOptions) {
        super(config);
        console.log("add magic dot listener");
        this.notificationManager = notification;
        this.formManager = new FormManager(config);
        this.modalManager = new ModalManager();
        this.uiManager = new UIManager();
        new I18nManager(config.lng || "en")
        this.magicPointContainer = createDivElement({
            className: css["magic-point-container"],
        });

        this.magicPointContainer.id = APP_ID;
        this.listTaskManager = new ListTaskManager(
            config,
            this.magicPointContainer
        );

        this.tagManager = new TagManager(this.magicPointContainer);
        this.setupMagicPoint();
        this.initializeBindings();
        this.setupEventBuses();
        this.setupKeystrokeListener();
        this.fetchInformation();
        defindeMediaQueriesAndSetupEventListener(config.breakPoints)
    }

    private initializeBindings(): void {
        this.createDotEventListenerHandler =
            this.createDotEventListenerHandler.bind(this);
        this.magicPointListener = this.magicPointListener.bind(this);
    }

    private enableMagicPoint(): void {
        this.addCreateDotEventListener();
        document.body.classList.add(css["red-dot-cursor"]);
    }

    private disableMagicPoint() {
        this.removeCreateDotEventListener();
        document.body.classList.remove(css["red-dot-cursor"]);
    }

    private async fetchInformation() {
        const res: any = await this.get("sdk/figma-team");
        if (res.appData && Array.isArray(res.appData)) {
            this.figmaTeamIds = res.appData;
        }
    }

    private async createTask(data: any): Promise<boolean> {
        let res: any = await this.post("sdk/task", data);
        if (!res?.hasError) {
            this.notificationManager.createNotification(
                "CREATE",
                "SUCCESS",
                res.appData
            );
            this.listTaskManager.fetchListTask(
                this.RENDER_TASK_OPERATOR.RENDER
            );
        } else {
            this.notificationManager.createNotification(
                "CREATE",
                "FAILED",
                res.appData
            );
        }
        this.closeForm();
        return !res?.hasError;
    }

    private async createTasks(tasks: any[]): Promise<void> {
        await Promise.all(tasks.map((data) => this.createTask(data)));
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

    private createDotEventListenerHandler(e: MouseEvent) {
        const path = e.composedPath();
        this.formManager.setCurrentDomString(getPointDom(path));
        this.formManager.setCurrentCoordinate(this.calcPointCoordinate(e))

        this.autoCaptureCurrentUserView(e).then((canvas: HTMLCanvasElement) => {
            this.isFormOpen = true;
            this.formManager.createForm(canvas);
            this.setupFormSubmission(e);
        });

        this.disableMagicPoint();
    }

    private calcPointCoordinate(e: MouseEvent): string {
        const { x: rectX, y: rectY } = (e.target as HTMLElement).getBoundingClientRect()
        const [targetX, targetY] = [e.clientX, e.clientY]
        return `${targetX - rectX}#${targetY - rectY}`
    }

    private setupFormSubmission(e: MouseEvent): void {
        this.formManager.onSubmit((formData: GenericRequest<Task>) => {
            this.createTask(formData).then((isSuccess) => {
                if (isSuccess) {
                    // this.tagManager.createTag(e.clientX, e.clientY, formData.appData.title);
                    this.enableMagicPoint();
                }
            });
        });
    }

    private toggleSDKElementsInOneSec() {
        const taskList: HTMLDivElement | null = document.querySelector(
            `#${taskListCss["list-task-wrapper"]}`
        ) ?? null;
        if (taskList) taskList.style.display = "none";


        const magicPointToggleWrap: HTMLDivElement = document.querySelector(
            `.${css["active"]}`
        )?.parentElement as HTMLDivElement;
        magicPointToggleWrap.style.display = "none";

        setTimeout(() => {
            if (taskList) taskList.style.display = "flex";
            magicPointToggleWrap.style.display = "block";
        }, 1);
    }

    private async autoCaptureCurrentUserView(
        e: MouseEvent
    ): Promise<HTMLCanvasElement> {
        const outermostTag = this.findOutermostTag(e.target as HTMLElement);
        this.toggleSDKElementsInOneSec();
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
        // console.log('passed element', element)
        // let currentElement = element;
        // while (currentElement.parentElement) {
        //     if (currentElement.parentElement.tagName.toLowerCase() === "body") {
        //         console.log("selected element: ", currentElement);
        //         return currentElement;
        //     }
        //     currentElement = currentElement.parentElement;
        // }
        // console.log("selected element: ", currentElement);
        // return currentElement;
        return document.getElementsByTagName("html")[0];
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
        this.uiManager.toggleButtonClass(normalButton, magicButton);
        this.disableMagicPoint();
    }

    private handleMagicButtonClick(
        magicButton: HTMLElement,
        normalButton: HTMLElement
    ): void {
        this.uiManager.toggleButtonClass(magicButton, normalButton);
        this.enableMagicPoint();
    }

    private createButton(
        icon: string,
        clickHandler: () => void
    ): HTMLDivElement {
        const button = document.createElement("div");
        button.innerHTML = icon;
        button.className = css["toggle-button"];
        button.addEventListener("click", (e) => {
            clickHandler();
            e.stopPropagation();
        });
        return button;
    }

    private setupMagicPoint() {
        this.magicPointDiv = document.createElement("div");
        Object.assign(this.magicPointDiv.style, {
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

        const figmaBtn = this.createButton(figmaIcon, () => {
            this.figmaComparerModal.showModal(this.figmaTeamIds);
        });

        this.magicPointDiv.append(normalButton, magicButton, figmaBtn);

        this.magicPointContainer.appendChild(this.magicPointDiv);
        document.body.appendChild(this.magicPointContainer);
    }

    private insertMagicPointToggle(): void {
        this.magicPointContainer.style.display = "none";
    }

    private removeMagicPointToggle() {
        this.magicPointContainer.style.display = "flex";
        this.disableMagicPoint();
    }

    private toggleMagicPointFeature() {
        this.isMagicPointEnabled = !this.isMagicPointEnabled;
        this.isMagicPointEnabled
            ? this.insertMagicPointToggle()
            : this.removeMagicPointToggle();
    }

    private setupKeystrokeListener() {
        window.addEventListener("keydown", this.magicPointListener);
    }

    private magicPointListener(event: KeyboardEvent) {
        if (event.ctrlKey && event.shiftKey && event.key === "M") {
            this.toggleMagicPointFeature();
        }
    }

    public removeKeystrokeListener() {
        window.removeEventListener("keydown", this.magicPointListener);
    }

    private setupEventBuses(): void {
        EventBusInstance.on("create-tags", (x, y, title) => {
            this.tagManager.createTag(x, y, title);
        });

        EventBusInstance.on("close-form", () => {
            console.log("[EventBus] - triggered: close form");
            this.enableMagicPoint();
        });
    }
}

export default MagicPoint;
