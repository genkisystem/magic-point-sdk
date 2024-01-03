export type FigmaUser = {
    id: string;
    /**
     * User name
     */
    handle: string;
    img_url: string;
    email: string;
};

export type NodeType =
    | "DOCUMENT"
    | "CANVAS"
    | "FRAME"
    | "GROUP"
    | "VECTOR"
    | "BOOLEAN_OPERATION"
    | "STAR"
    | "LINE"
    | "ELLIPSE"
    | "REGULAR_POLYGON"
    | "RECTANGLE"
    | "TEXT"
    | "SLICE"
    | "COMPONENT"
    | "COMPONENT_SET"
    | "INSTANCE";

export interface Global {
    /** A string uniquely identifying this node within the document. */
    id: string;
    /** The name given to the node by the user in the tool. */
    name: string;
    /** whether or not the node is visible on the canvas. */
    visible?: boolean;
    /** The type of the node, refer to table below for details. */
    type: NodeType;
    /** The rotation of the node, if not 0. */
    rotation: number;
    /** Data written by plugins that is visible only to the plugin that wrote it. Requires the `pluginData` to include the ID of the plugin. */
    pluginData?: any;
    /** Data written by plugins that is visible to all plugins. Requires the `pluginData` parameter to include the string "shared". */
    sharedPluginData?: any;
}

export interface FigmaFile {
    document: FigmaDocument;
}

interface FigmaDocument {
    children: FigmaNode[];
}

export interface FigmaNode {
    id: string;
    name: string;
    type: NodeType;
    children?: FigmaNode[];
}

export interface FigmaProject {
    /** The ID of the project */
    id: number;
    /** The name of the project */
    name: string;
}

export interface FigmaTeamProjectResponse {
    name: string;
    projects: FigmaProject[];
}

export interface FigmaProjectFile {
    key: string;
    name: string;
    thumbnail_url: string;
    last_modified: string;
}

export interface FigmaProjectFileResponse {
    name: string;
    files: FigmaProjectFile[];
}

export type ImageInfo = { name: string; image: string; }

export type FileImageMap = { [fileId: string]: ImageInfo[] };
