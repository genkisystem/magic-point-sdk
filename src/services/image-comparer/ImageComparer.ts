import resemble from "resemblejs";

import {
    APP_ID,
    drawBugCanvas,
    findElementAtPosition,
    resizeCanvas
} from "@utils";
import html2canvas from "html2canvas";

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
    screenSizes: {
        width: number;
        height: number;
    };
}

export class HtmlImageComparer {
    private async captureElementAsDataURL(
        element: HTMLElement,
    ): Promise<string> {
        const canvas = await html2canvas(element);
        return canvas.toDataURL("image/png");
    }

    private async captureAndResizeElement(
        element: HTMLElement,
        newWidth: number,
        newHeight: number,
    ): Promise<HTMLCanvasElement> {
        const capturedCanvas: HTMLCanvasElement = await html2canvas(element, {
            scale: 1,
            width: newWidth,
            height: newHeight,
        });
        return resizeCanvas(capturedCanvas, newWidth, newHeight);
    }

    private async loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("Failed to load image"));
            img.src = url + "?not-from-cache-please";
        });
    }

    private resizeImage(
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
        document.body.appendChild(bodyCopy);
        const bodyCanvas: HTMLCanvasElement =
            await this.captureAndResizeElement(
                bodyCopy,
                originalFigmaImage.naturalWidth,
                originalFigmaImage.naturalHeight,
            );
        const figmaCanvas: HTMLCanvasElement = this.resizeImage(
            originalFigmaImage,
            originalFigmaImage.naturalWidth,
            originalFigmaImage.naturalHeight,
        );

        const bodyCtx: CanvasRenderingContext2D | null =
            bodyCanvas.getContext("2d");
        const figmaCtx: CanvasRenderingContext2D | null =
            figmaCanvas.getContext("2d");
        if (!bodyCtx || !figmaCtx) {
            throw new Error("Could not get canvas context");
        }

        const bodyImageData: ImageData = bodyCtx.getImageData(
            0,
            0,
            bodyCanvas.width,
            bodyCanvas.height,
        );
        const figmaImageData: ImageData = figmaCtx.getImageData(
            0,
            0,
            figmaCanvas.width,
            figmaCanvas.height,
        );

        this.configureResemble();
        const diffData = await this.compareImages(
            bodyImageData,
            figmaImageData,
        );

        if (diffData.misMatchPercentage <= 0) {
            document.body.removeChild(bodyCopy);

            return {
                diffPositions: [],
                bugCanvas: bodyCanvas,
                webCanvas: bodyCanvas,
                figmaCanvas: figmaCanvas,
                screenSizes: {
                    width: originalFigmaImage.naturalWidth,
                    height: originalFigmaImage.naturalHeight,
                },
            };
        }

        const diffPoints = await this.processDifferences(diffData, bodyCopy);

        const capturePromises = diffPoints.map(async (point) => {
            const element = findElementAtPosition(
                bodyCopy,
                point.pageX,
                point.pageY,
            );
            if (element) {
                const elementImage =
                    await this.captureElementAsDataURL(element);

                return { ...point, image: elementImage };
            }

            return point;
        });

        const capturedDiffPoints = await Promise.all(capturePromises);

        const imageCanvas: HTMLCanvasElement = drawBugCanvas(
            bodyCanvas,
            capturedDiffPoints,
        );

        document.body.removeChild(bodyCopy);

        return {
            diffPositions: capturedDiffPoints,
            bugCanvas: imageCanvas,
            webCanvas: bodyCanvas,
            figmaCanvas: figmaCanvas,
            screenSizes: {
                width: originalFigmaImage.naturalWidth,
                height: originalFigmaImage.naturalHeight,
            },
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

        return await this.loadAndProcessImage(img, bodyCopy);
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
        const elementAtPosition = findElementAtPosition(bodyCopy, pageX, pageY);

        if (
            !elementAtPosition ||
            elementAtPosition.offsetWidth === 0 ||
            elementAtPosition.offsetHeight === 0
        ) {
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
}
