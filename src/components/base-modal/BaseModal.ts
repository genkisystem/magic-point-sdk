import { uiManager } from "@services";
import { createDivElement } from "@utils";
import { Component } from "../common";

type ModalSize = "sm" | "md" | "lg" | "full";

export class BaseModal {
    private modal: HTMLElement;
    private content: HTMLElement;

    constructor(size: ModalSize = "lg") {
        this.modal = createDivElement({ className: "modal" });

        this.content = createDivElement({ className: "modal-content" });

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

        this.modal.style.display = "flex";
        uiManager.addElement(this.modal);
    }

    hide(): void {
        uiManager.removeElement(this.modal);
    }
}
