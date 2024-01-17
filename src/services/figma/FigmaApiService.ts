import * as Figma from "figma-api";
import {
    GetFileResult,
    GetImageResult,
    GetUserMeResult,
} from "figma-api/lib/api-types";
import { ExtendedGetProjectFilesResult, ExtendedGetTeamProjectsResult } from "./type";

export class FigmaApiService {
    private figmaApi: Figma.Api | null = null;

    constructor() {}

    public setToken(token: string) {
        this.figmaApi = new Figma.Api({ oAuthToken: token });
    }

    public async getMe(): Promise<GetUserMeResult | null> {
        return this.callFigmaApi(async () => this.figmaApi!.getMe());
    }

    public async getImage(
        fileId: string,
        nodeIds: string[]
    ): Promise<GetImageResult> {
        return this.callFigmaApi(async () =>
            this.figmaApi!.getImage(fileId, {
                ids: nodeIds.join(","),
                scale: 1,
                format: "png",
            })
        );
    }

    public async getFile(fileId: string): Promise<GetFileResult> {
        return this.callFigmaApi(async () => this.figmaApi!.getFile(fileId));
    }

    public async getTeamProjects(
        teamId: string
    ): Promise<ExtendedGetTeamProjectsResult> {
        return this.callFigmaApi(async () =>
            this.figmaApi!.request<ExtendedGetTeamProjectsResult>(
                `${Figma.API_DOMAIN}/${Figma.API_VER}/teams/${teamId}/projects`
            )
        );
    }

    public async getProjectFiles(
        projectId: string
    ): Promise<ExtendedGetProjectFilesResult> {
        return this.callFigmaApi(async () =>
            this.figmaApi!.request<ExtendedGetProjectFilesResult>(
                `${Figma.API_DOMAIN}/${Figma.API_VER}/projects/${projectId}/files`
            )
        );
    }

    private async callFigmaApi<T>(apiCall: () => Promise<T>): Promise<T> {
        this.checkFigmaApi();
        try {
            return await apiCall();
        } catch (error) {
            console.error("Figma API call failed:", error);
            throw error;
        }
    }

    private checkFigmaApi(): void {
        if (!this.figmaApi) {
            throw new Error("Access token not set");
        }
    }
}
