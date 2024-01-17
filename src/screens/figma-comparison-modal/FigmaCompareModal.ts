import { GenericRequest } from "../../base";
import { BaseModal } from "../../components/base-modal/BaseModal";
import { FigmaComparer } from "../../components/figma-comparer/FigmaComparer";
import { Task } from "../../components/list-task/types/Task";

import { FigmaClient, StateKeys, globalStateManager } from "@services";

export class FigmaComparerModal {
    private figmaComparer?: FigmaComparer;
    private teamIds: string[];

    constructor(
        private figmaClient: FigmaClient,
        private createTasks: (tasks: GenericRequest<Task>[]) => Promise<void>,
        private figmaComparerModal: BaseModal = new BaseModal("full"),
    ) {
        this.teamIds = [];
    }

    private setupModal(): void {
        if (!this.figmaComparer) {
            this.figmaComparer = new FigmaComparer(
                this.figmaClient,
                this.hideModal.bind(this),
                this.createTasks,
                this.teamIds,
            );
        }
        this.figmaComparerModal.setBody(this.figmaComparer);
    }

    public showModal(): void {
        this.teamIds =
            globalStateManager.getState(StateKeys.FigmaTeamIds) ?? [];
        this.setupModal();
        this.figmaComparerModal.show();
    }

    public hideModal(): void {
        this.figmaComparerModal.hide();
    }
}
