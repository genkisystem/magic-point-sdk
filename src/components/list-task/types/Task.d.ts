import { Type as Assignee, Type as IssueType, Type as IssueStatus } from "./Type"

export type Task = {
    id?: number
    title: string
    description: string
    pointDom: string
    taskUrl?: string
    createdDate?: string
    updatedDate?: string
    base64Images: (string | undefined)[]
    taskStatus: IssueStatus
    assignee: Assignee | null
    issueType: IssueType,
    endPoint: string,
    isRender?: boolean
}