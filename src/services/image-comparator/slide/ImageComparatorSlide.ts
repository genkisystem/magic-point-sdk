import "img-comparison-slider";

import "./slide.css";

export class ImageComparisonSlider {
    private container: HTMLElement;
    private beforeImage!: HTMLImageElement;
    private afterImage!: HTMLImageElement;
    private sliderEnabled: boolean;
    private imgComparisonSlider: HTMLElement;

    constructor(container: HTMLElement) {
        this.container = container;
        this.sliderEnabled = false;

        this.imgComparisonSlider = document.createElement(
            "img-comparison-slider"
        );
    }

    public create(beforeImageUrl: string, afterImageUrl: string) {
        this.sliderEnabled = true;

        // Create before and after image elements
        this.beforeImage = this.createImageElement(beforeImageUrl, "first");
        this.afterImage = this.createImageElement(afterImageUrl, "second");

        // Append images to the container
        this.appendImagesTo(this.container);
        this.appendImagesTo(this.imgComparisonSlider);
        this.container.appendChild(this.imgComparisonSlider);
    }

    private createImageElement(src: string, slot: string): HTMLImageElement {
        const imageElement = document.createElement("img");
        imageElement.setAttribute("slot", slot);
        imageElement.setAttribute("width", "100%");
        imageElement.src = src;
        return imageElement;
    }

    private appendImagesTo(target: HTMLElement) {
        target.appendChild(this.beforeImage);
        target.appendChild(this.afterImage);
    }

    public enableSlider() {
        if (!this.sliderEnabled) {
            this.sliderEnabled = true;
            this.imgComparisonSlider.style.pointerEvents = "auto";
            this.imgComparisonSlider.style.visibility = "unset";
        }
    }

    public disableSlider() {
        if (this.sliderEnabled) {
            this.sliderEnabled = false;
            this.imgComparisonSlider.style.pointerEvents = "none";
            this.imgComparisonSlider.style.visibility = "hidden";
        }
    }

    public toggleSlider() {
        if (this.sliderEnabled) {
            this.disableSlider();
        } else {
            this.enableSlider();
        }
    }
}
