import { generateRandomState } from "@utils";

export type OAuthConfig = {
    authorizationUrl: string;
    clientId: string;
    redirectUri: string;
    scope: string;
    state?: string;
    additionalParams?: Record<string, string>;
};

export class OAuthClient {
    private config: OAuthConfig;
    private authWindow: Window | null = null;

    constructor(config: OAuthConfig) {
        this.config = {...config};
    }

    public initiateOAuthFlow(): void {
        const {
            authorizationUrl,
            clientId,
            redirectUri,
            scope,
            state = generateRandomState(),
            additionalParams,
        } = this.config;

        const authUrl = this.buildAuthUrl(
            authorizationUrl,
            clientId,
            redirectUri,
            scope,
            state,
            additionalParams
        );
        this.openAuthWindow(authUrl);
    }

    private buildAuthUrl(
        authorizationUrl: string,
        clientId: string,
        redirectUri: string,
        scope: string,
        state: string,
        additionalParams?: Record<string, string>
    ): string {
        const url = new URL(authorizationUrl);
        url.searchParams.append("client_id", clientId);
        url.searchParams.append("redirect_uri", redirectUri);
        url.searchParams.append("scope", scope);
        url.searchParams.append("state", state);
        url.searchParams.append("response_type", "code");

        if (additionalParams) {
            for (const [key, value] of Object.entries(additionalParams)) {
                url.searchParams.append(key, value);
            }
        }

        return url.toString();
    }

    private openAuthWindow(url: string): void {
        const { width = 600, height = 700 } = {};
        const left = (window.outerWidth - width) / 2;
        const top = (window.outerHeight - height) / 2;
        const windowFeatures = `width=${width},height=${height},top=${top},left=${left}`;

        try {
            if (this.authWindow) {
                this.authWindow.close();
            }

            this.authWindow = window.open(url, "AuthPopup", windowFeatures);
        } catch (error) {
            throw new Error("Error opening auth window: " + error);
        }
    }
}
