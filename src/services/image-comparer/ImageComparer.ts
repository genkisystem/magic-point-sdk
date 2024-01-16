import html2canvas from "html2canvas";
import resemble from "resemblejs";

import { APP_ID, resizeCanvas } from "@utils";

export interface ElementBounds {
    pageX: number;
    pageY: number;
    left: number;
    top: number;
    right: number;
    bottom: number;
    image?: string;
    originalImage?: string;
}

export interface CanvasWithDots {
    diffPositions: ElementBounds[];
    figmaCanvas: HTMLCanvasElement;
    bugCanvas: HTMLCanvasElement;
    webCanvas: HTMLCanvasElement;
}

export class HtmlImageComparer {
    private async captureElementAsDataURL(
        element: HTMLElement,
    ): Promise<string> {
        const canvas = await html2canvas(element);
        return canvas.toDataURL("image/png");
    }

    async captureAndResizeElement(
        element: HTMLElement,
        newWidth: number,
        newHeight: number,
    ): Promise<HTMLCanvasElement> {
        const capturedCanvas: HTMLCanvasElement = await html2canvas(element, {
            scale: 2,
            width: newWidth,
            height: newHeight,
        });
        return resizeCanvas(capturedCanvas, newWidth, newHeight);
    }

    async loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("Failed to load image"));
            img.src = url;
        });
    }

    resizeImage(
        img: HTMLImageElement,
        width: number,
        height: number,
    ): HTMLCanvasElement {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error("Could not get canvas context");
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        return canvas;
    }

    async findDifferencePosition(
        element: HTMLElement,
        figmaImageUrl: string,
    ): Promise<CanvasWithDots | undefined> {
        const originalFigmaImage: HTMLImageElement =
            await this.loadImage(figmaImageUrl);

        const bodyCopy: HTMLElement = this.cloneBody();
        this.styleBodyCopy(bodyCopy);
        bodyCopy.style.width = `${originalFigmaImage.naturalWidth}px`;
        bodyCopy.style.height = `${originalFigmaImage.naturalHeight}px`;
        bodyCopy.style.maxHeight = `${originalFigmaImage.naturalHeight}px`;
        bodyCopy.style.minHeight = `${originalFigmaImage.naturalHeight}px`;
        bodyCopy.style.overflow = "hidden";
        document.body.appendChild(bodyCopy);
        const canvas1: HTMLCanvasElement = await this.captureAndResizeElement(
            bodyCopy,
            originalFigmaImage.naturalWidth,
            originalFigmaImage.naturalHeight,
        );
        const canvas2: HTMLCanvasElement = this.resizeImage(
            originalFigmaImage,
            originalFigmaImage.naturalWidth,
            originalFigmaImage.naturalHeight,
        );

        const ctx1: CanvasRenderingContext2D | null = canvas1.getContext("2d");
        const ctx2: CanvasRenderingContext2D | null = canvas2.getContext("2d");
        if (!ctx1 || !ctx2) {
            throw new Error("Could not get canvas context");
        }

        const imageData1: ImageData = ctx1.getImageData(
            0,
            0,
            canvas1.width,
            canvas1.height,
        );
        const imageData2: ImageData = ctx2.getImageData(
            0,
            0,
            canvas2.width,
            canvas2.height,
        );

        this.configureResemble();
        const diffData = await this.compareImages(imageData1, imageData2);

        if (diffData.misMatchPercentage <= 0) {
            return;
        }

        const diffPoints = await this.processDifferences(diffData, bodyCopy);

        const capturePromises = diffPoints.map(async (point) => {
            const element = this.findElementAtPosition(
                bodyCopy,
                point.pageX,
                point.pageY,
            );
            if (element) {
                const dataURL = await this.captureElementAsDataURL(element);

                return { ...point, image: dataURL };
            }
            return point;
        });

        const capturedDiffPoints = await Promise.all(capturePromises);

        const imageCanvas: HTMLCanvasElement = document.createElement("canvas");
        imageCanvas.width = bodyCopy.clientWidth;
        imageCanvas.height = bodyCopy.clientHeight;
        const ctx = imageCanvas.getContext("2d");
        if (!ctx) {
            throw new Error("Could not get canvas context");
        }

        // Draw the bodyCopy onto the canvas
        ctx.drawImage(canvas1, 0, 0);

        // Variables to track drag state
        let isDragging = false;
        let draggedDotIndex: number | null = null;

        const drawRect = (position: ElementBounds, index: number) => {
            const width = position.right - position.left;
            const height = position.bottom - position.top;

            ctx.beginPath();
            ctx.rect(position.left, position.top, width, height);
            ctx.strokeStyle = "red";
            ctx.lineWidth = 2;
            ctx.stroke();

            const textX = position.right + 5;
            const textY = position.top + height / 2;
            ctx.font = "36px Arial";
            ctx.fillStyle = "blue";
            ctx.fillText(`${index + 1}`, textX, textY);
        };

        // Draw red dots for each diff position
        capturedDiffPoints.forEach((point, index) => drawRect(point, index));

        // Function to find dot under cursor
        const findDotIndex = (x: number, y: number): number | null => {
            return capturedDiffPoints.findIndex((pos) => {
                const dx = x - pos.pageX;
                const dy = y - pos.pageY;
                return dx * dx + dy * dy <= 25; // 25 is the radius squared
            });
        };

        // Mouse event handlers
        imageCanvas.onmousedown = (e) => {
            const rect = imageCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            draggedDotIndex = findDotIndex(x, y);

            if (draggedDotIndex !== -1) {
                isDragging = true;
            }
        };

        imageCanvas.onmousemove = (e) => {
            if (!isDragging || draggedDotIndex === null) return;
            const rect = imageCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Update the position of the dot and redraw
            capturedDiffPoints[draggedDotIndex].pageX = x;
            capturedDiffPoints[draggedDotIndex].pageY = y;

            ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
            ctx.drawImage(canvas1, 0, 0); // Redraw bodyCopy
            capturedDiffPoints.forEach(drawRect); // Redraw dots
        };

        imageCanvas.onmouseup = () => {
            isDragging = false;
            draggedDotIndex = null;
        };

        document.body.removeChild(bodyCopy);

        return {
            diffPositions: capturedDiffPoints,
            bugCanvas: imageCanvas,
            webCanvas: canvas1,
            figmaCanvas: canvas2,
        };
    }

    private cloneBody(): HTMLElement {
        const bodyCopy: HTMLElement = document.body.cloneNode(
            true,
        ) as HTMLElement;
        this.removeMagicPointDiv(bodyCopy);
        return bodyCopy;
    }

    private removeMagicPointDiv(bodyCopy: HTMLElement): void {
        const magicPointDiv: HTMLElement | null = bodyCopy.querySelector(
            `div#${APP_ID}`,
        );
        magicPointDiv?.remove();
    }

    private styleBodyCopy(bodyCopy: HTMLElement): void {
        Object.assign(bodyCopy.style, {
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            zIndex: "-9999",
        });
    }

    private configureResemble(): void {
        resemble.outputSettings({
            errorColor: { red: 255, green: 0, blue: 255 },
            errorType: "diffOnly",
            transparency: 0.3,
            largeImageThreshold: 1200,
            useCrossOrigin: false,
        });
    }

    private async compareImages(
        imageData1: ImageData,
        imageData2: ImageData,
    ): Promise<resemble.ComparisonResult> {
        return new Promise((resolve, reject) => {
            resemble(imageData1).compareTo(imageData2).onComplete(resolve);
        });
    }

    private async processDifferences(
        diffData: resemble.ComparisonResult,
        bodyCopy: HTMLElement,
    ): Promise<ElementBounds[]> {
        if (diffData.misMatchPercentage <= 0) {
            return [];
        }

        const diffImage = diffData.getImageDataUrl();

        const img = new Image();
        img.src = diffImage;

        const elementBoundsArray = await this.loadAndProcessImage(
            img,
            bodyCopy,
        );
        return elementBoundsArray;
    }

    private async loadAndProcessImage(
        img: HTMLImageElement,
        bodyCopy: HTMLElement,
    ): Promise<ElementBounds[]> {
        return new Promise((resolve) => {
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    resolve([]);
                    return;
                }
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(
                    0,
                    0,
                    canvas.width,
                    canvas.height,
                );
                const data = imageData.data;

                const rect = canvas.getBoundingClientRect();
                const boundsArray = this.findDifferences(
                    data,
                    rect,
                    bodyCopy,
                    canvas.width,
                    canvas.height,
                );
                resolve(boundsArray);
            };
        });
    }

    private findDifferences(
        data: Uint8ClampedArray,
        rect: DOMRect,
        bodyCopy: HTMLElement,
        width: number,
        height: number,
    ): ElementBounds[] {
        const boundsArray: ElementBounds[] = [];

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (this.isDifferentPixel(data, x, y, width)) {
                    const pageX = x + rect.left + window.scrollX;
                    const pageY = y + rect.top + window.scrollY;

                    const elementBounds = this.getElementBoundsAtPosition(
                        bodyCopy,
                        pageX,
                        pageY,
                    );
                    if (
                        elementBounds &&
                        !this.isInAnyElement(boundsArray, elementBounds)
                    ) {
                        boundsArray.push(elementBounds);
                    }
                }
            }
        }
        return boundsArray;
    }

    private isDifferentPixel(
        data: Uint8ClampedArray,
        x: number,
        y: number,
        width: number,
    ): boolean {
        const index = (y * width + x) * 4;
        return (
            data[index] !== 0 || data[index + 1] !== 0 || data[index + 2] !== 0
        );
    }

    private getElementBoundsAtPosition(
        bodyCopy: HTMLElement,
        pageX: number,
        pageY: number,
    ): ElementBounds | null {
        const elementAtPosition = this.findElementAtPosition(
            bodyCopy,
            pageX,
            pageY,
        );
        if (!elementAtPosition) {
            return null;
        }

        const elementRect = elementAtPosition.getBoundingClientRect();
        return {
            pageX: pageX,
            pageY: pageY,
            left: elementRect.left + window.scrollX,
            top: elementRect.top + window.scrollY,
            right: elementRect.right + window.scrollX,
            bottom: elementRect.bottom + window.scrollY,
        };
    }

    private isInAnyElement(
        boundsArray: ElementBounds[],
        elementBounds: ElementBounds,
    ): boolean {
        return boundsArray.some(
            (bounds) =>
                elementBounds.pageX >= bounds.left &&
                elementBounds.pageX <= bounds.right &&
                elementBounds.pageY >= bounds.top &&
                elementBounds.pageY <= bounds.bottom,
        );
    }

    private findElementAtPosition(
        root: HTMLElement,
        x: number,
        y: number,
    ): HTMLElement | null {
        let foundElement: HTMLElement | null = null;

        for (let child of Array.from(root.children)) {
            if (child instanceof HTMLElement) {
                let rect: DOMRect = child.getBoundingClientRect();

                // Check if the coordinates are within this element's bounds
                if (
                    x >= rect.left &&
                    x <= rect.right &&
                    y >= rect.top &&
                    y <= rect.bottom
                ) {
                    // Instead of returning immediately, continue to search for a more nested element
                    foundElement = child;
                    let deeperElement = this.findElementAtPosition(child, x, y);
                    if (deeperElement) {
                        foundElement = deeperElement;
                    }
                }
            }
        }

        return foundElement;
    }
}
