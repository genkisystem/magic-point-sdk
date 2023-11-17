import ImageEditor from 'tui-image-editor';

import './tui-image-editor/tui-image-editor.css';
import './tui-image-editor/tui-color-picker.css';

export class ImageEditorWrapper {
  private imageEditor: ImageEditor | null;
  
  constructor(editorId: string, initialImage: string) {
    this.imageEditor = this.createImageEditor(editorId, initialImage);
    this.removeUnnecessaryElements();
  }

  public getImageDataUrl(): string | undefined {
    return this.imageEditor?.toDataURL();
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
