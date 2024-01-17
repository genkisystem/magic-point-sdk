import {
    GetProjectFilesResult,
    GetTeamProjectsResult,
} from "figma-api/lib/api-types";
import { Node } from "figma-api/lib/ast-types";

export type ExtendedGetTeamProjectsResult = GetTeamProjectsResult & {
    name: string;
};
export type ExtendedGetProjectFilesResult = GetProjectFilesResult & {
    name: string;
};

export type ImageInfo = { name: string; image: string; node: Node };

export type FileImageMap = { [fileId: string]: ImageInfo[] };

export type FileNameMap = { [id: string]: string };

export type NodeIdMap = { [id: string]: Node };
