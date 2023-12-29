// import fetch from 'isomorphic-unfetch'

export type ConfigurationOptions = {
    apiKey: string,
    baseUrl?: string
}

export type Response<T> = {
    appData: T,
    errorCode: string,
    hasError: boolean,
    message: string,
}

export type GenericRequest<T> = {
    appData: T
}

export abstract class Base {
    public apiKey: string
    public baseUrl: string
    constructor(config: ConfigurationOptions) {
        this.apiKey = config.apiKey
        this.baseUrl = config.baseUrl || `http://localhost:${process.env.PORT}/api/`
    }


    public async post(path: string, reqObj: object) {
        console.log(path)
        console.log(reqObj)
        return await this.invoke('POST', path, reqObj)
        // return this.invoke('post', path, reqObj)
    }

    public async get(path: string): Promise<object | object[]> {
        return await this.invoke('GET', path)
    }

    protected async invoke<T>(method: string, path: string, data?: object | null, options?: RequestInit): Promise<T> {
        const url = `${this.baseUrl}${path}`

        const headers = new Headers({
            "content-type": "application/json",
            "api-key": this.apiKey,
            "Access-Control-Allow-Origin": ''
        })

        const config = {
            method: method,
            // mode: 'no-cors' as RequestMode,
            ...options,
            headers: headers,
        }

        if (data && Object.keys(data).length > 0) {
            config.body = JSON.stringify(data)
        }

        return await fetch(url, config).then(response => {
            if (response.ok) {
                return response.json()
            } else {
                throw new Error(response.statusText)
            }
        })
    }
}