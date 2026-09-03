const { app, BrowserWindow } = require("electron");
const path = require("path");

let serverStarted = false;

function startServer() {
    if (serverStarted) return;

    serverStarted = true;

    // Tell the database where the packaged app should store
    // the user's AceArch data.
    process.env.ACEARCH_DATA_DIR = path.join(
        app.getPath("userData"),
        "data"
    );

    // Start the existing Express server directly.
    // server.js already calls app.listen(3000).
    require(path.join(__dirname, "server", "server.js"));
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        icon: path.join(__dirname, "public", "assets", "acearch-icon.ico")
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
    if (process.platform !== "darwin") {
        app.quit();
    }
});