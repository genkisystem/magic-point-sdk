import { createDivElement } from "../../utils";
import { APP_ID } from "../../utils/constants";
import { Component } from "../common";
import css from "./modal.scss";

type ModalSize = "sm" | "md" | "lg" | "full";

export class BaseModal {
    private modal: HTMLElement;
    private content: HTMLElement;

    constructor(size: ModalSize = "lg") {
        this.modal = createDivElement({ className: css["modal"] });

        this.content = createDivElement({ className: css["modal-content"] });

        this.modal.appendChild(this.content);

        this.setSize(size);
    }

    private setSize(size: ModalSize) {
        const sizes = {
            sm: {
                width: "60%",
                height: "60%",
                maxWidth: "600px",
                maxHeight: "calc(100vh - 400px)",
            },
            md: {
                width: "70%",
                height: "70%",
                maxWidth: "900px",
                maxHeight: "calc(100vh - 300px)",
            },
            lg: {
                width: "80%",
                height: "80%",
                maxWidth: "1200px",
                maxHeight: "calc(100vh - 225px)",
            },
            full: {
                width: "100%",
                height: "100%",
                maxWidth: "none",
                maxHeight: "none",
            },
        };

        const { width, height, maxWidth, maxHeight } =
            sizes[size] || sizes["lg"];
        Object.assign(this.content.style, {
            width,
            height,
            maxWidth,
            maxHeight,
        });
    }

    setBody(component: Component): void {
        this.content.innerHTML = "";
        this.content.appendChild(component.render());
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
