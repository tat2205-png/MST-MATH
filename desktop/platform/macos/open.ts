import { shell } from "electron";
export const openMacPath = (target: string) => shell.openPath(target);
