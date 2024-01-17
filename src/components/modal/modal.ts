import { EventBusInstance } from "@services";

export class ModalManager {
    private modalElement: HTMLDivElement | null = null;
    private callback: () => void = () => { };

    private createModal(): HTMLDivElement {
        const modal = document.createElement("div");
        modal.style.display = "none"; // Start hidden
        modal.classList.add("modal-message");
        modal.innerHTML = `
            <div class="modal-content">
                <p id="modal-message"></p>
                <button id="modal-ok">OK</button>
                <button id="modal-cancel">Cancel</button>
            </div>
        `;
        // Event listeners
        modal
            .querySelector("#modal-ok")
            ?.addEventListener("click", (e) => this.handleOk(e));
        modal
            .querySelector("#modal-cancel")
            ?.addEventListener("click", (e) => this.handleCancel(e));

        return modal;
    }

    private handleOk(e: Event): void {
        e.stopPropagation()
        this.closeModal();
        this.callback();
    }

    private handleCancel(e: Event): void {
        e.stopPropagation()
        this.closeModal();
    }

    private openModal(): void {
        EventBusInstance.emit('disable-magic-point')
        if (this.modalElement) {
            this.modalElement.style.display = "flex"; // Show the modal
        }
    }

    private closeModal(): void {
        EventBusInstance.emit('enable-magic-point')
        if (this.modalElement) {
            this.modalElement.style.display = "none"; // Hide the modal
        }
    }

    public showModal(message: string, callback: () => void): void {
        this.callback = callback;

        if (!this.modalElement) {
            this.modalElement = this.createModal();
            document.body.appendChild(this.modalElement);
        }

        const messageElement = this.modalElement.querySelector(
            "#modal-message",
        ) as HTMLParagraphElement;
        messageElement.textContent = message;

        this.openModal();
    }
}
