import { inputCloseIcon, searchIconSvg } from "@icons";

import {
    ExtendedGetProjectFilesResult,
    FigmaClient,
    FileImageMap,
} from "@services";
import { createDivElement } from "@utils";
import i18next from "i18next";
import { Component } from "../common";
import { FooterButtonConfigs } from "../figma-compare-footer/FigmaComparerFooter";
import { ScreenComponent, TreeItem } from "../tree/tree";

export class FigmaSelectionScreen implements Component {
    private componentElement: HTMLElement;
    private previewElement: HTMLElement;
    private screenComponent: ScreenComponent;
    private selectedItem: TreeItem | null = null;

    constructor(
        private figmaClient: FigmaClient,
        private updateFooter: (configs: FooterButtonConfigs) => void,
        private onSelectedItemChange: (selectedItem: TreeItem) => void,
    ) {
        this.componentElement = createDivElement({
            className: "figma-selection-screen",
        });

        this.previewElement = createDivElement({ className: "figma-preview" });

        this.screenComponent = new ScreenComponent(
            [],
            this.onTreeSelectionChange,
        );

        this.updateFooter({ nextButtonConfig: { disabled: true } });
        this.renderComponent();
    }

    private createSearchContainer(): HTMLElement {
        const searchContainer = createDivElement({
            className: "search-container",
        });
        const searchIcon = this.createSpanElement(
            "icon search-icon",
            searchIconSvg,
        );
        const searchInput = this.createInputElement(
            "search-input",
            `${i18next.t("figma:selectionScreen.searchInputPlaceholder")}`,
        );
        const closeIcon = this.createSpanElement(
            "icon close-icon",
            inputCloseIcon,
        );

        closeIcon.addEventListener("click", () => (searchInput.value = ""));

        searchContainer.appendChild(searchIcon);
        searchContainer.appendChild(searchInput);
        searchContainer.appendChild(closeIcon);

        return searchContainer;
    }

    private createSpanElement(
        className: string,
        innerHTML: string,
    ): HTMLSpanElement {
        const span = document.createElement("span");
        span.className = className;
        span.innerHTML = innerHTML;
        return span;
    }

    private createInputElement(
        className: string,
        placeholder: string,
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
                className: "preview-container",
            });
            const image = document.createElement("img");
            image.className = "preview-image";
            image.src = this.selectedItem.imageUrl;
            image.alt = this.selectedItem.name;
            flexContainer.appendChild(image);
            this.previewElement.appendChild(flexContainer);
        }
        // TODO: analyze screen
    }

    renderComponent(): void {
        this.componentElement.innerHTML = "";
        const left = createDivElement({ className: "figma-selection" });
        left.appendChild(this.createSearchContainer());

        const files = this.figmaClient.getFiles();
        const tree = files[0].map((file) =>
            this.mapFileToTreeItem(file, files[1]),
        );

        this.screenComponent.updateData(tree);

        left.appendChild(this.screenComponent.render());

        this.componentElement.appendChild(left);
        this.componentElement.appendChild(this.previewElement);
    }

    private mapFileToTreeItem(
        file: ExtendedGetProjectFilesResult,
        fileScreensMap: FileImageMap,
    ): TreeItem {
        return {
            id: "temp",
            name: file.name,
            level: 0,
            children: file.files.map(
                (f): TreeItem => ({
                    id: f.key,
                    name: f.name,
                    imageUrl: f.thumbnail_url,
                    level: 1,
                    children: fileScreensMap[f.key].map(
                        (s): TreeItem => ({
                            id: s.name,
                            name: s.name,
                            imageUrl: s.image,
                            level: 2,
                            node: s.node,
                        }),
                    ),
                }),
            ),
        };
    }

    render(): HTMLElement {
        return this.componentElement;
    }
}
