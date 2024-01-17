import { GetFileResult } from "figma-api/lib/api-types";
import { Node, NodeType } from "figma-api/lib/ast-types";

type Coordinate = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type AnalyzedNode = {
    type: NodeType;
    coordinates?: Coordinate;
    originalNode: Node;
    children: AnalyzedNode[];
};

export const getFileContent = async (file: GetFileResult): Promise<string> => {
    console.log("file", file);
    const document = file.document;
    const pages = document.children as Node<"CANVAS">[];
    console.log("pages", pages);

    return JSON.stringify(file);
};

export const analyzeScreen = (screen: Node): void => {
    console.log("screen", screen);
    const nodeType = getNodeType(screen);
    const children = getChildNodes(screen);
    console.log("children", children);
    analyzeNode(screen, nodeType);

    let analyzedNode: AnalyzedNode = calculateAnalyzedNode(screen);
    console.log("analyzedNode", analyzedNode);
};

function calculateAnalyzedNode(node: Node): AnalyzedNode {
    let analyzedNode: AnalyzedNode;
    const nodeType = getNodeType(node);
    const coordinates = getNodeCoordinates(node);
    const children = getChildNodes(node);
    analyzedNode = {
        type: nodeType,
        coordinates: coordinates,
        originalNode: node,
        children: calculateAnalyzedNodes(children),
    };

    return analyzedNode;
}

function calculateAnalyzedNodes(nodes: Node[]): AnalyzedNode[] {
    return nodes.map((node) => calculateAnalyzedNode(node));
}

const analyzeNode = (node: Node, nodeType: NodeType): void => {
    console.log("node", node, nodeType);
    switch (nodeType) {
        case "CANVAS":
            break;
        case "FRAME":
            analyzeFrame(node as Node<"FRAME">);
            break;
        case "GROUP":
            break;
        case "TEXT":
            break;
        default:
            throw new Error(`Unknown node type: ${nodeType}`);
    }
};

export function getNodeType(node: Node): NodeType {
    return node.type;
}

const analyzeFrame = (frame: Node<"FRAME">): void => {
    console.log("frame", frame);
    const coordinates = getNodeCoordinates(frame);
    console.log("coordinates", coordinates);
    const children = frame.children;
    console.log("children", children);
};

function getChildNodes(node: Node): Node[] {
    if ("children" in node) {
        return node.children;
    }
    return [];
}

function getNodeCoordinates(node: Node): Coordinate | undefined {
    if ("absoluteBoundingBox" in node) {
        return {
            x: node.absoluteBoundingBox.x,
            y: node.absoluteBoundingBox.y,
            width: node.absoluteBoundingBox.width,
            height: node.absoluteBoundingBox.height,
        };
    }
    return undefined;
}
