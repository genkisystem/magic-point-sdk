import collapsedIcon from "../../asset/collapsed-icon.svg";
import unCollapsedIcon from "../../asset/un-collapsed-icon.svg";
import { Component } from "../common";
import css from "./treeCss.scss";

export type TreeItem = {
    id: string;
    name: string;
    imageUrl?: string;
    children?: TreeItem[];
};

export class ScreenComponent implements Component {
    private selectedItem: TreeItem | null = null;
    private treeData: TreeItem[];
    private onSelectionChange: (selectedItem: TreeItem) => void;
    private container: HTMLElement;

    constructor(
        treeData: TreeItem[],
        onSelectionChange: (selectedItem: TreeItem) => void
    ) {
        this.treeData = treeData;
        this.onSelectionChange = onSelectionChange;
        this.container = document.createElement("div");
        this.container.className = css["tree-view-container"];
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
        listItem.classList.add(css["tree-item"]);

        listItem.appendChild(this.createItemContainer(item));

        if (item.children && item.children.length > 0) {
            listItem.appendChild(this.createChildrenContainer(item.children));
        }

        return listItem;
    }

    private createItemContainer(item: TreeItem): HTMLElement {
        const divContainer = document.createElement("div");
        divContainer.classList.add(css["item-container"]);

        if (item.children && item.children.length > 0) {
            divContainer.appendChild(this.createCollapseIcon());
        } else {
            divContainer.appendChild(this.createRadio(item));
        }

        const name = document.createElement("span");
        name.textContent = item.name;
        divContainer.appendChild(name);

        return divContainer;
    }

    private createCollapseIcon(): HTMLElement {
        const collapseIcon = document.createElement("span");
        collapseIcon.classList.add(css["collapse-icon"]);
        collapseIcon.innerHTML = unCollapsedIcon;
        collapseIcon.addEventListener(
            "click",
            this.toggleChildrenVisibility.bind(this, collapseIcon)
        );
        return collapseIcon;
    }

    private toggleChildrenVisibility(collapseIcon: HTMLElement): void {
        const childrenContainer =
            collapseIcon.parentElement?.nextElementSibling;
        if (
            childrenContainer &&
            childrenContainer.classList.contains(css["children-container"])
        ) {
            childrenContainer.classList.toggle(css["collapsed"]);
            collapseIcon.innerHTML = childrenContainer.classList.contains(
                css["collapsed"]
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
        subList.classList.add(css["children-container"]);
        children.forEach((child) =>
            subList.appendChild(this.createTreeItem(child))
        );
        return subList;
    }

    renderComponent() {
        this.container.innerHTML = "";

        const treeView = document.createElement("ul");
        treeView.classList.add(css["tree-view"]);
        this.treeData.forEach((item) =>
            treeView.appendChild(this.createTreeItem(item))
        );
        this.container.appendChild(treeView);
    }

    render(): HTMLElement {
        return this.container;
    }
}
