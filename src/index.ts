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
        this.insertDot(e)
        this.insertForm(e)
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
        document.body.appendChild(dot)
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