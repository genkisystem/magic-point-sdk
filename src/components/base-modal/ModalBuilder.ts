import { Component } from "../common";
import { BaseModal } from "./BaseModal";

export class ModalBuilder {
    private size: "sm" | "md" | "lg" | "full" = "lg";
    private component: Component | null = null;

    withSize(size: "sm" | "md" | "lg" | "full"): ModalBuilder {
        this.size = size;
        return this;
    }

    withBody(component: Component): ModalBuilder {
        this.component = component;
        return this;
    }

    build(): BaseModal {
        const modal = new BaseModal(this.size);
        if (this.component) {
            modal.setBody(this.component);
        }
        return modal;
    }
}
