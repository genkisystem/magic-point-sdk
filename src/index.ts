import { toPng } from "html-to-image";
import hand from "./asset/hand-slapped.svg";
import penTool from "./asset/pen-tool.svg";
import { Base, ConfigurationOptions } from "./base";
import { FormManager } from "./form";
import css from "./index.scss";
import { ModalManager } from "./modal";
import { NotificationManager } from "./notification";
import { Posts } from "./posts";
import { TagManager } from "./tag";
import { applyMixins } from "./utils";

class MagicPoint extends Base {
    private isFormOpen: boolean = false;
    private tagManager: TagManager;
    private notificationManager: NotificationManager;
    private formManager: FormManager;
    private modalManager: ModalManager;

    constructor(config: ConfigurationOptions) {
        super(config);
        console.log("add magic dot listener");
        this.tagManager = new TagManager();
        this.notificationManager = new NotificationManager();
        this.formManager = new FormManager();
        this.modalManager = new ModalManager();
        this.configTrix();
        this.initializeBindings();
        this.insertMagicPointToggle();
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

    private async createTask(data: any): Promise<void> {
        this.notificationManager.createNotification("success", {});
        // let res: any = await this.post("task/nulab/add-issue", data);
        // console.log(res.hasError);
        // if (res) {
        //     this.notificationManager.createNotification("success", res.appData);
        // }
        this.closeForm();
    }

    private closeForm() {
        this.formManager.closeForm();
        this.isFormOpen = false;
    }

    // Event listener
    addCreateDotEventListener(): void {
        document.body.addEventListener(
            "click",
            this.createDotEventListenerHandler
        );
    }

    removeCreateDotEventListener(): void {
        document.body.removeEventListener(
            "click",
            this.createDotEventListenerHandler
        );
    }

    configTrix() {
        document.addEventListener("trix-before-initialize", () => {});
    }

    createDotEventListenerHandler(e: MouseEvent) {
        this.autoCaptureCurrentUserView(e).then((canvas: HTMLCanvasElement) => {
            this.isFormOpen = true;
            this.formManager.createForm(canvas);
            this.setupFormSubmission(e);
        });

        this.disableMagicPoint();
    }

    private setupFormSubmission(e: MouseEvent): void {
        this.formManager.onSubmit((formData: any) => {
            console.log("Form Data:", formData);
            this.createTask(formData);
            this.tagManager.createTag(e.clientX, e.clientY);
            this.enableMagicPoint();
        });
    }

    async autoCaptureCurrentUserView(
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

    getDevicePixelRatio(): number {
        return window.devicePixelRatio || 1;
    }

    findOutermostTag(element: HTMLElement) {
        console.log("passing element: ", element);
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

    public insertMagicPointToggle(): void {
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
}

interface MagicPoint extends Posts {}

applyMixins(MagicPoint, [Posts]);

export default MagicPoint;
