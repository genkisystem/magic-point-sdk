// import fetch from 'isomorphic-unfetch'

type ConfigurationOptions = {
    apiKey: string,
    baseUrl?: string
}

export abstract class Base {
    public apiKey: string
    public baseUrl: string
    constructor(config: ConfigurationOptions) {
        this.apiKey = config.apiKey
        this.baseUrl = config.baseUrl || "https://jsonplaceholder.typicode.com"

        document.body.addEventListener("click", (e: MouseEvent) => this.process(e))
        // document.body.addEventListener('')
    }

    protected process(e: MouseEvent): void {
        console.log("add dot listeners")
        const dot: HTMLElement = document.createElement("div")
        // form.innerHTML = `
        // <label for="name">Name:</label>
        // <input type="text" id="name" name="name"><br><br>
        // <label for="email">Email:</label>
        // <input type="email" id="email" name="email"><br><br>
        // <input type="submit" value="Submit"> `
        console.log(e)

        document.body.style.position = "relative"
        dot.style.position = "absolute"
        dot.style.left = (e.clientX - 10) + 'px'
        dot.style.top = (e.clientY - 10) + 'px'
        dot.style.height = '2%'
        dot.style.width = '1%'
        dot.style.backgroundColor = 'red'
        dot.style.borderRadius = '50%'

        // console.log(dot)
        document.body.appendChild(dot)
    }


    protected invoke<T>(endpoint: string, options?: RequestInit): Promise<T> {
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