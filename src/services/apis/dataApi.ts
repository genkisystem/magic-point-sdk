import { GenericResponse } from "../../base";
import { BaseApi } from "./baseApi";

export class DataApi<T> extends BaseApi {
    constructor(private readonly path: string) {
        super();
    }

    public async getData(): Promise<GenericResponse<T>> {
        return await this.invoke<GenericResponse<T>>("GET", this.path);
    }
}
