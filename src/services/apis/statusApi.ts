import { SelectItem } from "../../components/common";
import { DataApi } from "./dataApi";

export class StatusApi extends DataApi<SelectItem[]> {
  constructor() {
    super("sdk/statues");
  }
}

export const statusApi = new StatusApi();
