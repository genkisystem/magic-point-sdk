import { uiManager } from "../ui-manager";

import buttonStyle from "@style/button.scss";
import figmaBodyStyle from "@style/figma-body.scss";
import figmaComparerStyle from "@style/figma-comparer.scss";
import figmaComparisonStyle from "@style/figma-comparison.scss";
import figmaFooterStyle from "@style/figma-footer.scss";
import figmaHeaderStyle from "@style/figma-header.scss";
import figmaLoginStyle from "@style/figma-login.scss";
import figmaSelectionStyle from "@style/figma-selection.scss";
import formStyle from "@style/form.scss";
import imageComparatorOverlayStyle from "@style/image-comparator-overlay.scss";
import imageComparatorSlideStyle from "@style/image-comparator-slide.css";
import appStyle from "@style/index.scss";
import listTaskType from "@style/listTask.scss";
import messageModalStyle from "@style/message-modal.scss";
import modalStyle from "@style/modal.scss";
import notificationStyle from "@style/notification.scss";
import tagStyle from "@style/tag.scss";
import textEditorStyle from "@style/text-editor.css";
import treeStyle from "@style/treeCss.scss";
import tuiColorPickerStyle from "@style/tui-color-picker.css";
import tuiImageEditorStyle from "@style/tui-image-editor.css";
import toastifyStyle from "toastify-js/src/toastify.css";

class StyleManager {
    private static instance: StyleManager;

    private readonly quillStyle: string =
        "https://cdn.quilljs.com/1.3.6/quill.snow.css";

    private constructor() {}

    public static getInstance(): StyleManager {
        return this.instance || (this.instance = new StyleManager());
    }

    public init(): void {
        this.loadEditorStyles();
        const styles = [
            appStyle,
            buttonStyle,
            tuiImageEditorStyle,
            tuiColorPickerStyle,
            formStyle,
            textEditorStyle,
            modalStyle,
            figmaComparerStyle,
            figmaHeaderStyle,
            figmaBodyStyle,
            figmaFooterStyle,
            figmaLoginStyle,
            figmaSelectionStyle,
            treeStyle,
            figmaComparisonStyle,
            imageComparatorSlideStyle,
            imageComparatorOverlayStyle,
            listTaskType,
            tagStyle,
            toastifyStyle,
            notificationStyle,
            messageModalStyle,
        ];
        this.importStyles(styles);
    }

    private loadEditorStyles(): void {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = this.quillStyle;
        link.crossOrigin = "anonymous";
        document.head.appendChild(link);
    }

    public importStyles(styles: string[]): void {
        const cssStrings = styles.join("\n");
        const style = document.createElement("style");
        style.innerHTML = cssStrings;
        uiManager.addElement(style);
    }
}

export const styleManager = StyleManager.getInstance();
