import { BASE64_IMAGE_PREFIX } from "./constants";

export const generateRandomState = (): string => {
    return window.crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
};

export const generateBase64Prefix = (base64string: string): string => {
    if (!base64string.startsWith(BASE64_IMAGE_PREFIX)) {
        base64string = BASE64_IMAGE_PREFIX + base64string;
    }

    return base64string;
};

export const removeBase64Prefix = (base64string: string): string => {
    if (base64string.startsWith(BASE64_IMAGE_PREFIX)) {
        base64string = base64string.replace(BASE64_IMAGE_PREFIX, "");
    }
    return base64string;
}