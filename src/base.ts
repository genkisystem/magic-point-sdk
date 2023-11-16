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
        this.baseUrl = config.baseUrl || "https://jsonplaceholder.typicode.com"
    }


    protected async invoke<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`

        const headers = {
            "Content-Type": "application/json",
            "api-key": this.apiKey
        }

        const config = {
            ...options,
            headers
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