import {
    SelectItem,
    convertSelectItemToType,
    convertTypeToSelectItem,
} from "@components/common";
import { ImageEditorWrapper } from "@components/image-editor/ImageEditor";
import { Task } from "@components/list-task/types/Task";
import { Type } from "@components/list-task/types/Type";
import {
    DataApiInterface,
    StateKeys,
    globalStateManager,
    uiManager,
} from "@services";
import {
    BASE64_IMAGE_PREFIX,
    createButton,
    createDivElement,
    createSelectBox,
} from "@utils";
import i18next from "i18next";
import Quill from "quill";
import { GenericRequest } from "src/base";
import { assigneeApi, issueApi, statusApi } from "src/services/apis";

enum FieldTypes {
    ISSUE_TYPE = "issue-type",
    ASSIGNEE = "assignee",
    ISSUE_STATUS = "issue-status",
    SUBJECT = "subject",
}

export class FormComponent {
    private static instance: FormComponent;
    private componentElement: HTMLElement;

    private imageEditorWrapper!: ImageEditorWrapper;

    private issueTypes: SelectItem[] = [];
    private assignees: SelectItem[] = [];
    private issueStatuses: SelectItem[] = [];

    private subject: string = "";
    private description: string = "";
    private selectedAssignee: SelectItem = {} as SelectItem;
    private initialSelectedAssignee: SelectItem = {} as SelectItem;
    private selectedIssueType: SelectItem = {} as SelectItem;
    private initialSelectedIssueType: SelectItem = {} as SelectItem;
    private selectedIssueStatus: SelectItem = {} as SelectItem;
    private initialSelectedIssueStatus: SelectItem = {} as SelectItem;

    private _currentDomString: string = "";
    private _currentCoordinate: string = "";

    private initialTask?: Task;

    private _onClickSubmit?: (formData: GenericRequest<Task>) => void;
    private _onCloseCallback?: () => void;

    constructor() {
        this.componentElement = createDivElement({
            className: "form-container",
        });
        this.componentElement.style.display = "none";
        uiManager.addElement(this.componentElement);
        this.init();
    }

    public static getInstance(): FormComponent {
        return this.instance || (this.instance = new FormComponent());
    }

    private async init(): Promise<void> {
        await this.fetchData();
        this.renderComponent();
    }

    private async fetchData(): Promise<void> {
        await Promise.all([
            this.fetchDataFromApi(assigneeApi, StateKeys.Assignee),
            this.fetchDataFromApi(statusApi, StateKeys.Status),
            this.fetchDataFromApi(issueApi, StateKeys.Issue),
        ]);
    }

    private async fetchDataFromApi<T>(
        api: DataApiInterface<T>,
        stateKey: StateKeys,
    ): Promise<void> {
        let dataFromState = globalStateManager.getState<T[]>(stateKey) || [];

        if (dataFromState.length > 0) {
            this.setStateFromData(stateKey, dataFromState);
            return;
        }

        try {
            const fetchedData = await api.getData();
            dataFromState = fetchedData?.appData ?? [];
            globalStateManager.setState(stateKey, dataFromState);
        } catch (error) {
            console.error(`Error fetching ${stateKey}:`, error);
            return;
        }

        this.setStateFromData(stateKey, dataFromState);
    }

    private setStateFromData(key: StateKeys, data: any[]): void {
        const convertedData = this.mapTypesToSelectItems(data);
        switch (key) {
            case StateKeys.Assignee:
                this.assignees = convertedData;
                this.initialSelectedAssignee =
                    { ...this.assignees[0] } ?? ({} as SelectItem);

                globalStateManager.setState(StateKeys.InitAssignee, {
                    ...this.initialSelectedAssignee,
                });
                this.selectedAssignee = { ...this.initialSelectedAssignee };
                break;
            case StateKeys.Issue:
                this.issueTypes = convertedData;
                this.initialSelectedIssueType =
                    { ...this.issueTypes[0] } ?? ({} as SelectItem);
                globalStateManager.setState(StateKeys.InitIssue, {
                    ...this.initialSelectedIssueType,
                });
                this.selectedIssueType = { ...this.initialSelectedIssueType };
                break;
            case StateKeys.Status:
                this.issueStatuses = convertedData;
                this.initialSelectedIssueStatus =
                    { ...this.issueStatuses[0] } ?? ({} as SelectItem);
                globalStateManager.setState(StateKeys.InitStatus, {
                    ...this.initialSelectedIssueStatus,
                });

                this.selectedIssueStatus = {
                    ...this.initialSelectedIssueStatus,
                };
            default:
                break;
        }
    }

    private mapTypesToSelectItems(types: any[]): any[] {
        return types ? types.map((type) => convertTypeToSelectItem(type)) : [];
    }

    set currentDomString(newValue: string) {
        this._currentDomString = newValue;
    }

    get currentDomString(): string {
        return this._currentDomString;
    }

    set currentCoordinate(newValue: string) {
        this._currentCoordinate = newValue;
    }

    public show(
        image: string,
        submitCallback: (data: GenericRequest<Task>) => void,
        closeCallback?: () => void,
        initTask?: Task,
    ): void {
        if (initTask) {
            this.setInitialValues(initTask);
        }
        this.renderComponent();
        this.imageEditorWrapper.loadImage(image);
        this.componentElement.style.display = "block";
        this._onClickSubmit = submitCallback;
        this._onCloseCallback = closeCallback;
    }

    public close(): void {
        this.resetComponent();
        this.componentElement.style.display = "none";
    }

    private renderComponent(): void {
        this.componentElement.innerHTML = "";
        this.componentElement.appendChild(this.createForm());
    }

    private createForm(): HTMLFormElement {
        const formElement = document.createElement("form");
        formElement.className = "form-wrapper";

        formElement.appendChild(this.createImageColumn());
        formElement.appendChild(this.createVerticalLine());
        formElement.appendChild(this.createSecondColumn());

        return formElement;
    }

    private createVerticalLine(): HTMLElement {
        const verticalLine = createDivElement({ className: "vertical-line" });
        return verticalLine;
    }

    private createImageColumn(): HTMLElement {
        const imageColumn = createDivElement({ className: "first-col" });
        const imageEditorDiv = createDivElement();
        imageColumn.appendChild(imageEditorDiv);

        this.imageEditorWrapper = new ImageEditorWrapper(imageEditorDiv);

        return imageColumn;
    }

    private createSecondColumn(): HTMLElement {
        const secondCol = createDivElement({ className: "second-col" });

        secondCol.appendChild(
            this.createSelectFieldRow(
                FieldTypes.ISSUE_TYPE,
                i18next.t("form:Type"),
                this.issueTypes,
                this.selectedIssueType,
            ),
        );
        secondCol.appendChild(
            this.createInputFieldRow(
                FieldTypes.SUBJECT,
                i18next.t("form:Subject"),
                this.subject,
            ),
        );
        secondCol.appendChild(
            this.createSelectFieldRow(
                FieldTypes.ASSIGNEE,
                i18next.t("form:Assignee"),
                this.assignees,
                this.selectedAssignee,
            ),
        );
        secondCol.appendChild(
            this.createSelectFieldRow(
                FieldTypes.ISSUE_STATUS,
                i18next.t("form:Status"),
                this.issueStatuses,
                this.selectedIssueStatus,
            ),
        );

        secondCol.appendChild(this.createDescriptionRow());
        secondCol.appendChild(this.createActionsRow());

        return secondCol;
    }

    private createInputFieldRow(
        type: string,
        label: string,
        value: string,
    ): HTMLElement {
        const fieldRow = this.createRow();
        const fieldWrap = createDivElement({ className: "field-wrap" });

        fieldWrap.appendChild(this.createLabel(label));

        const fieldInput = document.createElement("input");
        fieldInput.type = "text";
        fieldInput.id = type;
        fieldInput.value = value;
        fieldInput.addEventListener("change", (event) =>
            this.handleChangeInputField(
                type,
                (event.target as HTMLInputElement).value,
            ),
        );

        fieldWrap.appendChild(fieldInput);
        fieldRow.appendChild(fieldWrap);

        return fieldRow;
    }

    private createSelectFieldRow(
        type: string,
        label: string,
        data: SelectItem[],
        selectedValue: SelectItem,
    ): HTMLElement {
        const fieldRow = this.createRow();
        const fieldWrap = createDivElement({ className: "field-wrap" });

        fieldWrap.appendChild(this.createLabel(label));

        const fieldSelect = createSelectBox({
            options: data,
            onChange: (value) => this.handleChangeSelectBox(type, value),
            selectedValue: selectedValue.value?.toString() || "",
        });

        fieldSelect.id = type;
        fieldWrap.appendChild(fieldSelect);
        fieldRow.appendChild(fieldWrap);

        return fieldRow;
    }

    private createDescriptionRow(): HTMLElement {
        const descriptionRow = this.createRow();
        const fieldWrap = createDivElement({ className: "field-wrap" });

        fieldWrap.appendChild(this.createLabel("Description"));

        const descriptionContainer = createDivElement();

        const descriptionEditor = createDivElement({ className: "text-area" });
        descriptionEditor.id = "editor";
        descriptionContainer.appendChild(descriptionEditor);

        fieldWrap.appendChild(descriptionContainer);
        descriptionRow.appendChild(fieldWrap);

        const quill = new Quill(descriptionEditor, {
            debug: false,
            theme: "snow",
        });

        quill.clipboard.dangerouslyPasteHTML(this.description || "");

        return descriptionRow;
    }

    private createActionsRow(): HTMLElement {
        const actionsRow = createDivElement({ className: "row-actions" });

        actionsRow.appendChild(
            this.createButton(
                "Cancel",
                "cancel-btn",
                "secondary",
                "outlined",
                this.onClose.bind(this),
            ),
        );
        actionsRow.appendChild(
            this.createButton(
                this.getSubmitText(),
                "submit-btn",
                "primary",
                "contained",
                this.onSubmit.bind(this),
            ),
        );

        return actionsRow;
    }

    private createRow(): HTMLElement {
        return createDivElement({ className: "row" });
    }

    private createLabel(text: string): HTMLElement {
        const fieldLabel = document.createElement("label");
        fieldLabel.className = "label";
        fieldLabel.textContent = text;

        return fieldLabel;
    }

    private createButton(
        text: string,
        id: string,
        color: "primary" | "secondary" | "error" | "warning",
        variant: "text" | "contained" | "outlined",
        onClick: (event: MouseEvent) => void,
    ): HTMLElement {
        return createButton({
            text,
            id,
            onClick,
            variant,
            color,
        });
    }

    private handleChangeInputField(type: string, value: string): void {
        switch (type) {
            case FieldTypes.SUBJECT:
                this.subject = value;
                break;
        }
    }

    private getSubmitText(): string {
        return this.initialTask && this.initialTask.id
            ? i18next.t("form:Update")
            : i18next.t("form:submit");
    }

    private getCurrentDescription(): string {
        const description =
            document.querySelector("#editor .ql-editor")?.innerHTML;
        return description || "No description";
    }

    private getBase64Images(): string[] {
        const attachImage = this.imageEditorWrapper
            .getImageDataUrl()
            ?.replace(BASE64_IMAGE_PREFIX, "")!;
        return [attachImage];
    }

    private resetComponent(): void {
        this.subject = "";
        this.selectedAssignee = { ...this.initialSelectedAssignee };
        this.selectedIssueType = { ...this.initialSelectedIssueType };
        this.selectedIssueStatus = { ...this.initialSelectedIssueStatus };

        this.imageEditorWrapper.reset();
        this.renderComponent();
    }

    private onClose(event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.close();
        if (this._onCloseCallback) {
            this._onCloseCallback();
        }
    }

    private onSubmit(event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation()
        const formData: GenericRequest<Task> = {
            appData: {
                ...this.initialTask,
                assignee: convertSelectItemToType(this.selectedAssignee),
                title: this.subject,
                description: this.getCurrentDescription(),
                base64Images: this.getBase64Images(),
                issueType: convertSelectItemToType(this.selectedIssueType),
                taskStatus: convertSelectItemToType(this.selectedIssueStatus),
                pointDom: this._currentDomString,
                endPoint: window.location.pathname,
                pointCoordinate: this._currentCoordinate,
                screenSize: window.innerWidth,
            },
        };

        if (this._onClickSubmit) {
            this._onClickSubmit(formData);
        }
    }

    private handleChangeSelectBox(type: string, value: string): void {
        switch (type) {
            case FieldTypes.ISSUE_TYPE:
                this.selectedIssueType = this.issueTypes.find(
                    (x) => x.value.toString() === value,
                )!;
                break;
            case FieldTypes.ASSIGNEE:
                this.selectedAssignee = this.assignees.find(
                    (x) => x.value.toString() === value,
                )!;
                break;
            case FieldTypes.ISSUE_STATUS:
                this.selectedIssueStatus = this.issueStatuses.find(
                    (x) => x.value.toString() === value,
                )!;
                break;
            default:
                break;
        }
    }

    private setInitialValues(initTask?: Task): void {
        this.initialTask = initTask;
        this.subject = initTask?.title || "";
        this.description = initTask?.description || "";

        this.selectedAssignee = this.getSelectItem(
            this.assignees,
            initTask?.assignee,
        );
        this.selectedIssueType = this.getSelectItem(
            this.issueTypes,
            initTask?.issueType,
        );
        this.selectedIssueStatus = this.getSelectItem(
            this.issueStatuses,
            initTask?.taskStatus,
        );
    }

    private getSelectItem(
        itemList: SelectItem[],
        item?: Type | null | undefined,
    ): SelectItem {
        if (item && item.id !== -1) {
            return convertTypeToSelectItem(item);
        } else {
            return { ...itemList[0] } ?? ({} as SelectItem);
        }
    }
}
