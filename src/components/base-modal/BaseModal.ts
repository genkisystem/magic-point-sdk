import { APP_ID } from "../../utils/constants";
import { Component } from "../common";
import css from "./modal.scss";

export class BaseModal {
    private modal: HTMLElement;
    private content: HTMLElement;

    constructor(size: "sm" | "md" | "lg" | "full" = "lg") {
        this.modal = document.createElement("div");
        this.modal.classList.add(css["modal"]);

        this.content = document.createElement("div");
        this.content.classList.add(css["modal-content"]);
        this.modal.appendChild(this.content);

        this.setSize(size);
    }

    private setSize(size: "sm" | "md" | "lg" | "full"): void {
        switch (size) {
            case "sm":
                this.content.style.width = "60%";
                this.content.style.height = "60%";
                this.content.style.maxWidth = "600px";
                this.content.style.maxHeight = "calc(100vh - 400px)";
                break;
            case "md":
                this.content.style.width = "70%";
                this.content.style.height = "70%";
                this.content.style.maxWidth = "900px";
                this.content.style.maxHeight = "calc(100vh - 300px)";
                break;
            case "lg":
                this.content.style.width = "80%";
                this.content.style.height = "80%";
                this.content.style.maxWidth = "1200px";
                this.content.style.maxHeight = "calc(100vh - 225px)";
                break;
            case "full":
                this.content.style.width = "100%";
                this.content.style.height = "100%";
                this.content.style.maxWidth = "none";
                this.content.style.maxHeight = "none";
                break;
            default:
                console.error("Invalid size specified.");
                break;
        }
    }

    setBody(component: Component): void {
        const renderedContent = component.render();
        this.content.innerHTML = "";
        this.content.appendChild(renderedContent);
    }

    show(): void {
        if (this.modal.parentElement) {
            return;
        }

        const appDiv: HTMLElement | null = document.getElementById(APP_ID);
        if (!appDiv) {
            console.error(`Target div with ID ${APP_ID} not found.`);
            return;
        }

        appDiv.appendChild(this.modal);
        this.modal.style.display = "flex";
    }

    hide(): void {
        const appDiv: HTMLElement | null = document.getElementById(APP_ID);
        if (!appDiv || this.modal.parentElement !== appDiv) {
            return;
        }

        appDiv.removeChild(this.modal);
    }
}
