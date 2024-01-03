import {
    FigmaFile,
    FigmaNode,
    FigmaProjectFileResponse,
    FigmaTeamProjectResponse,
    FigmaUser,
    FileImageMap,
    ImageInfo,
} from "./type";

type Observer<T> = (newValue: T) => void;

export class FigmaClient {
    private readonly clientId: string;
    private readonly redirectUri: string;
    private readonly OAUTH_URL = "https://www.figma.com/oauth";
    private readonly FIGMA_BASE_URL = "https://api.figma.com/v1";
    private accessToken: string | null = null;
    private figmaAuthPopupWindow: Window | null = null;
    private files: [FigmaProjectFileResponse[], FileImageMap] = [[], {}];
    userInfo: FigmaUser | null = null;
    private observers: Record<string, Observer<any>[]> = {};

    constructor(clientId: string, redirectUri: string) {
        this.clientId = clientId;
        this.redirectUri = encodeURIComponent(redirectUri);
    }

    public subscribe<T>(property: keyof FigmaClient, observer: Observer<T>) {
        if (!this.observers[property]) {
            this.observers[property] = [];
        }
        this.observers[property].push(observer);
    }

    public unsubscribe<T>(property: keyof FigmaClient, observer: Observer<T>) {
        this.observers[property] =
            this.observers[property]?.filter((obs) => obs !== observer) ?? [];
    }

    private notifyObservers<T>(property: keyof FigmaClient, newValue: T) {
        this.observers[property]?.forEach((observer) => observer(newValue));
    }

    private async fetchUserInfo(): Promise<FigmaUser | null> {
        if (this.userInfo) return this.userInfo;

        try {
            return (this.userInfo = await this.makeApiRequest(
                `${this.FIGMA_BASE_URL}/me`
            ));
        } catch (error) {
            console.error("Fetching Figma user information failed:", error);
            throw error;
        }
    }

    public async fetchFigmaImages(
        fileId: string,
        nodeIds: string[]
    ): Promise<any> {
        const idsParam = nodeIds.join(",");
        return await this.makeApiRequest(
            `${this.FIGMA_BASE_URL}/images/${fileId}?ids=${idsParam}`
        );
    }

    public async fetchFigmaFile(fileId: string): Promise<FigmaFile> {
        return await this.makeApiRequest(
            `${this.FIGMA_BASE_URL}/files/${fileId}`
        );
    }

    public async fetchFigmaTeamProjects(
        teamId: string
    ): Promise<FigmaTeamProjectResponse> {
        try {
            const res = await this.makeApiRequest(
                `${this.FIGMA_BASE_URL}/teams/${teamId}/projects`
            );
            return res;
        } catch (error) {
            console.error("Fetching Figma user information failed:", error);
            throw error;
        }
    }

    public async fetchFigmaProjectFiles(
        projectId: string
    ): Promise<FigmaProjectFileResponse> {
        try {
            const res = await this.makeApiRequest(
                `${this.FIGMA_BASE_URL}/projects/${projectId}/files

                `
            );
            return res;
        } catch (error) {
            console.error("Fetching Figma user information failed:", error);
            throw error;
        }
    }

    public initiateOAuthFlow(): void {
        const state = this.generateRandomState();
        const scope = "files:read";
        const figmaOAuthUrl = `${this.OAUTH_URL}?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&scope=${scope}&state=${state}&response_type=code`;

        this.openFigmaOAuthWindow(figmaOAuthUrl);
    }

    private generateRandomState(): string {
        return window.crypto
            .getRandomValues(new Uint32Array(1))[0]
            .toString(36);
    }

    private openFigmaOAuthWindow(url: string): void {
        const { width, height } = { width: 600, height: 700 };
        const left = (window.outerWidth - width) / 2;
        const top = (window.outerHeight - height) / 2;
        const windowFeatures = `width=${width},height=${height},top=${top},left=${left}`;

        this.figmaAuthPopupWindow?.close();
        this.figmaAuthPopupWindow = window.open(
            url,
            "FigmaAuthPopup",
            windowFeatures
        );
    }

    private async makeApiRequest(url: string): Promise<any> {
        if (!this.accessToken) {
            throw new Error("Access token is not set.");
        }

        const response = await fetch(url, {
            method: "GET",
            headers: { Authorization: `Bearer ${this.accessToken}` },
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        return response.json();
    }

    private async fetchFigmaProjectFilesByTeams(
        teams: FigmaTeamProjectResponse[]
    ): Promise<[FigmaProjectFileResponse[], FileImageMap]> {
        let allProjectFiles: FigmaProjectFileResponse[] = [];
        let allFileImageMap: FileImageMap = {};

        for (const team of teams) {
            if (team.projects) {
                const projectFiles = await Promise.all(
                    team.projects.map((p) =>
                        this.fetchFigmaProjectFiles(p.id.toString())
                    )
                );

                const fileIds = projectFiles.flatMap((project) =>
                    project.files.map((file) => file.key)
                );

                const files = await Promise.all(
                    fileIds.map((fileId) => this.fetchFigmaFile(fileId))
                );

                const fileIdToImageIdsMap: { [fileId: string]: string[] } = {};
                for (let i = 0; i < fileIds.length; i++) {
                    const file = files[i];
                    const idNameMap = this.getIdNameMap(file);
                    const imageIds = Object.keys(idNameMap);
                    fileIdToImageIdsMap[fileIds[i]] = imageIds;
                }

                const imagePromises = Object.entries(fileIdToImageIdsMap).map(
                    ([fileId, imageIds]) => {
                        if (imageIds.length === 0) {
                            return Promise.resolve({});
                        }
                        return this.fetchFigmaImages(fileId, imageIds);
                    }
                );

                const imagesResponses = await Promise.all(imagePromises);

                for (let i = 0; i < files.length; i++) {
                    const imagesResponse = imagesResponses[i];
                    const file = files[i];
                    const idNameMap = this.getIdNameMap(file);

                    const imageInfoList: ImageInfo[] = [];
                    for (const imageId in imagesResponse.images) {
                        if (imagesResponse.images.hasOwnProperty(imageId)) {
                            const imgSrc = imagesResponse.images[imageId];
                            const name = idNameMap[imageId] || "Unnamed";
                            imageInfoList.push({
                                name: name,
                                image: imgSrc,
                            });
                        }
                    }
                    allFileImageMap[fileIds[i]] = imageInfoList;
                }

                allProjectFiles = allProjectFiles.concat(projectFiles.flat());
            }
        }

        return [allProjectFiles, allFileImageMap];
    }

    private getIdNameMap(file: FigmaFile): { [id: string]: string } {
        const map: { [id: string]: string } = {};
        const nodes = file.document.children[0]?.children;

        const traverseNodes = (nodes: FigmaNode[]) => {
            nodes.forEach((node) => {
                if (node.id && node.name && node.type == "FRAME") {
                    map[node.id] = node.name;
                }
            });
        };

        traverseNodes(nodes ?? []);
        return map;
    }

    public async fetchFigmaFiles(team: FigmaTeamProjectResponse) {
        try {
            const files = await await this.fetchFigmaProjectFilesByTeams([
                team,
            ]);
            this.files = files;
        } catch (error) {
            console.error("Error in fetchFigmaInformation:", error);
            throw error;
        }
    }

    public async fetchFigmaInformation(callback: () => void) {
        try {
            const user = await this.fetchUserInfo();
            this.userInfo = user;
            callback();
            this.notifyObservers("userInfo", user);
        } catch (error) {
            console.error("Error in fetchFigmaInformation:", error);
            throw error;
        }
    }

    public async fetchFigmaTeams(
        teamIds: string[]
    ): Promise<Map<string, FigmaTeamProjectResponse>> {
        const responses = await Promise.all(
            teamIds.map((id) => this.fetchFigmaTeamProjects(id))
        );

        // Creating a Map between teamId and FigmaTeamProjectResponse
        const resultMap = teamIds.reduce((map, teamId, index) => {
            map.set(teamId, responses[index]);
            return map;
        }, new Map<string, FigmaTeamProjectResponse>());

        return resultMap;
    }

    public getUserInfo() {
        return this.userInfo;
    }

    public getFiles() {
        return this.files;
    }

    public setToken(token: string) {
        this.accessToken = token;
    }
}
