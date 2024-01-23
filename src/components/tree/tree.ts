import { collapsedIcon, unCollapsedIcon } from "@icons";
import { createDivElement } from "@utils";
import { Node } from "figma-api/lib/ast-types";
import { Component } from "../common";

export type TreeItem = {
    id: string;
    name: string;
    level: number; // Add this line
    imageUrl?: string;
    children?: TreeItem[];
    node?: Node;
};

export class ScreenComponent implements Component {
    private selectedItem: TreeItem | null = null;
    private treeData: TreeItem[];
    private onSelectionChange: (selectedItem: TreeItem) => void;
    private container: HTMLElement;

    constructor(
        treeData: TreeItem[],
        onSelectionChange: (selectedItem: TreeItem) => void,
    ) {
        this.treeData = treeData;
        this.onSelectionChange = onSelectionChange;
        this.container = createDivElement({ className: "tree-view-container" });
        this.renderComponent();
    }

    public getSelectedImage(): TreeItem | null {
        return this.selectedItem;
    }

    public updateData(data: TreeItem[]) {
        this.treeData = data;
        this.renderComponent();
    }

    private handleRadioChange(item: TreeItem): void {
        this.selectedItem = item;
        this.onSelectionChange(item);
    }

    private createTreeItem(item: TreeItem): HTMLElement {
        const listItem = document.createElement("li");
        listItem.classList.add("tree-item");

        listItem.appendChild(this.createItemContainer(item));

        if (item.children && item.children.length > 0) {
            listItem.appendChild(this.createChildrenContainer(item.children));
        }

        return listItem;
    }

    private createItemContainer(item: TreeItem): HTMLElement {
        const divContainer = createDivElement({ className: "item-container" });

        if (item.level === 2) {
            divContainer.appendChild(this.createRadio(item));
        } else {
            divContainer.appendChild(this.createCollapseIcon());
        }

        const name = document.createElement("span");
        name.textContent = item.name;
        divContainer.appendChild(name);

        return divContainer;
    }

    private createCollapseIcon(): HTMLElement {
        const collapseIcon = document.createElement("span");
        collapseIcon.classList.add("collapse-icon");
        collapseIcon.innerHTML = unCollapsedIcon;
        collapseIcon.addEventListener(
            "click",
            this.toggleChildrenVisibility.bind(this, collapseIcon),
        );
        return collapseIcon;
    }

    private toggleChildrenVisibility(collapseIcon: HTMLElement): void {
        const childrenContainer =
            collapseIcon.parentElement?.nextElementSibling;
        if (
            childrenContainer &&
            childrenContainer.classList.contains("children-container")
        ) {
            childrenContainer.classList.toggle("collapsed");
            collapseIcon.innerHTML = childrenContainer.classList.contains(
                "collapsed",
            )
                ? collapsedIcon
                : unCollapsedIcon;
        }
    }

    private createRadio(item: TreeItem): HTMLElement {
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "treeRadio";
        radio.addEventListener("change", () => this.handleRadioChange(item));
        return radio;
    }

    private createChildrenContainer(children: TreeItem[]): HTMLElement {
        const subList = document.createElement("ul");
        subList.classList.add("children-container");
        children.forEach((child) =>
            subList.appendChild(this.createTreeItem(child)),
        );
        return subList;
    }

    renderComponent() {
        this.container.innerHTML = "";

        const treeView = document.createElement("ul");
        treeView.classList.add("tree-view");
        this.treeData.forEach((item) =>
            treeView.appendChild(this.createTreeItem(item)),
        );
        this.container.appendChild(treeView);
    }

    render(): HTMLElement {
        return this.container;
    }
}
