import Quill from "quill";
import svg from "../asset/Spinner-1s-200px.svg";
import { ImageEditorWrapper } from "../image-editor";
import css from "../index.scss";

export class FormManager {
    private form: HTMLFormElement | null = null;
    private imageEditorWrapper!: ImageEditorWrapper;
    private textEditor!: Quill;
    private onSubmitCallback: (data: any) => void = () => {};

    constructor() {
        this.loadEditorStyles();
    }

    public createForm(canvasImage: HTMLCanvasElement): FormManager {
        this.form = document.createElement("form");
        this.configureForm();
        this.initializeTextEditor();
        this.initializeImageEditor(canvasImage.toDataURL());
        return this;
    }

    public closeForm(): void {
        this.form?.remove();
        document.body.classList.remove(css["no-scroll"]);
    }

    private configureForm(): void {
        if (!this.form) return;

        this.form.classList.add(css.form, css.hide);
        this.form.innerHTML = this.getFormHTML();
        document.body.appendChild(this.form);
        document.body.classList.add(css["no-scroll"]);
        this.form.classList.remove(css["hide"]);
        this.addEventSubmitData();
    }

    public onSubmit(callback: (data: any) => void): FormManager {
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
        console.log(this.textEditor);
    }

    private initializeImageEditor(image: string): void {
        this.imageEditorWrapper = new ImageEditorWrapper(
            `#${css["canvas-holder"]}`,
            image
        );
    }

    private addEventSubmitData(): void {
        const submitBtn = document.getElementById("submit-btn");
        if (submitBtn) {
            submitBtn.addEventListener("click", (e: MouseEvent) => {
                e.stopPropagation();
                return this.submitData();
            });
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

    private collectFormData(): any {
        this.toggleLoading(true);

        const imageUrl = this.imageEditorWrapper
            .getImageDataUrl()
            ?.replace("data:image/png;base64,", "");
        const title = document.getElementById(
            "task-title"
        ) as HTMLInputElement | null;
        const description =
            document.querySelector("#editor .ql-editor")?.innerHTML;

        this.toggleLoading(false);

        return {
            appData: {
                name: "Nguyen Tran Anh Hao",
                title: title?.value || "Default Task Title",
                description: description,
                apiKey: "",
                domain: "",
                base64Images: [imageUrl],
            },
        };
    }

    private toggleLoading(isLoading: boolean): void {
        const loadingIcon = document.getElementById(
            "loading"
        ) as HTMLDivElement;
        const submitIcon = document.getElementById(
            "submit-btn"
        ) as HTMLDivElement;
        if (isLoading) {
            loadingIcon.classList.remove(css["hide"]);
            submitIcon.classList.add(css["hide"]);
        } else {
            loadingIcon.classList.add(css["hide"]);
            submitIcon.classList.remove(css["hide"]);
        }
    }

    private loadEditorStyles(): void {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdn.quilljs.com/1.3.6/quill.snow.css";
        link.crossOrigin = "anonymous";
        document.head.appendChild(link);
    }

    private getFormHTML(): string {
        return `
        <div class="${css["inner-form-container"]}">
            <div class="${css["first-row"]}">
                <div id="${css["canvas-holder"]}"></div>
            </div>
            <div class="${css["second-row"]}">
                <div class="${css["input-field-editor"]} ${css["first-col"]}">
                    <label class="${css["label"]}" for="comment">Comment:</label>
                    <div class="${css["editor"]}">
                        <div id="editor"></div>
                    </div>
                </div>
            <div class="${css["second-col"]}">
                <div class="${css["input-field"]} ">
                    <label class="${css["title-label"]}" for="title">Task title: </label>
                    <input type="text" id="task-title">
                </div>
                <div class="${css["action"]}" id="submit-btn">
                    <svg id="submit-svg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                </div>
                <div class="${css["loading"]} ${css["hide"]}" id="loading">
                    ${svg}
                </div>
            </div>
        </div>`;
    }
}
