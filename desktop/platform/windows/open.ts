import { shell } from "electron";
export const openWindowsPath = (target: string) => shell.openPath(target);
