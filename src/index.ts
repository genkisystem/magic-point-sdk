import { figmaIcon, handIcon, penIcon } from "@icons";

import {
    Base,
    ConfigurationOptions,
    GenericRequest,
    GenericResponse,
} from "./base";

import { FormManager } from "./components/form";
import { ListTaskManager } from "./components/list-task";
import { Task } from "./components/list-task/types/Task";
import { ModalManager } from "./components/modal";

import { FigmaComparerModal } from "@screens";

import {
    EventBusInstance,
    FigmaClient,
    I18nManager,
    StateKeys,
    TagManager,
    dataManager,
    globalStateManager,
    licenseManagerInstance,
    notification,
    styleManager,
    uiManager,
} from "@services";

import {
    APP_ID,
    createDivElement,
    defineMediaQueriesAndSetupEventListener,
    getPointDom,
} from "@utils";
import html2canvas from "html2canvas";

class MagicPoint extends Base {
    private isMagicPointEnabled: boolean = false;
    private isFormOpen: boolean = false;

    private tagManager: TagManager;
    private formManager!: FormManager;
    private modalManager: ModalManager;
    private listTaskManager!: ListTaskManager;

    private readonly RENDER_TASK_OPERATOR = {
        RENDER: true,
        NOT_RENDER: false,
    };

    private magicPointContainer: HTMLElement;
    private magicPointDiv: HTMLDivElement | null = null;

    private figmaClient: FigmaClient;
    private figmaComparerModal!: FigmaComparerModal;

    constructor(config: ConfigurationOptions) {
        console.log("add magic dot listener");
        super(config);
        licenseManagerInstance.setApiKey(config.apiKey);

        this.magicPointContainer = createDivElement({
            className: "magic-point-container",
        });
        this.magicPointContainer.id = APP_ID;
        this.initializeUI();

        this.modalManager = new ModalManager();
        this.figmaClient = new FigmaClient();

        new I18nManager(config.lng ? config.lng : "en");

        dataManager.init().then(() => {
            this.listTaskManager = new ListTaskManager(config);
            this.formManager = new FormManager();
            this.figmaComparerModal = new FigmaComparerModal(
                this.figmaClient,
                this.createTasks.bind(this),
            );
            this.setupMagicPointToggle();
        });

        this.tagManager = new TagManager(this.magicPointContainer);

        this.initializeBindings();
        this.setupEventBuses();
        this.setupKeystrokeListener();
        this.fetchInformation();
        defineMediaQueriesAndSetupEventListener(config.breakPoints);
    }

    private initializeUI(): void {
        document.body.appendChild(this.magicPointContainer);
        uiManager.setContainer(this.magicPointContainer);
        styleManager.init();
    }

    private initializeBindings(): void {
        this.createDotEventListenerHandler =
            this.createDotEventListenerHandler.bind(this);
        this.disableMagicPoint = this.disableMagicPoint.bind(this);
        this.enableMagicPoint = this.enableMagicPoint.bind(this);
        this.magicPointListener = this.magicPointListener.bind(this);
    }

    private enableMagicPoint(): void {
        this.addCreateDotEventListener();
        document.body.classList.add("red-dot-cursor");
    }

    private disableMagicPoint() {
        this.removeCreateDotEventListener();
        document.body.classList.remove("red-dot-cursor");
    }

    private async fetchInformation() {
        const res: any = await this.get("sdk/figma-team");
        if (res.appData && Array.isArray(res.appData)) {
            globalStateManager.setState(StateKeys.FigmaTeamIds, res.appData);
        }
    }

    private async createTask(task: GenericRequest<Task>): Promise<boolean> {
        if (task.appData.id) {
            const res: GenericResponse<Task> = await this.invoke(
                "PUT",
                `sdk/task/${task.appData.id}`,
                task,
            );
            if (res && !res.hasError && Object.keys(res.appData).length > 0) {
                EventBusInstance.emit("fetchTask"); // emit event to re-fetch task
                notification.createNotification(
                    "UPDATE",
                    "SUCCESS",
                    res.appData,
                );
            } else {
                notification.createNotification("UPDATE", "FAILED");
            }
            this.closeForm();
            return !res?.hasError;
        }
        // Create task
        let res: any = await this.post("sdk/task", task);
        if (!res?.hasError) {
            notification.createNotification("CREATE", "SUCCESS", res.appData);
            this.listTaskManager.fetchListTask(
                this.RENDER_TASK_OPERATOR.RENDER,
            );
        } else {
            notification.createNotification("CREATE", "FAILED", res.appData);
        }
        this.closeForm();
        return !res?.hasError;
    }

    private async createTasks(tasks: any[]): Promise<void> {
        try {
            uiManager.showLoading();
            await Promise.all(tasks.map((data) => this.createTask(data)));
        } catch (error) {
            console.error("Error creating tasks: ", error);
        } finally {
            uiManager.hideLoading();
        }
    }

    private closeForm() {
        this.formManager.closeForm();
        this.isFormOpen = false;
    }

    // Event listener
    private addCreateDotEventListener(): void {
        document.body.addEventListener(
            "click",
            this.createDotEventListenerHandler,
        );
    }

    private removeCreateDotEventListener(): void {
        document.body.removeEventListener(
            "click",
            this.createDotEventListenerHandler,
        );
    }

    private createDotEventListenerHandler(e: MouseEvent) {
        this.disableMagicPoint();
        const path = e.composedPath();
        this.formManager.setCurrentDomString(getPointDom(path));
        this.formManager.setCurrentCoordinate(this.calcPointCoordinate(e));

        this.autoCaptureCurrentUserView(e).then((canvas: HTMLCanvasElement) => {
            this.isFormOpen = true;
            this.setupFormSubmission(e);
            this.formManager.createForm(canvas);
        });
    }

    private calcPointCoordinate(e: MouseEvent): string {
        const { x: rectX, y: rectY } = (
            e.target as HTMLElement
        ).getBoundingClientRect();
        const [targetX, targetY] = [e.clientX, e.clientY];
        return `${targetX - rectX}#${targetY - rectY}`;
    }

    private setupFormSubmission(e: MouseEvent): void {
        this.formManager.setCallback(
            (formData: GenericRequest<Task>) => {
                uiManager.showLoading();
                this.createTask(formData)
                    .then((isSuccess) => {
                        if (isSuccess) {
                            // this.tagManager.createTag(e.clientX, e.clientY, formData.appData.title);
                            this.enableMagicPoint();
                        }
                    })
                    .catch((error) => {
                        console.error("Error creating task: ", error);
                    })
                    .finally(() => {
                        uiManager.hideLoading();
                    });
            },
            () => {
                this.isFormOpen = false;
                this.enableMagicPoint();
            },
        );
    }

    private toggleSDKElementsInOneSec() {
        const taskList: HTMLDivElement | null =
            document.querySelector("#list-task-wrapper") ?? null;
        if (taskList) taskList.style.display = "none";

        const magicPointToggleWrap: HTMLDivElement = document.querySelector(
            `.${"active"}`,
        )?.parentElement as HTMLDivElement;
        magicPointToggleWrap.style.display = "none";

        setTimeout(() => {
            if (taskList) taskList.style.display = "flex";
            magicPointToggleWrap.style.display = "block";
        }, 1);
    }

    private async autoCaptureCurrentUserView(
        e: MouseEvent,
    ): Promise<HTMLCanvasElement> {
        const outermostTag = this.findOutermostTag(e.target as HTMLElement);
        this.toggleSDKElementsInOneSec();
        const base64png = await html2canvas(outermostTag);

        return new Promise<HTMLCanvasElement>((resolve) => {
            const canvas = document.createElement("canvas");
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const ctx = canvas.getContext("2d")!;
            ctx.fillStyle = "grey";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const image = new Image();
            image.src = base64png.toDataURL();

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
        magicButton: HTMLElement,
    ): void {
        if (this.isFormOpen) {
            this.showConfirmationModal(normalButton, magicButton);
            return;
        }
        this.updateUI(normalButton, magicButton);
    }

    private showConfirmationModal(
        normalButton: HTMLElement,
        magicButton: HTMLElement,
    ): void {
        const confirmationMessage = "Are you sure you want to proceed?";
        this.modalManager.showModal(confirmationMessage, () => {
            this.handleModalConfirmation(normalButton, magicButton);
        });
    }

    private handleModalConfirmation(
        normalButton: HTMLElement,
        magicButton: HTMLElement,
    ): void {
        this.closeForm();
        this.updateUI(normalButton, magicButton);
    }

    private updateUI(
        normalButton: HTMLElement,
        magicButton: HTMLElement,
    ): void {
        this.toggleButtonClass(normalButton, magicButton);
        this.disableMagicPoint();
    }

    private handleMagicButtonClick(
        magicButton: HTMLElement,
        normalButton: HTMLElement,
    ): void {
        this.toggleButtonClass(magicButton, normalButton);
        this.enableMagicPoint();
    }

    public toggleButtonClass(
        activeButton: HTMLElement,
        inactiveButton: HTMLElement,
    ): void {
        activeButton.classList.add("active");
        inactiveButton.classList.remove("active");
    }

    private createButton(
        icon: string,
        clickHandler: () => void,
    ): HTMLDivElement {
        const button = document.createElement("div");
        button.innerHTML = icon;
        button.className = "toggle-button";
        button.addEventListener("click", (e) => {
            clickHandler();
            e.stopPropagation();
        });
        return button;
    }

    private setupMagicPointToggle() {
        this.magicPointDiv = document.createElement("div");
        Object.assign(this.magicPointDiv.style, {
            position: "fixed",
            top: "10px",
            right: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
        });

        const normalButton = this.createButton(handIcon, () =>
            this.handleNormalButtonClick(normalButton, magicButton),
        );

        normalButton.classList.add("active");
        const magicButton = this.createButton(penIcon, () =>
            this.handleMagicButtonClick(magicButton, normalButton),
        );

        const figmaBtn = this.createButton(figmaIcon, () => {
            this.handleNormalButtonClick(normalButton, magicButton);
            this.figmaComparerModal.showModal();
        });

        this.magicPointDiv.append(normalButton, magicButton, figmaBtn);

        this.magicPointContainer.appendChild(this.magicPointDiv);
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
        EventBusInstance.on("disable-magic-point", this.disableMagicPoint);
        EventBusInstance.on("enable-magic-point", this.enableMagicPoint);
    }
}

export default MagicPoint;
