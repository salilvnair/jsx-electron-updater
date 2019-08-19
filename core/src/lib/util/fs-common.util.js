import { ElectronAppUtil } from './electron-app.util';
export class FsCommonUtil {
  fs;
  path;
  constructor() {
    let electronAppUtil = new ElectronAppUtil();
    this.fs = electronAppUtil.remote().require("fs");
    this.path = electronAppUtil.remote().require("path");
  }

  writeFileIfNotExist(fileWithPath, contents) {
    if (!this.fs.existsSync(fileWithPath)) {
      var options = options || {};
      options.flag = "wx";
      this.fs.writeFileSync(fileWithPath, contents, options);
    }
  }

  checkAndCreateDestinationPath(fileDestination) {
    const dirPath = fileDestination.split("\\");
    var self = this;
    dirPath.forEach((element, index) => {
      if (!self.fs.existsSync(dirPath.slice(0, index + 1).join("/"))) {
        self.fs.mkdirSync(dirPath.slice(0, index + 1).join("/"));
      }
    });
  }

  readFileAsJson(jsonPath) {
    return JSON.parse(this.fs.readFileSync(jsonPath, "utf8"));
  }

  createWriteStream(path) {
     return this.fs.createWriteStream(path);
  }

  isDirectoryEmpty(dirname) {
    if(this.fs.existsSync(dirname)){
      let files =  this.fs.readdirSync(dirname);
      if (files && files.length>0) {
       return false;
      }
    }
   return true;
  }


}
