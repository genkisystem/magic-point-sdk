import { APP_ID } from "../../utils/constants";
import { Component } from "../common";
import css from "./modal.scss";

export class BaseModal {
    private modalElement: HTMLElement;
    private contentElement: HTMLElement;

    constructor(size: "sm" | "md" | "lg" | "full" = "lg") {
        this.modalElement = document.createElement("div");
        this.modalElement.classList.add(css["modal"]);

        this.contentElement = document.createElement("div");
        this.contentElement.classList.add(css["modal-content"]);
        this.modalElement.appendChild(this.contentElement);

        this.setSize(size);
    }

    private setSize(size: "sm" | "md" | "lg" | "full"): void {
        switch (size) {
            case "sm":
                this.contentElement.style.width = "60%";
                this.contentElement.style.height = "60%";
                this.contentElement.style.maxWidth = "600px";
                this.contentElement.style.maxHeight = "calc(100vh - 400px)";
                break;
            case "md":
                this.contentElement.style.width = "70%";
                this.contentElement.style.height = "70%";
                this.contentElement.style.maxWidth = "900px";
                this.contentElement.style.maxHeight = "calc(100vh - 300px)";
                break;
            case "lg":
                this.contentElement.style.width = "80%";
                this.contentElement.style.height = "80%";
                this.contentElement.style.maxWidth = "1200px";
                this.contentElement.style.maxHeight = "calc(100vh - 225px)";
                break;
            case "full":
                this.contentElement.style.width = "100%";
                this.contentElement.style.height = "100%";
                this.contentElement.style.maxWidth = "none";
                this.contentElement.style.maxHeight = "none";
                break;
            default:
                console.error("Invalid size specified.");
                break;
        }
    }

    setBody(component: Component): void {
        const renderedContent = component.render();
        this.contentElement.innerHTML = "";
        this.contentElement.appendChild(renderedContent);
    }

    show(): void {
        const targetDiv: HTMLElement | null = document.getElementById(APP_ID);

        if (targetDiv) {
            if (!this.modalElement.parentElement) {
                targetDiv.appendChild(this.modalElement);
            }
            this.modalElement.style.display = "flex";
        } else {
            console.error("Target div with ID 'A' not found.");
        }
    }
    hide(): void {
        const targetDiv: HTMLElement | null = document.getElementById(APP_ID);

        if (targetDiv && this.modalElement.parentElement === targetDiv) {
            targetDiv.removeChild(this.modalElement);
        }
    }
}
