// import fetch from 'isomorphic-unfetch'
import { Breakpoints } from "./utils"
const Iso639_1LanguageCodes = [
    "en",
    "es",
    "fr",
    "de",
    "zh",
    "ja",
    "ru",
    "ar",
    "pt",
    "it",
    "hi",
    "nl",
    "sv",
    "el",
    "ko"
    // Add more languages as needed
] as const

export type Iso639_1LanguageCodesValue = typeof Iso639_1LanguageCodes[number]

export type ConfigurationOptions = {
    apiKey: string,
    baseUrl?: string,
    lng?: Iso639_1LanguageCodesValue,
    breakPoints?: Readonly<Breakpoints>
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
        return await this.invoke('POST', path, reqObj)
        // return this.invoke('post', path, reqObj)
    }

    public async get(path: string): Promise<object | object[]> {
        return await this.invoke('GET', path)
    }

    protected async invoke<T>(method: string, path: string, data?: object | null, options?: RequestInit): Promise<T> {
        const url = `${this.baseUrl}${path}`
        console.log('final url: ', url)

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
