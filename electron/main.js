const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "Rede Girassol RH",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // Load the built Angular application
    // Based on angular.json, the build output is in the /dist folder
    win.loadFile(path.join(__dirname, '../dist/index.html'));

    // Uncomment to open DevTools
    // win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
