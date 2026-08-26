const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");

let serverProcess;

function startServer() {
    serverProcess = spawn(
        "node",
        ["server/server.js"],
        {
            cwd: __dirname,
            shell: true,
            stdio: "inherit"
        }
    );
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700
    });

    win.loadURL("http://localhost:3000");
}

app.whenReady().then(() => {
    startServer();

    setTimeout(() => {
        createWindow();
    }, 2000);
});

app.on("window-all-closed", () => {
    if (serverProcess) {
        serverProcess.kill();
    }

    if (process.platform !== "darwin") {
        app.quit();
    }
});