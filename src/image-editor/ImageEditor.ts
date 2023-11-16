import ImageEditor from "tui-image-editor";

export class ImageEditorWrapper {
  private imageEditor: ImageEditor | null;
  private readonly tuiImageEditorStylesheet =
    "https://uicdn.toast.com/tui-image-editor/latest/tui-image-editor.min.css";
  private readonly tuiColorPickerStylesheet =
    "https://uicdn.toast.com/tui-color-picker/latest/tui-color-picker.min.css";

  constructor(editorId: string, initialImage: string) {
    this.loadStylesheets();
    this.imageEditor = this.createImageEditor(editorId, initialImage);
    this.removeUnnecessaryElements();
  }

  public getImageDataUrl(): string | undefined {
    return this.imageEditor?.toDataURL();
  }

  private loadStylesheets() {
    console.log("[Image editor] loadStylesheets started");
    this.loadStylesheet(this.tuiImageEditorStylesheet);
    this.loadStylesheet(this.tuiColorPickerStylesheet);
  }

  private loadStylesheet(href: string) {
    const linkElement = document.createElement("link");
    linkElement.rel = "stylesheet";
    linkElement.href = href;
    document.head.appendChild(linkElement);
  }

  private createImageEditor(
    id: string,
    initialImage: string
  ): ImageEditor | null {
    try {
      const editorConfig = {
        includeUI: {
          loadImage: {
            path: initialImage,
            name: "Image",
          },
          theme: {},
          uiSize: {
            width: "80vw",
            height: "70vh",
          },
          menuBarPosition: "bottom",
          usageStatistics: false,
        },
        cssMaxWidth: 500,
        cssMaxHeight: 500,
      };

      const editorElement = document.querySelector(id);
      if (!editorElement) {
        throw new Error(`Element with id ${id} not found.`);
      }

      return new ImageEditor(editorElement, editorConfig);
    } catch (error: any) {
      console.error(`Failed to initialize Image Editor: ${error.message}`);
      return null;
    }
  }

  private removeUnnecessaryElements() {
    const elementsToDelete = document.querySelectorAll(
      ".tui-image-editor-header-buttons, .tui-image-editor-header-logo"
    );

    if (elementsToDelete.length > 0) {
      elementsToDelete.forEach(function (element) {
        element.remove();
      });
    }
  }
}
