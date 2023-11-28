export class NotificationManager {
    public createNotification(type: string, data: any): void {
        const notificationElement = document.createElement("div");
        // Set up the notification element styles
        this.applyStyles(notificationElement, type);
        // Add content to the notification based on the type
        this.setContent(notificationElement, type, data);
        // Handle click event to stop propagation
        notificationElement.addEventListener("click", (e: MouseEvent) => {
            e.stopPropagation();
        });
        // Append the notification element to the body
        document.body.appendChild(notificationElement);
        // Set timeout to remove the notification
        setTimeout(() => {
            notificationElement.remove();
        }, 5000);
    }

    private applyStyles(element: HTMLElement, type: string): void {
        // Define common styles here
        element.style.position = "fixed";
        element.style.textAlign = "center";
        element.style.color = "white";
        element.style.top = "20px";
        element.style.left = "50%";
        element.style.transform = "translateX(-50%)";
        element.style.fontSize = "30px";
        element.style.padding = "15px";
        element.style.borderRadius = "5px";
        element.style.zIndex = "11";
        element.style.height = "10vh";
        element.style.width = "max-content";
        element.style.display = "flex";
        element.style.alignItems = "center";
        element.style.justifyContent = "center";
        // Apply type-specific styles
        element.style.backgroundColor = type === "success" ? "green" : "red";
    }

    private setContent(element: HTMLElement, type: string, data: any): void {
        if (type === "success") {
            const link = data?.url;
            const anchor = document.createElement("a");
            anchor.href = `${link}`;
            anchor.innerHTML = `${link}`;
            anchor.target = "_blank";
            anchor.addEventListener("mouseover", () => {
                anchor.style.cursor = "none";
            });
            element.innerHTML =
                "<span>Create task success!, Link task: </span>";
            element.appendChild(anchor);
        } else {
            element.textContent = "Create task fail! Please check your config!";
        }
    }
}
