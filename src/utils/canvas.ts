import { ElementBounds } from "@services";
import html2canvas from "html2canvas";

export const resizeCanvas = (
    sourceCanvas: HTMLCanvasElement,
    width: number,
    height: number,
): HTMLCanvasElement => {
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Could not get canvas context");
    }

    ctx.drawImage(
        sourceCanvas,
        0,
        0,
        sourceCanvas.width as number,
        sourceCanvas.height as number,
        0,
        0,
        width,
        height,
    );
    return canvas;
};

const drawRect = (
    ctx: CanvasRenderingContext2D,
    position: ElementBounds,
    index: number,
) => {
    const width = position.right - position.left;
    const height = position.bottom - position.top;

    ctx.beginPath();
    ctx.rect(position.left, position.top, width, height);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.stroke();

    const textX = position.right - 5;
    const textY = position.top + 5;
    ctx.font = "24px Arial";
    ctx.fillStyle = "blue";
    ctx.fillText(`${index + 1}`, textX, textY);
};

export const drawBugCanvas = (
    originalCanvas: HTMLCanvasElement,
    bugPositions: ElementBounds[],
): HTMLCanvasElement => {
    const bugCanvas: HTMLCanvasElement = document.createElement("canvas");
    bugCanvas.width = originalCanvas.width;
    bugCanvas.height = originalCanvas.height;
    const ctx = bugCanvas.getContext("2d");
    if (!ctx) {
        throw new Error("Could not get canvas context");
    }

    ctx.drawImage(originalCanvas, 0, 0);

    bugPositions.forEach((point, index) => drawRect(ctx, point, index));

    return bugCanvas;
};

export const captureElementAsCanvas = async (
    element: HTMLElement,
): Promise<HTMLCanvasElement> => {
    return await html2canvas(element);
};
