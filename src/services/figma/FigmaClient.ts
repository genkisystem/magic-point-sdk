import {
    GetFileResult,
    GetImageResult,
    GetUserMeResult,
} from "figma-api/lib/api-types";
import { Node } from "figma-api/lib/ast-types";
import { FigmaApiService } from "./FigmaApiService";
import {
    ExtendedGetProjectFilesResult,
    ExtendedGetTeamProjectsResult,
    FileImageMap,
    FileNameMap,
    ImageInfo,
    NodeIdMap,
} from "./type";

export class FigmaClient {
    private figmaApiService: FigmaApiService = new FigmaApiService();
    private files: [ExtendedGetProjectFilesResult[], FileImageMap] = [[], {}];
    private userInfo: GetUserMeResult | null = null;

    constructor() {}

    private async fetchFigmaProjectFilesByTeams(
        teams: ExtendedGetTeamProjectsResult[],
    ): Promise<[ExtendedGetProjectFilesResult[], FileImageMap]> {
        let allProjectFiles: ExtendedGetProjectFilesResult[] = [];
        let allFileImageMap: FileImageMap = {};

        for (const team of teams) {
            const projectFiles = await this.fetchProjectFilesForTeam(team);
            allProjectFiles = [...allProjectFiles, ...projectFiles];

            const fileImageMap =
                await this.fetchFileImageMapForTeam(projectFiles);
            allFileImageMap = { ...allFileImageMap, ...fileImageMap };
        }

        return [allProjectFiles, allFileImageMap];
    }

    private async fetchProjectFilesForTeam(
        team: ExtendedGetTeamProjectsResult,
    ): Promise<ExtendedGetProjectFilesResult[]> {
        return await Promise.all(
            team.projects.map((p) =>
                this.figmaApiService.getProjectFiles(p.id.toString()),
            ),
        );
    }

    private async fetchFileImageMapForTeam(
        projectFiles: ExtendedGetProjectFilesResult[],
    ): Promise<FileImageMap> {
        const fileIds = this.getFileIdsFromProjects(projectFiles);
        const files = await this.fetchFiles(fileIds);
        const fileIdToImageIdsMap = this.createFileIdToImageIdsMap(
            fileIds,
            files,
        );
        const imagesResponses =
            await this.fetchImagesForFiles(fileIdToImageIdsMap);
        return this.createAllFileImageMap(fileIds, files, imagesResponses);
    }

    private getFileIdsFromProjects(
        projectFiles: ExtendedGetProjectFilesResult[],
    ): string[] {
        return projectFiles.flatMap((project) =>
            project.files.map((file) => file.key),
        );
    }

    private async fetchFiles(fileIds: string[]): Promise<GetFileResult[]> {
        return await Promise.all(
            fileIds.map((fileId) => this.figmaApiService.getFile(fileId)),
        );
    }

    private createFileIdToImageIdsMap(
        fileIds: string[],
        files: GetFileResult[],
    ): { [fileId: string]: string[] } {
        const fileIdToImageIdsMap: { [fileId: string]: string[] } = {};
        for (let i = 0; i < fileIds.length; i++) {
            const file = files[i];
            const { idToNameMap: idNameMap } = this.getIdNameMap(file);
            const imageIds = Object.keys(idNameMap);
            fileIdToImageIdsMap[fileIds[i]] = imageIds;
        }
        return fileIdToImageIdsMap;
    }

    private async fetchImagesForFiles(fileIdToImageIdsMap: {
        [fileId: string]: string[];
    }): Promise<GetImageResult[]> {
        return await Promise.all(
            Object.entries(fileIdToImageIdsMap).map(([fileId, imageIds]) => {
                if (imageIds.length === 0) {
                    return Promise.resolve({ images: {} });
                }
                return this.figmaApiService.getImage(fileId, imageIds);
            }),
        );
    }

    private createAllFileImageMap(
        fileIds: string[],
        files: GetFileResult[],
        imagesResponses: GetImageResult[],
    ): FileImageMap {
        let allFileImageMap: FileImageMap = {};
        for (let i = 0; i < files.length; i++) {
            const imagesResponse = imagesResponses[i];
            const file = files[i];
            const { idToNameMap: idNameMap, idToNodeMap } =
                this.getIdNameMap(file);
            const imageInfoList: ImageInfo[] = this.createImageInfoList(
                imagesResponse,
                idNameMap,
                idToNodeMap,
            );
            allFileImageMap[fileIds[i]] = imageInfoList;
        }
        return allFileImageMap;
    }

    private createImageInfoList(
        imagesResponse: GetImageResult,
        idNameMap: { [id: string]: string },
        idToNodeMap: { [id: string]: any },
    ): ImageInfo[] {
        const imageInfoList: ImageInfo[] = [];
        for (const imageId in imagesResponse.images) {
            if (imagesResponse.images.hasOwnProperty(imageId)) {
                const imgSrc = imagesResponse.images[imageId];
                const name = idNameMap[imageId] || "Unnamed";
                const node = idToNodeMap[imageId];
                if (!imgSrc) {
                    continue;
                }
                imageInfoList.push({
                    name: name,
                    image: imgSrc,
                    node: node,
                });
            }
        }
        return imageInfoList;
    }

    private getIdNameMap(file: GetFileResult): {
        idToNameMap: FileNameMap;
        idToNodeMap: NodeIdMap;
    } {
        const idToNameMap: FileNameMap = {};
        const idToNodeMap: NodeIdMap = {};

        const fileContent = file.document;
        const pages = fileContent.children as Node<"CANVAS">[];
        const nodes = pages.flatMap((page) => page.children as Node<"FRAME">[]);

        nodes.forEach((node) => {
            if (node.id && node.name && node.type == "FRAME") {
                idToNameMap[node.id] = node.name;
                idToNodeMap[node.id] = node;
            }
        });

        return { idToNameMap, idToNodeMap };
    }

    public async fetchFigmaFiles(team: ExtendedGetTeamProjectsResult) {
        try {
            const files = await this.fetchFigmaProjectFilesByTeams([team]);
            this.files = files;
        } catch (error) {
            console.error("Error in fetchFigmaInformation:", error);
            throw error;
        }
    }

    public async fetchFigmaInformation(callback: () => void) {
        try {
            const user = await this.figmaApiService.getMe();
            this.userInfo = user;
            callback();
        } catch (error) {
            console.error("Error in fetchFigmaInformation:", error);
            throw error;
        }
    }

    public async fetchFigmaTeams(
        teamIds: string[],
    ): Promise<Map<string, ExtendedGetTeamProjectsResult>> {
        try {
            const responses = await Promise.all(
                teamIds.map((id) => this.figmaApiService.getTeamProjects(id)),
            );

            const resultMap = teamIds.reduce((map, teamId, index) => {
                map.set(teamId, responses[index]);
                return map;
            }, new Map<string, ExtendedGetTeamProjectsResult>());

            return resultMap;
        } catch (error) {
            console.error("Error in fetchFigmaTeams:", error);
            return new Map<string, ExtendedGetTeamProjectsResult>();
        }
    }

    public async fetchFigmaProjects(
        projectIds: string[],
    ): Promise<Map<string, ExtendedGetProjectFilesResult>> {
        try {
            const responses = await Promise.all(
                projectIds.map((id) =>
                    this.figmaApiService.getProjectFiles(id),
                ),
            );

            const resultMap = projectIds.reduce((map, projectId, index) => {
                map.set(projectId, responses[index]);
                return map;
            }, new Map<string, ExtendedGetProjectFilesResult>());

            return resultMap;
        } catch (error) {
            console.error("Error in fetchFigmaProjects:", error);
            return new Map<string, ExtendedGetProjectFilesResult>();
        }
    }

    public getUserInfo() {
        return this.userInfo;
    }

    public getFiles() {
        return this.files;
    }

    public setToken(token: string) {
        this.figmaApiService.setToken(token);
    }
}
