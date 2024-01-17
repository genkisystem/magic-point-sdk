import { GenericRequest } from "../../base";
import { Task } from "../list-task/types/Task";
import { FormComponent } from "./FormComponent";

export class FormManager {
    private onSubmitCallback: (data: GenericRequest<Task>) => void = () => { };
    private onCloseCallback?: () => void;
    private currentDomString: string;
    private currentCoordinate: string;
    private formComponent: FormComponent;

    constructor() {
        this.currentDomString = "";
        this.currentCoordinate = "";
        this.formComponent = FormComponent.getInstance();
        this.formComponent.currentDomString = this.currentDomString;
    }

    public setCurrentDomString(domString: string): void {
        this.currentDomString = domString;
        this.formComponent.currentDomString = this.currentDomString;
    }

    public setCurrentCoordinate(coordinate: string): void {
        this.currentCoordinate = coordinate;
        this.formComponent.currentCoordinate = this.currentCoordinate;
    }

    public createForm(canvasImage: HTMLCanvasElement, task?: Task): void {
        this.formComponent.show(
            canvasImage.toDataURL(),
            this.onSubmitCallback.bind(this),
            this.onCloseCallback?.bind(this),
            task,
        );
    }

    public closeForm(): void {
        this.formComponent.close();
    }

    public setCallback(
        submitCallback: (data: GenericRequest<Task>) => void,
        closeCallback?: () => void,
    ): FormManager {
        this.onSubmitCallback = submitCallback;
        this.onCloseCallback = closeCallback;
        return this;
    }
}
