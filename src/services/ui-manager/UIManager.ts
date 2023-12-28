import MagicPoint from "../..";
import css from "../../index.scss";

export class UIManager {
    constructor(private magicPointInstance: MagicPoint) {
        console.log(this.magicPointInstance);
    }

    toggleButtonClass(activeBtn: HTMLElement, inactiveBtn: HTMLElement): void {
        activeBtn.classList.add(css["active"]);
        inactiveBtn.classList.remove(css["active"]);
    }

    // TODO: Refactor more
}
