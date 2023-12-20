import css from "./modal.scss";

export class ModalManager {
    private modalElement: HTMLDivElement | null = null;
    private callback: () => void = () => {};

    private createModal(): HTMLDivElement {
        const modal = document.createElement("div");
        modal.style.display = "none"; // Start hidden
        modal.classList.add(css["modal"]);
        modal.innerHTML = `
            <div class="${css["modal-content"]}">
                <p id="modal-message"></p>
                <button id="modal-ok">OK</button>
                <button id="modal-cancel">Cancel</button>
            </div>
        `;
        // Add styles for your modal here or use an external CSS class

        // Event listeners
        modal
            .querySelector("#modal-ok")
            ?.addEventListener("click", () => this.handleOk());
        modal
            .querySelector("#modal-cancel")
            ?.addEventListener("click", () => this.handleCancel());

        return modal;
    }

    private handleOk(): void {
        this.closeModal();
        this.callback();
    }

    private handleCancel(): void {
        this.closeModal();
    }

    private openModal(): void {
        if (this.modalElement) {
            this.modalElement.style.display = "flex"; // Show the modal
        }
    }

    private closeModal(): void {
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
            "#modal-message"
        ) as HTMLParagraphElement;
        messageElement.textContent = message;

        this.openModal();
    }
}
