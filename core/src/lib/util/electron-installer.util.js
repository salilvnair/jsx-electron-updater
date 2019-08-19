import { Subject } from 'rxjs';

import { ElectronAppUtil } from './electron-app.util';
import { DownloadNotifierType } from './model/download-status.model';

export class ElectronInstallerUtil {

  _electronAppUtil = new ElectronAppUtil();

  download(url, downloadPath,fileName){
      return this._download(url, downloadPath,fileName);
  }

  extract(options){
      return this._extract(options);
  }

  replace(options) {
      this._replace(options);
  }

  clean(options,appDownloadPath) {
      this._clean(options,appDownloadPath);
  }

  encrypt(key, value) {
      return this._ecrypt(key,value);
  }

  decrypt(key, value) {
      return this._decrypt(key,value);
  }

  gt(v1, v2) {
    return this._gt(v1, v2);
  }

  ngxeuUtil() {
      let ngxeuUtil = this._electronAppUtil.remote().require('@ngxeu/util');
      return ngxeuUtil;
  }

  _gt(v1, v2) {
    let ngxeuUtil = this._electronAppUtil.remote().require('@ngxeu/util');
    return ngxeuUtil.gt(v1, v2);
  }

  _ecrypt(key, value) {
      let ngxeuUtil = this._electronAppUtil.remote().require('@ngxeu/util');
      return ngxeuUtil.encrypt(key,value);
  }

  _decrypt(key, value) {
      let ngxeuUtil = this._electronAppUtil.remote().require('@ngxeu/util');
      return ngxeuUtil.decrypt(key,value);
  }

  _clean(options,appDownloadPath) {
      let fsExtra = this._electronAppUtil.remote().require('fs-extra');
      fsExtra.removeSync(appDownloadPath);
  }

  _removeAllDownloadEventListerners() {
      let ngxeuUtil = this._electronAppUtil.remote().require('@ngxeu/util');
      ngxeuUtil.removeAllListeners("data");
      ngxeuUtil.removeAllListeners("finish");
      ngxeuUtil.removeAllListeners("error");
  }

  _download(url, downloadPath, fileName){
      let downloadNotifierSubject = new Subject();
      let ngxeuUtil = this._electronAppUtil.remote().require('@ngxeu/util');
      let downloadNotifier;
      ngxeuUtil.download(url, downloadPath,fileName);
      ngxeuUtil.on("data",(data)=>{
          downloadNotifier = new DownloadNotifierType();
          downloadNotifier.key = "data";
          downloadNotifier.value = data;
          downloadNotifierSubject.next(downloadNotifier);
      });
      ngxeuUtil.on("finish",()=>{
          this._removeAllDownloadEventListerners();
          downloadNotifier = new DownloadNotifierType();
          downloadNotifier.key = "finish";
          downloadNotifier.path = downloadPath;
          downloadNotifierSubject.next(downloadNotifier);
          downloadNotifierSubject.complete();
      });
      ngxeuUtil.on("error",(error)=>{
          downloadNotifier = new DownloadNotifierType();
          downloadNotifier.key = "error";
          downloadNotifier.value = error;
          downloadNotifierSubject.next(downloadNotifier);
      });
      return downloadNotifierSubject;
  }

  _extract(options){
      let ngxeuUtil = this._electronAppUtil.remote().require('@ngxeu/util');
      ngxeuUtil.setOptions(options);
      ngxeuUtil.extract();
      return new Promise( (resolve, reject) => {
          ngxeuUtil.on("finish",()=>{
              resolve(true);
          })
      });
  }

  _replace(options) {
      let fsExtra = this._electronAppUtil.remote().require('fs-extra');
      let path = this._electronAppUtil.remote().require('path');
      let currentDir = options.app_dir;
      let source;
      let destination;
      let  defaultDownloadInfo = {
        suffix : "jsxeu/updates/pending",
        newUpdateBuildPath : "jsxeu/updates/pending/build",
        newUpdateAppPath : "jsxeu/updates/pending/app",
        buildPath : "build",
        appPath : ".",
        extractPath : "jsxeu/updates/pending"
      };
      if(options.updateType==="build"){
           source = path.resolve(currentDir, defaultDownloadInfo.newUpdateBuildPath);
           destination = path.resolve(currentDir, defaultDownloadInfo.buildPath);
           let packageJsonPath = path.resolve(currentDir, defaultDownloadInfo.appPath,"package.json");
           this._updatePackageJsonVersion(packageJsonPath,options);
      }
      else {
          source = path.resolve(currentDir, defaultDownloadInfo.newUpdateAppPath);
          destination = path.resolve(currentDir, defaultDownloadInfo.appPath);
      }
      fsExtra.copySync(source, destination);
      fsExtra.removeSync(source);
  }

  _updatePackageJsonVersion(packageJsonPath, options) {
      let jsonFile =   this._electronAppUtil.remote().require('jsonfile');
      let appReleaseInfo = options.appReleaseInfo;
      let packageJson = jsonFile.readFileSync(packageJsonPath);
      //console.log("old pkgjson",packageJson);
      packageJson.version = appReleaseInfo.version;
      jsonFile.writeFileSync(packageJsonPath,packageJson,{spaces: 2, EOL: '\r\n'});
  }



}
