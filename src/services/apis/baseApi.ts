import { licenseManagerInstance } from "../license/license";

export class BaseApi {
    protected readonly baseUrl: string =
        process.env.BASE_URL || `http://localhost:${process.env.PORT}/api/`;

    public async get(path: string): Promise<object | object[]> {
        return await this.invoke("GET", path);
    }

    public async post(
        path: string,
        reqObj: object,
    ): Promise<object | object[]> {
        return await this.invoke("POST", path, reqObj);
    }

    public async put(path: string, reqObj: object): Promise<object | object[]> {
        return await this.invoke("PUT", path, reqObj);
    }

    public async delete(path: string): Promise<object | object[]> {
        return await this.invoke("DELETE", path);
    }

    public async invoke<T>(
        method: string,
        path: string,
        data?: object | null,
        options?: RequestInit,
    ): Promise<T> {
        if (!licenseManagerInstance.isValidApiKey()) {
            throw new Error("Invalid API key");
        }

        const url = `${this.baseUrl}${path}`;
        const headers = new Headers({
            "content-type": "application/json",
            "api-key": licenseManagerInstance.getApiKey()!,
            "Access-Control-Allow-Origin": "",
        });
        const config: RequestInit = {
            method,
            headers,
            body: data ? JSON.stringify(data) : undefined,
            ...options,
        };
        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const json = await response.json();
            return json;
        } catch (error) {
            console.error("Error:", error);
            throw error;
        }
    }
}
