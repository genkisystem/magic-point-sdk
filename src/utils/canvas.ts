export const resizeCanvas = (
    sourceCanvas: HTMLCanvasElement,
    width: number,
    height: number
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
        height
    );
    return canvas;
};
