import { toCanvas, toPng } from 'html-to-image'

import { Base } from "./base";
import { Posts } from "./posts"
import { applyMixins } from "./utils";
import { ConfigurationOptions } from "./base";
import css from './index.scss';
import Quill from 'quill'
import { ImageEditorWrapper } from './image-editor';

class MagicPoint extends Base {
    constructor(config: ConfigurationOptions) {
        super(config)
        console.log('add magic dot listner')
        this.configTrix()
        this.initDotElement()
        this.createDotEventListenerHandler = this.createDotEventListenerHandler.bind(this); // Bind the context here
        this.addCreateDotEventListener()
        this.moveCursor = this.moveCursor.bind(this); // Bind the context here
        this.addCreateDotEventMove()
        console.log(css)
    }

    // Event listener
    addCreateDotEventListener(): void {
        document.body.addEventListener("click", this.createDotEventListenerHandler)
    }
    removeCreateDotEventListener(): void {
        document.body.removeEventListener("click", this.createDotEventListenerHandler)
    }
    addCreateDotEventMove(): void {
        document.body.addEventListener("mousemove", this.moveCursor)
    }
    removeCreateDotEventMove(){
        document.body.removeEventListener("mousemove", this.moveCursor)
    }
    configTrix(){
        document.addEventListener("trix-before-initialize", () => {
        })
    }

    createDotEventListenerHandler(e: MouseEvent) {
        this.autoCaptureCurrentUserView(e).then((canvas: HTMLCanvasElement) => {
            this.insertDotElementToClick(e)
            this.insertForm(e, canvas)
        })
        this.removeCreateDotEventListener()
        this.removeCreateDotEventMove()
        this.addCursorMouse()
    }
    addCursorMouse(){
        const bodyElement = document.body
        bodyElement.style.cursor = 'default'
    }
    moveCursor(e: MouseEvent): void {
        const mouseY = e.clientY;
        const mouseX = e.clientX;
        const dotElement = document.getElementsByClassName(`${css['dot-element']}`)[0] as HTMLDivElement;
        dotElement.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
       
    }

    initDotElement(): void {
        console.log('insert')
        const dot: HTMLElement = document.createElement("div")
        dot.classList.add(css['dot-element'])
        document.body.appendChild(dot)
    }
    insertDotElementToClick(e: MouseEvent){

        const dotElement = document.getElementsByClassName(`${css['dot-element']}`)[0] as HTMLDivElement;
        dotElement.style.top = e.clientY.toString();
        dotElement.style.top = e.clientY.toString();
    }


    insertForm(e: MouseEvent, canvas: HTMLCanvasElement) {
        const form: HTMLFormElement = document.createElement('form')
        form.classList.add(css.form, css.hide)
        form.innerHTML = `
        <div class="${css.container}">
            <div class="${css.first_row}">
                <div id="${css.canvas_holder}"></div>
            </div>
            <div class="${css.input_field}">
                <label class="${css.label}" for="title">Task title: </label>
                <input type="text" id="title">
            </div>

            <div class="${css.input_field_editor}">
                <label class="${css.label}" for="comment">Comment:</label>
                <div class="${css.editor}">
                    <div id="editor"></div>
                </div>
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

        // const canvasHolder = document.getElementById(`${css.canvas_holder}`)
        // canvas.classList.add('canvas')
        // canvasHolder?.appendChild(canvas)
        
        // add link to header html
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
        document.head.appendChild(link);

        var quill = new Quill("#editor", {
            debug: "info",
            theme: "snow"
            })
        console.log(quill)

        const imageEditorWrapper = new ImageEditorWrapper(`#${css.canvas_holder}`, canvas.toDataURL());
        console.log(imageEditorWrapper);
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