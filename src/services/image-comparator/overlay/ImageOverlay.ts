import css from "./overlay.scss";

export class ImageOverlay {
    private container: HTMLElement;
    private baseImage: HTMLImageElement;
    private overlayImage: HTMLImageElement;

    constructor(container: HTMLElement) {
        this.container = container;
        this.container.className = css["overlay-container"];
        this.baseImage = this.createImageElement();
        this.overlayImage = this.createImageElement();
        this.setupContainer();
    }

    private createImageElement(): HTMLImageElement {
        const img = document.createElement("img");
        img.className = css["overlay-item"];
        return img;
    }

    private setupContainer() {
        this.container.style.position = "relative";
        this.container.style.width = "100%";
        this.container.style.height = "100%";
        this.container.style.display = "none";
        this.container.appendChild(this.baseImage);
        this.container.appendChild(this.overlayImage);
    }

    public setBaseImage(base64: string) {
        this.baseImage.src = base64;
    }

    public setOverlayImage(base64: string, opacity: number = 0.5) {
        this.overlayImage.src = base64;
        this.overlayImage.style.opacity = `${opacity}`;
    }

    public adjustOverlayOpacity(opacity: number) {
        this.overlayImage.style.opacity = `${opacity}`;
    }
}