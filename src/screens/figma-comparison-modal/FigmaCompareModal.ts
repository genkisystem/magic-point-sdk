import { GenericRequest } from "../../base";
import { BaseModal } from "../../components/base-modal/BaseModal";
import { FigmaComparer } from "../../components/figma-comparer/FigmaComparer";
import { Task } from "../../components/list-task/types/Task";
import { FigmaClient } from "../../services/figma/figma";

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