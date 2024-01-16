export type NOTI_OPERATION = {
    CREATE: "CREATE";
    UPDATE: "UPDATE";
    DELETE: "DELETE";
};

export type NOTI_TYPE = {
    SUCCESS: "SUCCESS";
    FAILED: "FAILED";
};

export class NotificationManager {
    public createNotification(
        operation: keyof NOTI_OPERATION,
        type: keyof NOTI_TYPE,
        data?: any,
        message?: string,
    ): void {
        const notificationElement = document.createElement("div");
        notificationElement.className = `toast ${type.toLowerCase()}`; // Use the class 'toast' from SCSS

        // Add content to the notification based on the type and operation
        this.setContent(notificationElement, operation, type, data, message);

        // Append the notification element to the body,
        document.body.appendChild(notificationElement);

        // Slide in
        setTimeout(() => notificationElement.classList.add("slide-in"), 100);

        // Slide out and remove after delay
        setTimeout(() => {
            notificationElement.classList.add("slide-out");
            notificationElement.addEventListener("transitionend", () =>
                notificationElement.remove(),
            );
        }, 5500);
    }

    private setContent(
        element: HTMLElement,
        operation: keyof NOTI_OPERATION,
        type: keyof NOTI_TYPE,
        data: any,
        message?: string,
    ): void {
        let content = document.createElement("span");
        content.textContent =
            `${
                operation.charAt(0) + operation.slice(1).toLowerCase()
            } task ${type.toLowerCase()}` + (message ? ", " + message : "");
        element.appendChild(content);

        if (operation === "CREATE" && type === "SUCCESS" && data?.taskUrl) {
            content.textContent += "\u00A0";
            const anchor = document.createElement("a");
            anchor.href = data.taskUrl;
            anchor.textContent = "View Task";
            anchor.target = "_blank";
            anchor.addEventListener("mouseover", (e) => {
                anchor.style.cursor = "pointer";
            });
            anchor.addEventListener("click", (e) => {
                e.stopPropagation();
            });
            element.appendChild(anchor);
        }
    }
}
