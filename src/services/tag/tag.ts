import { EventBusInstance } from "../event-bus";

export interface ITag {
    divElement: HTMLDivElement;
    offsetX: number;
    offsetY: number;
}

export class TagManager {
    // private divElement: HTMLElement | null = null;
    // private offsetX: number = 0;
    // private offsetY: number = 0;

    private listTag: ITag[] = [];
    private currentSelectedTagIndex: number = Number.MAX_VALUE;

    constructor(private magicPointContainer: HTMLElement) {
        this.onTagClick = this.onTagClick.bind(this);
        this.startDrag = this.startDrag.bind(this);
        this.drag = this.drag.bind(this);
        this.endDrag = this.endDrag.bind(this);
        this.clearListTag = this.clearListTag.bind(this);
        this.setupEventBuses = this.setupEventBuses.bind(this);
        this.setupEventBuses();
    }

    public createTag(x: number, y: number, title?: string): void {
        const tagElement = document.createElement("div");
        tagElement.classList.add("draggable-div");
        tagElement.title = title || "";
        tagElement.style.left = `${x}px`;
        tagElement.style.top = `${y}px`;
        this.magicPointContainer.appendChild(tagElement);
        this.listTag.push({ divElement: tagElement, offsetX: 0, offsetY: 0 });
        tagElement.addEventListener("click", this.onTagClick);
        tagElement.addEventListener("mousedown", this.startDrag);
    }

    private onTagClick(event: MouseEvent): void {
        event.stopPropagation();
    }

    private findTagIndexInListTag(fTag: HTMLDivElement): number {
        return this.listTag.findIndex((tag) => tag.divElement === fTag);
    }

    private startDrag(event: MouseEvent): void {
        this.currentSelectedTagIndex = this.findTagIndexInListTag(
            event.target as HTMLDivElement,
        );
        console.log(this.currentSelectedTagIndex);
        const tagItem = this.listTag[this.currentSelectedTagIndex];
        if (!tagItem) return;
        tagItem.offsetX =
            event.clientX - tagItem.divElement.getBoundingClientRect().left;
        tagItem.offsetY =
            event.clientY - tagItem.divElement.getBoundingClientRect().top;
        tagItem.divElement.style.cursor = "grabbing";

        document.addEventListener("mousemove", this.drag);
        document.addEventListener("mouseup", this.endDrag);
    }

    private drag(event: MouseEvent): void {
        const tagItem = this.listTag[this.currentSelectedTagIndex];
        console.log("tagItem: ", tagItem);
        if (!tagItem) return;
        tagItem.divElement.style.left = `${event.clientX - tagItem.offsetX}px`;
        tagItem.divElement.style.top = `${event.clientY - tagItem.offsetY}px`;
    }

    private endDrag(): void {
        // if (!this.divElement) return;

        // this.divElement.style.cursor = "grab";
        const tagItem = this.listTag[this.currentSelectedTagIndex];
        if (!tagItem) return;
        tagItem.divElement.style.cursor = "grab";
        document.removeEventListener("mousemove", this.drag);
        document.removeEventListener("mouseup", this.endDrag);
    }

    // public destroy(): void {
    //     if (this.divElement) {
    //         this.divElement.removeEventListener("click", this.onTagClick);
    //         this.divElement.removeEventListener("mousedown", this.startDrag);
    //     }
    //     document.removeEventListener("mousemove", this.drag);
    //     document.removeEventListener("mouseup", this.endDrag);
    // }

    private clearListTag(): void {
        if (this.listTag?.length === 0) return;
        for (const tagItem of this.listTag) {
            tagItem.divElement.remove();
        }
        this.listTag = [];
    }

    private setupEventBuses() {
        EventBusInstance.on("clear-tags", this.clearListTag);
        EventBusInstance.on("remove-dot", (index: number) => {
            this.listTag.length > 0 &&
                this.listTag[index] &&
                this.listTag[index]?.divElement.remove();
        });
    }
}
