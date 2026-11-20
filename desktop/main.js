/* Minimal secure desktop shell. Loads your hosted app (HTTPS, so Google sign-in works) or the local build. */
const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const APP_URL = process.env.SMARTCASH_URL || "";   // e.g. https://USERNAME.github.io/smart-cash/
function create() {
  const w = new BrowserWindow({ width: 1180, height: 820, backgroundColor: "#000000", title: "Smart Cash",
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true } });
  w.setMenuBarVisibility(false);
  w.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//.test(url)) shell.openExternal(url); return { action: "deny" }; });
  w.webContents.on("will-navigate", (e, url) => { if (APP_URL ? !url.startsWith(APP_URL) : !url.startsWith("file://")) e.preventDefault(); });
  APP_URL ? w.loadURL(APP_URL) : w.loadFile(path.join(__dirname, "..", "dist", "index.html"));
}
app.whenReady().then(create);
app.on("window-all-closed", () => process.platform !== "darwin" && app.quit());
