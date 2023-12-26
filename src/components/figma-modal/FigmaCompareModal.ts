import { GenericRequest } from "../../base";
import { FigmaClient } from "../../figma/figma";
import { BaseModal } from "../base-modal/BaseModal";
import { FigmaComparer } from "../figma-comparer/FigmaComparer";
import { Task } from "../list-task/types/Task";

export class FigmaComparerModal {
    private figmaComparer?: FigmaComparer;
    private teamIds: string[];

    constructor(
        private figmaClient: FigmaClient,
        private onTasksCreation: (
            tasks: GenericRequest<Task>[]
        ) => Promise<void>,
        private comparisonModal: BaseModal = new BaseModal("full")
    ) {
        this.teamIds = [];
    }

    private setupModal(): void {
        if (!this.figmaComparer) {
            this.figmaComparer = new FigmaComparer(
                this.figmaClient,
                this.hideModal.bind(this),
                this.onTasksCreation,
                this.teamIds
            );
        }
        this.comparisonModal.setBody(this.figmaComparer);
    }

    public showModal(teamIds: string[]): void {
        this.teamIds = teamIds;
        this.setupModal();
        this.comparisonModal.show();
    }

    public hideModal(): void {
        this.comparisonModal.hide();
    }
}
