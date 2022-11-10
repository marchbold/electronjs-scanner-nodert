// All of the Node.js APIs are available in the preload process.

import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

export type ScannerAPI = {
  startScan:() => Promise<any>;
  edgeDetection:() => Promise<any>;
}

const scannerApi:ScannerAPI = {
  startScan: () => ipcRenderer.invoke('startScan'),
  edgeDetection: () => ipcRenderer.invoke('edgeDetection'),
};

contextBridge.exposeInMainWorld('scanner', scannerApi);


// It has the same sandbox as a Chrome extension.
window.addEventListener("DOMContentLoaded", () => {
  const replaceText = (selector: string, text: string) => {
    const element = document.getElementById(selector);
    if (element) {
      element.innerText = text;
    }
  };
});


ipcRenderer.on('socket-log', (msg: IpcRendererEvent, tag: string, data: object) => {
  const logTextArea: HTMLTextAreaElement = <HTMLTextAreaElement>document.getElementById("log-content");
  const currentContent = logTextArea.value;
  logTextArea.value = tag + " " + JSON.stringify(data) + "\n" + currentContent;
});

ipcRenderer.on('setup-ui', (msg: any) => {

});


