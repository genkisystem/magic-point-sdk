import { toPng } from 'html-to-image'

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
    removeCreateDotEventMove() {
        document.body.removeEventListener("mousemove", this.moveCursor)
    }
    configTrix() {
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

    addCursorMouse() {
        const bodyElement = document.body
        bodyElement.style.cursor = 'default'
    }

    moveCursor(e: MouseEvent): void {
        const mouseY = e.clientY;
        const mouseX = e.clientX;
        const scrollX = window.scrollX
        const scrollY = window.scrollY
        const dotElement = document.getElementsByClassName(`${css['dot-element']}`)[0] as HTMLDivElement;
        dotElement.style.transform = `translate3d(${mouseX + scrollX}px, ${mouseY + scrollY}px, 0)`;
    }

    initDotElement(): void {
        console.log('insert')
        const dot: HTMLElement = document.createElement("div")
        dot.classList.add(css['dot-element'])
        document.body.appendChild(dot)
    }

    insertDotElementToClick(e: MouseEvent) {
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
        document.body.appendChild(form)
        form.classList.add(`${css.show}`)
        form.classList.remove(`${css.hide}`)

        const canvasHolder = document.getElementById(`${css.canvas_holder}`)
        canvas.classList.add('canvas')
        canvasHolder?.appendChild(canvas)

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

    async autoCaptureCurrentUserView(e: MouseEvent): Promise<HTMLCanvasElement> {
        const outermostTag = this.findOutermostTag(e.target as HTMLElement);
        const base64png = await toPng(outermostTag);

        return new Promise<HTMLCanvasElement>((resolve) => {
            const canvas = document.createElement('canvas');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = 'grey';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const image = new Image();
            image.src = base64png;

            image.onload = () => {
                const sx = window.scrollX * this.getDevicePixelRatio()
                const sy = window.scrollY * this.getDevicePixelRatio()
                const sw = window.innerWidth * this.getDevicePixelRatio();
                const sh = window.innerHeight * this.getDevicePixelRatio();
                const dw = window.innerWidth;
                const dh = window.innerHeight;

                ctx.drawImage(image, sx, sy, sw, sh, 0, 0, dw, dh);
                resolve(canvas);
            };
        });
    }

    getDevicePixelRatio(): number {
        return window.devicePixelRatio || 1
    }

    findOutermostTag(element: HTMLElement) {
        console.log('passing element: ', element)
        let currentElement = element;
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