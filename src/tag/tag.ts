import css from "./tag.scss";

export class TagManager {
    private divElement: HTMLElement | null = null;
    private offsetX: number = 0;
    private offsetY: number = 0;

    constructor() {}

    public createTag(x: number, y: number): void {
        this.divElement = document.createElement("div");
        this.divElement.classList.add(css["draggable-div"]);
        this.divElement.style.left = `${x}px`;
        this.divElement.style.top = `${y}px`;

        document.body.appendChild(this.divElement);

        this.divElement.addEventListener("mousedown", this.startDrag);
    }

    private startDrag = (event: MouseEvent): void => {
        if (!this.divElement) return;

        this.offsetX =
            event.clientX - this.divElement.getBoundingClientRect().left;
        this.offsetY =
            event.clientY - this.divElement.getBoundingClientRect().top;
        this.divElement.style.cursor = "grabbing";

        document.addEventListener("mousemove", this.drag);
        document.addEventListener("mouseup", this.endDrag);
    };

    private drag = (event: MouseEvent): void => {
        if (!this.divElement) return;

        this.divElement.style.left = `${event.clientX - this.offsetX}px`;
        this.divElement.style.top = `${event.clientY - this.offsetY}px`;
    };

    private endDrag = (): void => {
        if (!this.divElement) return;

        this.divElement.style.cursor = "grab";
        document.removeEventListener("mousemove", this.drag);
        document.removeEventListener("mouseup", this.endDrag);
    };
}