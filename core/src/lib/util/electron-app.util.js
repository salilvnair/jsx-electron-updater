export class ElectronAppUtil {

  electron() {
    if (!this._electron) {
      this._electron = window.require('electron');
      return this._electron;

  }
  return this._electron;
  }
  remote(){
    return this.electron().remote;
  }

  process() {
    return this.remote() ? this.remote().process : null;
  }

  appPath() {
      let appPath = this.env().PWD;
      if(!appPath) {
          appPath = this.remote().app.getAppPath();
      }
      return appPath;
  }

  restart() {
      this.remote().app.relaunch();
      this.remote().app.exit(0);
  }

  reload() {
      this.remote().webContents.getFocusedWebContents().reload();
  }

  env() {
      return this.process().env;
  }

  os() {
      return this.process().platform;
  }

  pwd() {
      if(this.os()===Platform.windows){
          return this.env().INIT_CWD
      }
      return this.env().PWD
  }

  npmVersion() {
      let jsonFile = this.remote().require('jsonfile');
      let path = this.remote().require('path');
      let packageJsonPath = path.resolve(this.appPath(),"package.json");
      let packageJson = jsonFile.readFileSync(packageJsonPath);
      return packageJson.version;
  }

  localAppDataPath() {
      let localAppDataPath =this.remote().process.platform == 'darwin' ? this.remote().process.env.HOME+ '/Library/Application Support':this.env().LOCALAPPDATA;
      return localAppDataPath;
  }

  appDataPath() {
      let appDataPath =this.remote().this.remote().processplatform == 'darwin' ? this.remote().process.env.HOME+ '/Library/Application Support':this.env().APPDATA;
      return appDataPath;
  }

  isWindows() {
      return this.remote().process.platform === 'win32';
  }

  isMac() {
    return this.remote().process.platform === 'darwin';
  }

}
