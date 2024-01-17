import { SelectItem } from "../../components/common";
import { DataApi } from "./dataApi";

export class IssueApi extends DataApi<SelectItem[]> {
  constructor() {
    super("sdk/issue-types");
  }
}

export const issueApi = new IssueApi();
