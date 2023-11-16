import { toCanvas, toPng } from 'html-to-image'

import { Base } from "./base";
import { Posts } from "./posts"
import { applyMixins } from "./utils";
import { ConfigurationOptions } from "./base";
import css from './index.scss';

class MagicPoint extends Base {
    constructor(config: ConfigurationOptions) {
        super(config)
        console.log('add magic dot listner')
        this.createDotEventListenerHandler = this.createDotEventListenerHandler.bind(this); // Bind the context here
        this.addCreateDotEventListener()
    }
    createDotEventListenerHandler(e: MouseEvent) {
        this.autoCaptureCurrentUserView(e).then((canvas) => {
            this.insertForm(e, canvas)
            this.insertDot(e)
        })
    }
    addCreateDotEventListener(): void {
        document.body.addEventListener("click", this.createDotEventListenerHandler)
    }

    removeCreateDotEventListener(): void {
        console.log('remove event listener')
        document.body.removeEventListener("click", this.createDotEventListenerHandler)
    }

    insertDot(e: MouseEvent): void {
        this.removeCreateDotEventListener()
        const dot: HTMLElement = document.createElement("div")

        document.body.style.position = "relative"
        dot.style.position = "absolute"
        dot.style.left = (e.clientX - 10) + 'px'
        dot.style.top = (e.clientY - 10) + 'px'
        dot.style.height = '20px'
        dot.style.width = '20px'
        dot.style.backgroundColor = 'red'
        dot.style.borderRadius = '50%'
        dot.style.zIndex = '1'
        document.body.appendChild(dot)
    }

    insertForm(e: MouseEvent, canvas: HTMLCanvasElement) {
        console.log('insert form')
        console.log(css)
        const form: HTMLFormElement = document.createElement('form')
        form.classList.add(css.form, css.hide)
        form.innerHTML = `
        <div class="${css.container}">
            <div class="${css.first_row}">
                <div id="${css.canvas_holder}"></div>
                <div class="${css.tool_bar_mockup}">
                    <div class="${css.mockup_button}"></div>
                    <div class="${css.mockup_button}"></div>
                    <div class="${css.mockup_button}"></div>
                    <div class="${css.mockup_button}"></div>
                </div>
            </div>
            <div class="${css.input_field}">
                <label class="${css.label}" for="title">Task title: </label>
                <input type="text" id="title">
            </div>

            <div class="${css.input_field}">
                <label class="${css.label}" for="comment">Comment:</label>
                <textarea type="text" id="comment" name="comment"></textarea>
            </div>
            
            <div>
                <input type="file" name="file" accept="image/*" onchange="document.getElementById('canvas').src = window.URL.createObjectURL(this.files[0])">
            </div>
            <div class="${css.action}">
                <input type="submit" value="Submit">
            </div>
        </div>
        `
        // form.style.left = (e.clientX + 10) + 'px'
        // form.style.top = (e.clientY + 10) + 'px'
        form.style.left = '5%'
        form.style.top = '40px'
        // form.style.margin = '0 auto'
        document.body.appendChild(form)
        form.classList.add(`${css.show}`)
        form.classList.remove(`${css.hide}`)

        const canvasHolder = document.getElementById(`${css.canvas_holder}`)
        canvas.classList.add('canvas')
        canvasHolder?.appendChild(canvas)
    }


    // Default capture screen flow
    async autoCaptureCurrentUserView(e: MouseEvent): Promise<HTMLCanvasElement> {
        console.log("event: ", e)
        // we need to find outermost tag because that seem like the library not accepting body tag
        const outermostTag = this.findOutermostTag(e.target as HTMLElement)
        console.log('outermost tag: ', outermostTag)
        const canvasFromLib = await toCanvas(outermostTag, { backgroundColor: 'pink' })
        const base64png = await toPng(outermostTag)
        console.log(base64png)
        console.log('base64img: ', canvasFromLib)
        const canvas = document.createElement('canvas')
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        canvas.style.border = '1px solid #fff'
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = "grey";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // ctx.drawImage(canvasFromLib, 0, 0, window.innerWidth * 2, window.innerHeight * 2, 0, 0, window.innerWidth, window.innerHeight)
        // ctx.drawImage(canvasFromLib, 0, 0)

        const image = new Image()
        image.src = base64png
        image.onload = () => {
            let sx, sy, sw, sh, dw, dh
            sx = window.scrollX + e.clientX * this.getDevicePixelRatio()
            sy = window.scrollY + e.clientY * this.getDevicePixelRatio()
            console.log(`clientX: ${e.clientX} -- clientY: ${e.clientY}`)
            console.log(` -- scrollX: ${window.scrollX} -- scrollY: ${window.scrollY}`)
            console.log('source x: ' + sx + ' source y: ' + sy)
            sw = window.innerWidth * this.getDevicePixelRatio()
            sh = window.innerHeight * this.getDevicePixelRatio()
            dw = window.innerWidth
            dh = window.innerHeight

            // ctx.drawImage(image, sx, sy, sw, sh, 0, 0, 800, window.innerHeight)
            ctx.drawImage(image, sx, sy, sw, sh, 0, 0, dw, dh)
            // document.body.appendChild(canvas)
            // document.body.appendChild(base64img)
            return canvas
        }

        return canvas
    }

    getDevicePixelRatio(): number {
        return window.devicePixelRatio || 1
    }

    findOutermostTag(element: HTMLElement) {
        console.log('passing element: ', element)
        let currentElement = element;
        // if (element.tagName.toLowerCase() === 'body' || element.tagName.toLowerCase() === 'html') {
        //     currentElement = element.firstElementChild as HTMLElement;
        // }

        while (currentElement.parentElement) {
            if (currentElement.parentElement.tagName.toLowerCase() === 'body') {
                console.log("selected element: ", currentElement)
                return currentElement
            }
            currentElement = currentElement.parentElement;
        }
        console.log("selected element: ", currentElement)
        return currentElement
    }
}

interface MagicPoint extends Posts { }

applyMixins(MagicPoint, [Posts])

export default MagicPoint