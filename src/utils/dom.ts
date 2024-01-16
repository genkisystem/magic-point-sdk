export const getComposedPathForHTMLElement = (
    element: HTMLElement | null,
): EventTarget[] => {
    let path: EventTarget[] = [];
    while (element) {
        path.push(element);
        if (element.tagName === "HTML") {
            path.push(document, window);
            return path;
        }
        element = element.parentElement;
    }
    return path;
};

export const getPointDom = (path: EventTarget[]): string => {
    path.splice(-3);
    let pointDomTreeSelectorString = [];
    for (const nodeInPath of path as HTMLElement[]) {
        let singleNodeCSSSelector = "";

        singleNodeCSSSelector += nodeInPath.tagName.toLowerCase();

        if (nodeInPath.id) {
            singleNodeCSSSelector += `#${nodeInPath.id}`;
        } else {
            if (nodeInPath.parentNode!.childNodes.length > 0) {
                // nodeType = 3 is mean it is the text node, we dont care about this node
                singleNodeCSSSelector += `:nth-child(${
                    Array.from(nodeInPath.parentNode!.childNodes)
                        .filter((node) => node.nodeType !== 3)
                        .indexOf(nodeInPath) + 1
                })`;
            }
        }
        pointDomTreeSelectorString.push(singleNodeCSSSelector);
    }
    return pointDomTreeSelectorString.reverse().join(" ");
};

export function addToIframe(element: HTMLElement) {
    const magicPointContainer = document.getElementById(
        "magic-point-root",
    ) as HTMLIFrameElement;
    if (magicPointContainer) {
        const iframeDocument = magicPointContainer.contentDocument;
        if (iframeDocument) {
            iframeDocument.body.appendChild(element);
        }
    } else {
        console.error("magic-point-root not found");
    }
}

export function addElementToIframe(
    iframe: HTMLIFrameElement,
    element: HTMLElement,
) {
    const iframeDocument = iframe.contentDocument;
    if (iframeDocument) {
        iframeDocument.body.appendChild(element);
    }
}

export function findElementByIdInIframe(iframe: HTMLIFrameElement, id: string) {
    const iframeDocument = iframe.contentDocument;
    if (iframeDocument) {
        console.log(iframeDocument.getElementById(id));
        return iframeDocument.getElementById(id);
    }
    return null;
}

export function styleMagicPointContainer(css: string) {
    const magicPointContainer = document.getElementById(
        "magic-point-root",
    ) as HTMLIFrameElement;
    if (magicPointContainer) {
        const iframeDocument = magicPointContainer.contentDocument;
        if (iframeDocument) {
            const styleElement = iframeDocument.createElement("style");
            styleElement.textContent = css;
            iframeDocument.head.appendChild(styleElement);
        }
    } else {
        console.error("magic-point-root not found");
    }
}

export function styleToUserContainer(css: string) {
    const styleElement = document.createElement("style");
    styleElement.textContent = css;
    document.head.appendChild(styleElement);
}
