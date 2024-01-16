import { BLANK_IMAGE } from "@utils";
import ImageEditor from "tui-image-editor";

export class ImageEditorWrapper2 {
    private imageEditor: ImageEditor | null;

    constructor(element: Element) {
        this.imageEditor = this.createImageEditor(element);
        this.removeUnnecessaryElements(element);
    }

    public getImageDataUrl(): string {
        this.ensureImageEditorInitialized();
        return this.imageEditor!.toDataURL();
    }

    public loadImage(image: string): void {
        this.ensureImageEditorInitialized();
        setTimeout(() => {
            this.imageEditor!.loadImageFromURL(image, "Image");
        }, 0);
    }

    public reset(): void {
        this.imageEditor?.clearObjects();
    }

    private createImageEditor(element: Element): ImageEditor | null {
        try {
            const editorConfig = {
                includeUI: {
                    loadImage: {
                        path: BLANK_IMAGE,
                        name: "Blank",
                    },
                    theme: {},
                    uiSize: {
                        width: "100%",
                        height: "100%",
                    },
                    menuBarPosition: "bottom",
                    usageStatistics: false,
                },
                cssMaxHeight: (window.innerHeight * 50) / 100,
            };

            return new ImageEditor(element, editorConfig);
        } catch (error: any) {
            console.error(
                `Failed to initialize Image Editor: ${error?.message}`,
            );
            return null;
        }
    }

    private removeUnnecessaryElements(element: Element): void {
        const elementsToDelete = element.querySelectorAll(
            ".tui-image-editor-header-buttons, .tui-image-editor-header-logo, .tui-image-editor-controls-logo",
        );

        elementsToDelete.forEach((element) => {
            element.remove();
        });
    }

    private ensureImageEditorInitialized(): void {
        if (!this.imageEditor) {
            throw new Error("Image Editor is not initialized.");
        }
    }
}
