import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import { edgeDetection, startScan } from "./imageScanner";


function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
    });

    mainWindow.loadFile(path.join(__dirname, "../index.html"));
    mainWindow.webContents.send('setup-ui');

    ipcMain.handle('startScan', () => startScan() );
    ipcMain.handle('edgeDetection', () => edgeDetection() );

    mainWindow.webContents.openDevTools();
}


app.whenReady().then(() => {
    if (require('electron-squirrel-startup')) 
        return app.quit();
    
    createWindow();

    app.on("activate", function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});


app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});


app.on('certificate-error', (...args) => {
    // ignore certificate errors
    return args[5](true);
});
