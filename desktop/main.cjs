const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("node:path");

const APP_NAME = "Basic Clock";
const APP_URL = path.join(__dirname, "..", "index.html");

function createWindow() {
  const window = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 900,
    minHeight: 640,
    title: APP_NAME,
    backgroundColor: "#08141f",
    icon: path.join(__dirname, "..", "icons", "basic-clock-512.png"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  window.loadFile(APP_URL);

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith("file:")) shell.openExternal(url);
    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    if (url.startsWith("file:")) return;
    event.preventDefault();
    shell.openExternal(url);
  });
}

app.setName(APP_NAME);

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
