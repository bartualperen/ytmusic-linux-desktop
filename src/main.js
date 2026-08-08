'use strict';

const {
  app,
  BrowserWindow,
  shell,
  session,
  Tray,
  Menu,
  nativeImage
} = require('electron');

const fs = require('node:fs');
const path = require('node:path');

const MUSIC_URL = 'https://music.youtube.com/';

const DEFAULT_WINDOW_STATE = {
  width: 1280,
  height: 820,
  x: null,
  y: null,
  maximized: false
};

const ALLOWED_NAVIGATION_HOSTS = new Set([
  'music.youtube.com',
  'accounts.google.com'
]);


const DESKTOP_NAME =
  'com.github.bartualperen.ytmusiclinuxdesktop.desktop';

function getAppIconPath() {
  if (app.isPackaged) {
    return path.join(
      process.resourcesPath,
      'icon.png'
    );
  }

  return path.join(
    __dirname,
    '..',
    'build',
    'icon.png'
  );
}

let mainWindow = null;
let tray = null;
let saveStateTimer = null;

function parseHttpsUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);

    if (url.protocol !== 'https:') {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

function isAllowedNavigation(rawUrl) {
  const url = parseHttpsUrl(rawUrl);

  if (!url) {
    return false;
  }

  return ALLOWED_NAVIGATION_HOSTS.has(url.hostname);
}

async function openExternalSafely(rawUrl) {
  const url = parseHttpsUrl(rawUrl);

  if (!url) {
    console.warn('[security] Blocked external URL:', rawUrl);
    return;
  }

  try {
    await shell.openExternal(url.toString());
  } catch (error) {
    console.error('[external] Failed to open URL:', error);
  }
}

function getWindowStatePath() {
  return path.join(
    app.getPath('userData'),
    'window-state.json'
  );
}

function loadWindowState() {
  try {
    const raw = fs.readFileSync(
      getWindowStatePath(),
      'utf8'
    );

    return {
      ...DEFAULT_WINDOW_STATE,
      ...JSON.parse(raw)
    };
  } catch {
    return { ...DEFAULT_WINDOW_STATE };
  }
}

function saveWindowState() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  const bounds = mainWindow.getNormalBounds();

  const state = {
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    maximized: mainWindow.isMaximized()
  };

  try {
    fs.mkdirSync(
      app.getPath('userData'),
      { recursive: true }
    );

    fs.writeFileSync(
      getWindowStatePath(),
      JSON.stringify(state, null, 2),
      'utf8'
    );
  } catch (error) {
    console.error(
      '[window-state] Failed to save:',
      error.message
    );
  }
}

function scheduleWindowStateSave() {
  clearTimeout(saveStateTimer);

  saveStateTimer = setTimeout(() => {
    saveWindowState();
  }, 300);
}

function configureSession() {
  const musicSession =
    session.fromPartition('persist:ytmusic');

  musicSession.setPermissionCheckHandler(
    () => false
  );

  musicSession.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      console.warn(
        '[permission] Denied:',
        permission
      );

      callback(false);
    }
  );

  musicSession.on(
    'will-download',
    (_event, item) => {
      console.warn(
        '[download] Blocked:',
        item.getURL()
      );

      item.cancel();
    }
  );
}

function windowIsVisible() {
  return Boolean(
    mainWindow &&
    !mainWindow.isDestroyed() &&
    mainWindow.isVisible()
  );
}

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow();
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  mainWindow.show();
  mainWindow.focus();

  updateTrayMenu();
}

function hideMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  mainWindow.hide();
  updateTrayMenu();
}

function toggleMainWindow() {
  if (windowIsVisible()) {
    hideMainWindow();
  } else {
    showMainWindow();
  }
}

function updateTrayMenu() {
  if (!tray || tray.isDestroyed()) {
    return;
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: windowIsVisible()
        ? 'Hide YTM Linux Desktop'
        : 'Show YTM Linux Desktop',
      click: toggleMainWindow
    },
    {
      type: 'separator'
    },
    {
      label: 'Reload YouTube Music',
      enabled: Boolean(
        mainWindow &&
        !mainWindow.isDestroyed()
      ),
      click: () => {
        if (
          mainWindow &&
          !mainWindow.isDestroyed()
        ) {
          mainWindow.webContents.reload();
        }
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

function createTray() {
  if (tray && !tray.isDestroyed()) {
    return;
  }

  const icon = nativeImage
    .createFromPath(getAppIconPath())
    .resize({
      width: 22,
      height: 22
    });

  tray = new Tray(icon);

  tray.setToolTip('YTM Linux Desktop');

  tray.on('click', () => {
    toggleMainWindow();
  });

  updateTrayMenu();
}

function createWindow() {
  const windowState = loadWindowState();

  const windowOptions = {
    width: windowState.width,
    height: windowState.height,

    minWidth: 900,
    minHeight: 600,

    show: false,
    backgroundColor: '#030303',
    title: 'YTM Linux Desktop',

    icon: getAppIconPath(),

    webPreferences: {
      partition: 'persist:ytmusic',

      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,

      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  };

  if (
    Number.isInteger(windowState.x) &&
    Number.isInteger(windowState.y)
  ) {
    windowOptions.x = windowState.x;
    windowOptions.y = windowState.y;
  }

  mainWindow = new BrowserWindow(windowOptions);

  mainWindow.setMenu(null);

  mainWindow.webContents.on(
    'will-navigate',
    (event, details) => {
      const targetUrl =
        typeof details === 'string'
          ? details
          : details.url;

      if (isAllowedNavigation(targetUrl)) {
        return;
      }

      event.preventDefault();

      console.warn(
        '[navigation] Blocked:',
        targetUrl
      );

      void openExternalSafely(targetUrl);
    }
  );

  mainWindow.webContents.setWindowOpenHandler(
    ({ url }) => {
      if (isAllowedNavigation(url)) {
        console.warn(
          '[popup] Internal popup denied:',
          url
        );

        return { action: 'deny' };
      }

      void openExternalSafely(url);

      return { action: 'deny' };
    }
  );

  mainWindow.webContents.on(
    'before-input-event',
    (event, input) => {
      const key =
        typeof input.key === 'string'
          ? input.key.toLowerCase()
          : '';

      const isF12 =
        input.type === 'keyDown' &&
        key === 'f12';

      const isDevToolsShortcut =
        input.type === 'keyDown' &&
        input.control &&
        input.shift &&
        key === 'i';

      if (isF12 || isDevToolsShortcut) {
        event.preventDefault();
      }
    }
  );

  mainWindow.webContents.on(
    'render-process-gone',
    (_event, details) => {
      console.error(
        '[renderer] Process gone:',
        details.reason,
        details.exitCode
      );
    }
  );

  mainWindow.webContents.on(
    'did-fail-load',
    (
      _event,
      errorCode,
      errorDescription,
      validatedURL,
      isMainFrame
    ) => {
      if (!isMainFrame) {
        return;
      }

      if (errorCode === -3) {
        return;
      }

      console.error(
        '[load] Failed:',
        errorCode,
        errorDescription,
        validatedURL
      );
    }
  );

  mainWindow.on(
    'resize',
    scheduleWindowStateSave
  );

  mainWindow.on(
    'move',
    scheduleWindowStateSave
  );

  mainWindow.on(
    'maximize',
    scheduleWindowStateSave
  );

  mainWindow.on(
    'unmaximize',
    scheduleWindowStateSave
  );

  mainWindow.on('show', updateTrayMenu);
  mainWindow.on('hide', updateTrayMenu);

  mainWindow.once(
    'ready-to-show',
    () => {
      if (windowState.maximized) {
        mainWindow.maximize();
      }

      mainWindow.show();
      updateTrayMenu();
    }
  );

  mainWindow.on('close', () => {
    saveWindowState();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    updateTrayMenu();
  });

  void mainWindow.loadURL(MUSIC_URL);
}

app.setName('YTM Linux Desktop');
app.setDesktopName(DESKTOP_NAME);

const gotSingleInstanceLock =
  app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    showMainWindow();
  });

  app.whenReady().then(() => {
    configureSession();

    createWindow();
    createTray();

    app.on('activate', () => {
      if (
        BrowserWindow.getAllWindows().length === 0
      ) {
        createWindow();
      } else {
        showMainWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
