import { toPng } from 'html-to-image'

import { Base } from "./base";
import { Posts } from "./posts"
import { applyMixins } from "./utils";
import { ConfigurationOptions } from "./base";
import css from './index.scss';
import Quill from 'quill';
import { ImageEditorWrapper } from './image-editor';
import svg from './asset/Spinner-1s-200px.svg'


var imageEditorWrapper: ImageEditorWrapper
class MagicPoint extends Base {
    constructor(config: ConfigurationOptions) {
        super(config)
        console.log('add magic dot listener')
        this.configTrix()
        this.initDotElement()
        this.createDotEventListenerHandler = this.createDotEventListenerHandler.bind(this); // Bind the context here
        this.addCreateDotEventListener()
        this.moveCursor = this.moveCursor.bind(this); // Bind the context here
        this.addCreateDotEventMove()
        this.submitData = this.submitData.bind(this);
        console.log(css)
    }

    // submit from create task
    async submitData() {
        const loadingIcon = document.getElementById('loading') as HTMLDivElement
        console.log(loadingIcon)
        loadingIcon?.classList.remove(`${css['hide']}`)
        const submitIcon = document.getElementById('submit-btn') as HTMLDivElement
        console.log(submitIcon)
        submitIcon?.classList.add(`${css['hide']}`)

        const imageUrl = imageEditorWrapper.getImageDataUrl()?.replace('data:image/png;base64,', '')
        console.log(document.getElementById("task-title"))
        console.log(document.getElementById("editor"))
        const titleElement = document.getElementById("task-title") as HTMLInputElement
        const description = document.getElementById("editor")?.getElementsByClassName('ql-editor')[0]?.innerHTML
        const formData = {
            appData: {
                name: 'Nguyen Tran Anh Hao',
                title: titleElement.value || 'Default Task Title',
                description: description,
                apiKey: '',
                domain: '',
                base64Images: [imageUrl]
            }
        }
        let res: any = await this.post('task/nulab/add-issue', formData)
        console.log(res.hasError)
        if (res) {
            // display notification
            this.createNotification("success", res.appData)
        }
        this.closeModal()
        this.initDotElement()
        this.addCreateDotEventListener()
        this.addCreateDotEventMove()
        this.hideCursor()
        this.showDot(this.getLatestDot())

        loadingIcon.classList.add(`$${css['hide']}`)
        submitIcon.classList.remove(`$${css['hide']}`)
    }

    hideCursor() {
        document.body.style.cursor = 'none'
    }

    createNotification(type: string, data: any) {
        this.createNotificationElement(type, data)
    }
    createNotificationElement(type: string, data: any) {
        const body = document.body
        const notificationElement = document.createElement('div')
        notificationElement.addEventListener('click', (e: MouseEvent) => {
            e.stopPropagation()
        })
        notificationElement.style['position'] = "fixed"
        notificationElement.style['textAlign'] = "center"
        notificationElement.style['color'] = "white"
        notificationElement.style['top'] = "20px"
        notificationElement.style['left'] = "50%"
        notificationElement.style['transform'] = "translateX(-50%)"
        notificationElement.style['fontSize'] = "30px"
        notificationElement.style['padding'] = "15px"
        notificationElement.style['borderRadius'] = "5px"
        notificationElement.style['zIndex'] = "11"
        notificationElement.style['height'] = '10vh'
        notificationElement.style['width'] = 'max-content'
        notificationElement.style['display'] = 'flex'
        notificationElement.style['alignItems'] = 'center'
        notificationElement.style['justifyContent'] = 'center'
        if (type === "success") {
            console.log(data)
            const link = data?.url
            const anchor = document.createElement("a")
            anchor.href = `${link}`
            anchor.innerHTML = `${link}`
            anchor.target = "_blank"
            anchor.addEventListener("mouseover", () => {
                anchor.style.cursor = 'none'
            })
            notificationElement.innerHTML = `<span>Create task success!, Link task: </span>`
            notificationElement.appendChild(anchor)
            notificationElement.style['backgroundColor'] = "green"
        }
        else {
            notificationElement.textContent = "Create task fail! Please check your config!"
            notificationElement.style['backgroundColor'] = "red"
        }
        // auto close after 5s
        setTimeout(() => {
            notificationElement.remove()
        }, 5000);
        body.appendChild(notificationElement)
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
    addEventSubmitData() {
        let submitBtn = document.getElementById("submit-btn")!
        if (submitBtn) {
            submitBtn.addEventListener("click", this.submitData)
        }
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
        document.body.style.cursor = 'default'
    }

    moveCursor(e: MouseEvent): void {
        const mouseY = e.clientY;
        const mouseX = e.clientX;
        const scrollX = window.scrollX
        const scrollY = window.scrollY
        const dotElement = this.getLatestDot()
        this.showDot(dotElement)
        dotElement.style.transform = `translate3d(${mouseX + scrollX}px, ${mouseY + scrollY}px, 0)`;
    }

    hideDot(dot: HTMLElement) {
        dot.style.zIndex = '-1'
    }

    showDot(dot: HTMLElement) {
        dot.style.zIndex = '999'
    }

    getLatestDot(): HTMLDivElement {
        const dotElementList = document.getElementsByClassName(`${css['dot-element']}`);
        const dotElement = dotElementList[dotElementList.length - 1] as HTMLDivElement
        return dotElement
    }

    initDotElement(): void {
        const dot: HTMLElement = document.createElement("div")
        dot.classList.add(css['dot-element'])
        document.body.appendChild(dot)
    }

    insertDotElementToClick(e: MouseEvent) {
        const dotElement = this.getLatestDot()
        dotElement.style.top = e.clientY.toString();
        dotElement.style.top = e.clientY.toString();
    }

    insertForm(e: MouseEvent, canvas: HTMLCanvasElement) {
        const form: HTMLFormElement = document.createElement('form')
        form.classList.add(css.form, css.hide)
        form.innerHTML = `
        <div class="${css['inner-form-container']}">
            <div class="${css['first-row']}">
                <div id="${css['canvas-holder']}"></div>
            </div>
            <div class="${css['second-row']}">
                <div class="${css['input-field-editor']} ${css['first-col']}">
                    <label class="${css['label']}" for="comment">Comment:</label>
                    <div class="${css['editor']}">
                        <div id="editor"></div>
                    </div>
                </div>

                <div class="${css['second-col']}">
                    <div class="${css['input-field']} ">
                        <label class="${css['title-label']}" for="title">Task title: </label>
                        <input type="text" id="task-title">
                    </div>
                    <div class="${css['action']}" id="submit-btn">
                        <svg id="submit-svg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                    </div>
                    <div class="${css['loading']} ${css['hide']}" id="loading">
                        ${svg}
                    </div>

                    </div>
                </div>
            </div>
        </div>
        `
        document.body.appendChild(form)
        document.body.classList.add(`${css['no-scroll']}`)
        form.classList.remove(`${css['hide']}`)

        const canvasHolder = document.getElementById(`${css.canvas_holder}`)
        canvas.classList.add('canvas')
        canvas.setAttribute("id", "canvas-img")
        canvasHolder?.appendChild(canvas)

        // const canvasHolder = document.getElementById(`${css.canvas_holder}`)
        // canvas.classList.add('canvas')
        // canvasHolder?.appendChild(canvas)

        this.addEventSubmitData()

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

        imageEditorWrapper = new ImageEditorWrapper(`#${css['canvas-holder']}`, canvas.toDataURL());
        console.log(imageEditorWrapper);
    }

    closeModal(): void {
        const form: HTMLFormElement = document.getElementsByTagName("form")[0] as HTMLFormElement;
        form?.remove()
        document.body.classList.remove(`${css['no-scroll']}`)
    }

    async autoCaptureCurrentUserView(e: MouseEvent): Promise<HTMLCanvasElement> {
        this.hideDot(this.getLatestDot())
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