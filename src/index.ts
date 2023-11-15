import { Base } from "./base";
import { Posts } from "./posts"
import { applyMixins } from "./utils";
import { ConfigurationOptions } from "./base";
import css from './index.scss';

class MagicPoint extends Base {
    constructor(config: ConfigurationOptions) {
        super(config)
        console.log('add magic dot listner')
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

    createDotEventListenerHandler(e: MouseEvent) {
        this.insertDotElementToClick(e)
        this.removeCreateDotEventListener()
        this.removeCreateDotEventMove()
        this.insertForm(e)
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


    insertForm(e: MouseEvent) {
        // const previewImage = (event: Event | undefined) => {
        //     console.log('event: ', e)
        //     const canvas = document.getElementById('canvas') as HTMLCanvasElement;
        //     const target = event?.target as HTMLInputElement
        //     if (!target.files) return;
        //     const file = target.files[0];
        //     const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
        //     const reader = new FileReader();

        //     reader.onload = function (event) {
        //         const img = new Image();
        //         img.onload = function () {
        //             canvas.width = img.width;
        //             canvas.height = img.height;
        //             ctx?.drawImage(img, 0, 0);
        //             // Perform your image editing operations here
        //             // For example, you can draw shapes or add filters
        //             ctx!.fillStyle = 'rgba(255, 0, 0, 0.5)';
        //             ctx?.fillRect(10, 10, 50, 50); // Example rectangle

        //             // You can add more editing operations here

        //             // Example of saving the edited image
        //             const editedImage = canvas.toDataURL('image/jpeg');
        //             console.log('Edited image data:', editedImage);
        //         }
        //         img.src = event.target?.result as string;
        //     }
        //     reader.readAsDataURL(file);
        // }
        const form: HTMLFormElement = document.createElement('form')
        form.classList.add(css.form)
        form.innerHTML = `
        <div class="${css.container}">
            <div class="${css.first_row}">
                <canvas class="${css.canvas}" id="canvas"></canvas>
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
        form.style.left = (e.clientX + 10) + 'px'
        form.style.top = (e.clientY + 10) + 'px'

        document.body.appendChild(form)


        function takeScreenshot() {
            // Use the MediaDevices API to capture the screen
            navigator.mediaDevices.getDisplayMedia({ video: { preferCurrentTab: true } as MediaTrackConstraints }).then((stream) => {
                const track = stream.getVideoTracks()[0];
                const imageCapture = new (window as any).ImageCapture(track);
                imageCapture.grabFrame().then((imageBitmap: ImageBitmap) => {
                    const canvas: HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;
                    canvas.width = imageBitmap.width!;
                    canvas.height = imageBitmap.height!;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(imageBitmap, 0, 0);
                        // Convert the canvas to an image and display it on the page or do something else with it
                        // const img = new Image();
                        // img.src = canvas.toDataURL();
                        // document.body.appendChild(img);
                    }
                });
            }).catch((error) => {
                console.error('Error capturing screen:', error);
            });
        }

        takeScreenshot()
    }
}


interface MagicPoint extends Posts { }

applyMixins(MagicPoint, [Posts])

export default MagicPoint