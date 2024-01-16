import { SelectItem } from "../../components/common";
import { DataApi } from "./dataApi";

export class AssigneeApi extends DataApi<SelectItem[]> {
  constructor() {
    super("sdk/assignees");
  }
}

export const assigneeApi = new AssigneeApi();
