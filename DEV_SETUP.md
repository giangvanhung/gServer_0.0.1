# Dev Setup Guide — gServer + gClient (WCF + ExtJS)

> Stack: WCF .NET Framework 4.5.1 (Windows-only) + ExtJS 8 / webpack-dev-server (Linux-friendly)
> Environment: WSL Ubuntu + Windows

---

## The Split

| What | Where | Tool |
| --- | --- | --- |
| WCF backend (`gServer_0.0.1/`) | Windows | Visual Studio 2022 |
| ExtJS frontend (`gClient_ExtJS/g-client/`) | WSL Ubuntu | VS Code + terminal |
| Git, scripts | WSL Ubuntu | bash |

---

## One-time Setup

### 1. Install VS Code on Windows with Remote - WSL

1. Download and install [VS Code for Windows](https://code.visualstudio.com/)
2. Open VS Code → Extensions → search `WSL` → install **Remote - WSL** (by Microsoft)
3. From WSL terminal: `code .` — this opens VS Code connected to your WSL files

### 2. Open the WCF solution in Visual Studio (Windows)

From Windows File Explorer, navigate to your project via WSL interop:

```text
\\wsl.localhost\Ubuntu\home\hung\dev_\gServer_0.0.1\gServer_0.0.1.sln
```

Or pin the path. Double-click `gServer_0.0.1.sln` to open in Visual Studio 2022.

> If Visual Studio 2022 is not installed, download the free **Community** edition from
> <https://visualstudio.microsoft.com/> — install with the "ASP.NET and web development" workload.

### 3. Install frontend dependencies (WSL, one time)

```bash
cd ~/dev_/gServer_0.0.1/gClient_ExtJS/g-client
npm install
```

---

## Daily Dev Workflow

### Step 1 — Start the WCF backend (Windows side)

#### Option A — Visual Studio (recommended for debugging)

1. Open `gServer_0.0.1.sln` in Visual Studio
2. Press **F5** — builds and launches IIS Express automatically
3. Backend available at: `http://localhost:52106/LayerService.svc`
4. Set breakpoints anywhere in C# code — they just work

#### Option B — Headless (no debugging needed)

From WSL terminal:

```bash
./run-server.sh          # build + start IIS Express on :52106
./run-server.sh -SkipBuild   # skip build if nothing changed
```

### Step 2 — Start the ExtJS frontend (WSL side)

```bash
cd ~/dev_/gServer_0.0.1/gClient_ExtJS/g-client
npm run dev
```

webpack-dev-server starts, usually on <http://localhost:1841> (check terminal output).
Edits to JS/SCSS files hot-reload in the browser automatically.

### Step 3 — Edit code

- **C# / WCF files** → edit in Visual Studio (Windows), or VS Code via Remote-WSL
- **ExtJS JS/SCSS files** → edit in VS Code (`code .` from WSL terminal)

Both editors see the same files because VS Code Remote-WSL bridges to the WSL filesystem.

---

## Debugging

### Debug WCF (C#) in Visual Studio

1. Start with F5 (Debug mode)
2. Set a breakpoint in any `.cs` file (click the gutter)
3. Trigger the request from the browser / ExtJS client
4. Visual Studio pauses at the breakpoint — inspect variables, step through code

### Debug ExtJS (JavaScript) in Browser

1. Open Chrome/Edge DevTools → **Sources** tab
2. Find your file under `webpack://` → set breakpoints
3. Or use `console.log` / `debugger` statements in JS files

### Check WCF service is running

```bash
curl http://localhost:52106/LayerService.svc
# Should return the WCF service page HTML
```

---

## Common Issues

### `run-server.sh` hangs or shows nothing

- Make sure you run it from a plain WSL bash terminal, not from inside `pwsh`
- `cmd.exe` must be accessible: `which cmd.exe` should return a path

### ExtJS can't reach the WCF service (CORS error in browser)

- The WCF service must have CORS headers configured, or use the webpack proxy
- In `webpack.config.js`, add a proxy:

```js
devServer: {
  proxy: {
    '/LayerService.svc': 'http://localhost:52106'
  }
}
```

### Visual Studio can't open the `.sln` from the UNC path

- Copy or open from: `\\wsl.localhost\Ubuntu\home\hung\dev_\gServer_0.0.1\`
- If slow, consider symlinking the project to a Windows drive (`C:\dev\gServer`)

### `$PSScriptRoot` is null in PowerShell

- Don't run `run-server.ps1` directly from `pwsh`
- Always use `run-server.sh` from bash, or use Visual Studio F5

---

## Port Reference

| Service | Port | URL |
| --- | --- | --- |
| WCF / IIS Express | 52106 | <http://localhost:52106/LayerService.svc> |
| ExtJS webpack-dev-server | 1841 (auto) | <http://localhost:1841> |

---

## Quick Reference

```bash
# Start frontend (WSL)
cd ~/dev_/gServer_0.0.1/gClient_ExtJS/g-client && npm run dev

# Start backend headless (WSL → Windows)
cd ~/dev_/gServer_0.0.1 && ./run-server.sh

# Open VS Code for frontend editing (WSL)
cd ~/dev_/gServer_0.0.1 && code .

# Check backend health
curl -s http://localhost:52106/LayerService.svc | head -5
```
