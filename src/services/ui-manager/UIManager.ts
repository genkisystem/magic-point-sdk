import css from "../../index.scss";

export class UIManager {
    toggleButtonClass(activeBtn: HTMLElement, inactiveBtn: HTMLElement): void {
        activeBtn.classList.add(css["active"]);
        inactiveBtn.classList.remove(css["active"]);
    }

    // TODO: Refactor more
}
