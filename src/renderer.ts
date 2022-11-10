// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process unless
// nodeIntegration is set to true in webPreferences.
// Use preload.js to selectively enable features
// needed in the renderer process.


const buttonStartScanClick = async () => {
    await window.scanner.startScan();
}
const buttonPurchaseSucceedClick = async () => {
    await window.scanner.edgeDetection();
}

document.getElementById("buttonStartScan")?.addEventListener("click", buttonStartScanClick);
document.getElementById("buttonEdgeDetection")?.addEventListener("click", buttonPurchaseSucceedClick);
