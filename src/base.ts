// import fetch from 'isomorphic-unfetch'

export type ConfigurationOptions = {
    apiKey: string,
    baseUrl?: string
}

export abstract class Base {
    public apiKey: string
    public baseUrl: string
    constructor(config: ConfigurationOptions) {
        this.apiKey = config.apiKey
        this.baseUrl = config.baseUrl || "http://localhost:3000/api/"
    }


    public async post(path: string, reqObj: object) {
        console.log(path)
        console.log(reqObj)
        return await this.invoke('POST', path, reqObj)
        // return this.invoke('post', path, reqObj)
    }

    protected async invoke<T>(method: string, path: string, data: object, options?: RequestInit): Promise<T> {
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
            body: JSON.stringify(data)
        }

        return fetch(url, config).then(response => {
            if (response.ok) {
                return response.json()
            } else {
                throw new Error(response.statusText)
            }
        })
    }
}