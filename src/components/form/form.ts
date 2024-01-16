import { GenericRequest } from "../../base";
import { Task } from "../list-task/types/Task";
import { FormComponent } from "./FormComponent";

export class FormManager {
    private onSubmitCallback: (data: GenericRequest<Task>) => void = () => {};
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
            task,
        );
    }

    public closeForm(): void {
        this.formComponent.close();
    }

    public onSubmit(
        callback: (data: GenericRequest<Task>) => void,
    ): FormManager {
        this.onSubmitCallback = callback;
        return this;
    }
}
