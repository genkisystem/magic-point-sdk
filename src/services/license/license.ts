class LicenseManager {
    private static instance: LicenseManager | null = null;
    private apiKey: string | null;

    private constructor() {
        this.apiKey = null;
    }

    static getInstance(): LicenseManager {
        return this.instance || (this.instance = new LicenseManager());
    }

    setApiKey(apiKey: string): void {
        this.apiKey = apiKey;
    }

    getApiKey(): string | null {
        return this.apiKey;
    }

    isValidApiKey(): boolean {
        return this.apiKey !== null && this.apiKey.length > 0;
    }

    clearApiKey(): void {
        this.apiKey = null;
    }
}

export const licenseManagerInstance = LicenseManager.getInstance();
