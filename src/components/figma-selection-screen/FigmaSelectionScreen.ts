import closeIconSvg from "../../asset/input-close.svg";
import searchIconSvg from "../../asset/look.svg";
import { FigmaClient } from "../../figma/figma";
import { FigmaProjectFileResponse, FileImageMap } from "../../figma/type";
import { createDivElement } from "../../utils/html";
import { Component } from "../common";
import { FooterButtonConfigs } from "../figma-compare-footer/FigmaComparerFooter";
import { ScreenComponent, TreeItem } from "../tree/tree";
import css from "./selection.scss";

export class FigmaSelectionScreen implements Component {
    private componentElement: HTMLElement;
    private previewElement: HTMLElement;
    private screenComponent: ScreenComponent;
    private selectedItem: TreeItem | null = null;

    constructor(
        private figmaClient: FigmaClient,
        private updateFooter: (configs: FooterButtonConfigs) => void,
        private onSelectedItemChange: (selectedItem: TreeItem) => void
    ) {
        this.componentElement = createDivElement({
            className: css["modal-components-content-b"],
        });
        this.previewElement = createDivElement({ className: css["right"] });

        this.screenComponent = new ScreenComponent(
            [],
            this.onTreeSelectionChange
        );

        this.updateFooter({ nextButtonConfig: { disabled: true } });
        this.renderComponent();
    }

    private createSearchContainer(): HTMLElement {
        const searchContainer = createDivElement({
            className: css["search-container"],
        });
        const searchIcon = this.createSpanElement(
            `${css["icon"]} ${css["search-icon"]}`,
            searchIconSvg
        );
        const searchInput = this.createInputElement(
            css["search-input"],
            "Search..."
        );
        const closeIcon = this.createSpanElement(
            `${css["icon"]} ${css["close-icon"]}`,
            closeIconSvg
        );

        closeIcon.addEventListener("click", () => (searchInput.value = ""));

        searchContainer.appendChild(searchIcon);
        searchContainer.appendChild(searchInput);
        searchContainer.appendChild(closeIcon);

        return searchContainer;
    }

    private createSpanElement(
        className: string,
        innerHTML: string
    ): HTMLSpanElement {
        const span = document.createElement("span");
        span.className = className;
        span.innerHTML = innerHTML;
        return span;
    }

    private createInputElement(
        className: string,
        placeholder: string
    ): HTMLInputElement {
        const input = document.createElement("input");
        input.className = className;
        input.type = "text";
        input.placeholder = placeholder;
        return input;
    }

    private onTreeSelectionChange = (selectedItem: TreeItem): void => {
        this.selectedItem = selectedItem;
        this.updatePreview();
        this.onSelectedItemChange(selectedItem);
    };

    private updatePreview(): void {
        this.previewElement.innerHTML = "";
        if (this.selectedItem?.imageUrl) {
            const flexContainer = createDivElement({
                className: css["preview-container"],
            });
            const image = document.createElement("img");
            image.className = css["preview-image"];
            image.src = this.selectedItem.imageUrl;
            image.alt = this.selectedItem.name;
            flexContainer.appendChild(image);
            this.previewElement.appendChild(flexContainer);
        }
    }

    renderComponent(): void {
        this.componentElement.innerHTML = "";
        const left = createDivElement({ className: css["left"] });
        left.appendChild(this.createSearchContainer());

        const files = this.figmaClient.getFiles();
        const tree = files[0].map((file) =>
            this.mapFileToTreeItem(file, files[1])
        );

        this.screenComponent.updateData(tree);

        left.appendChild(this.screenComponent.render());

        this.componentElement.appendChild(left);
        this.componentElement.appendChild(this.previewElement);
    }

    private mapFileToTreeItem(
        file: FigmaProjectFileResponse,
        fileScreensMap: FileImageMap
    ): TreeItem {
        return {
            id: "temp",
            name: file.name,
            children: file.files.map((f) => ({
                id: f.key,
                name: f.name,
                imageUrl: f.thumbnail_url,
                children: fileScreensMap[f.key].map((s) => ({
                    id: s.name,
                    name: s.name,
                    imageUrl: s.image,
                })),
            })),
        };
    }

    render(): HTMLElement {
        return this.componentElement;
    }
}
