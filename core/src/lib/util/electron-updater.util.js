import { Subject } from 'rxjs';
import { GitHubReleaseUtil } from './github-release.util';
import { ElectronAppUtil } from './electron-app.util';
import { FsCommonUtil } from './fs-common.util';
import { AppUpadateStatus } from './model/app-update-status.model';
import { ElectronInstallerUtil } from './electron-installer.util';
import { DownloadNotifierType, DownloadStatus } from './model/download-status.model';

export class ElectronUpdaterUtil {

  _gitHubReleaseUtil;
  _electronAppUtil;
  _fsCommonUtil;
  _electronInstallerUtil;
  releaseInfo;
  constructor(releaseInfo) {
    this.releaseInfo = releaseInfo;
    this._gitHubReleaseUtil  = new GitHubReleaseUtil();
    this._electronAppUtil = new ElectronAppUtil();
    this._fsCommonUtil = new FsCommonUtil();
    this._electronInstallerUtil = new ElectronInstallerUtil();
  }

  checkForUpdate = () => {
    return this._checkForUpdate();
  }

  getAppDownloadPath = () => {
    return this._getAppDownloadPath();
  }

  hasPendingUpdates() {
    return !this._fsCommonUtil.isDirectoryEmpty(this._getAppDownloadPath());
  }

  download() {
    let downloadNotifierSubject = new Subject();
    this._checkForUpdate().subscribe(updateStatus=>{
        this._downloadLatest(downloadNotifierSubject,updateStatus);
    })
    return downloadNotifierSubject.asObservable();
  }

  appName() {
    return this.releaseInfo.appName;
  }

  restart() {
      this._electronAppUtil.restart();
  }

  reload() {
      this._electronAppUtil.reload();
  }

  install() {
    let installNotifierSubject = new Subject();
    this._updateInstallationProgress(installNotifierSubject,"1");
    this.checkForUpdate().subscribe(updateStatus=>{
        let appVersion = updateStatus.appReleaseInfo.version;
        let appZipFileName = this._getAppZipFileName(this.appName(),appVersion);
        let downloadRelativePath = this._getAppDownloadPath();
        let options = {};
        if(this._electronAppUtil.isWindows()){
            options.os = "win";
        }
        else if(this._electronAppUtil.isMac()){
            options.os = "mac";
        }
        this._updateInstallationProgress(installNotifierSubject,"10");
        let path = this._electronAppUtil.remote().require('path');
        options.extract_path = path
            .resolve(this._electronAppUtil.appPath(), "jsxeu/updates/pending");
        options.appName = this.appName();
        options.app_dir = this._electronAppUtil.appPath();
        options.zip_file_path = downloadRelativePath+"/"+appZipFileName;
        options.updateType=updateStatus.appReleaseInfo.type;
        options.appReleaseInfo = updateStatus.appReleaseInfo;
        console.log(options)
        this._updateInstallationProgress(installNotifierSubject,"25");
        this._electronInstallerUtil.extract(options).then(extracted=>{
            this._updateInstallationProgress(installNotifierSubject,"40");
            if(extracted){
                this._electronInstallerUtil.replace(options);
                this._updateInstallationProgress(installNotifierSubject,"50");
                this._electronInstallerUtil.clean(options,downloadRelativePath);
                this._updateInstallationProgress(installNotifierSubject,"100");
            }
        });
    })
    return installNotifierSubject.asObservable();
  }


  _updateInstallationProgress(installNotifierSubject, percentage){
    let downloadNotifier;
    downloadNotifier = new DownloadNotifierType();
    downloadNotifier.key = "data";
    let data = new DownloadStatus();
    data.currentPercentage=percentage;
    downloadNotifier.value = data;
    installNotifierSubject.next(downloadNotifier);
  }

  _getAppDownloadPath() {
    let defaultDownloadPath = this._electronAppUtil.localAppDataPath();
    let downloadSuffix =  this.appName()+"/"+"jsxeu/updates/pending"+"/";
    let path = this._electronAppUtil.remote().require('path');
    let downloadRelativePath = path.resolve(defaultDownloadPath, downloadSuffix);
    console.log(downloadRelativePath)
    return downloadRelativePath;
  }

  _checkForUpdate() {
    let updateStatus = new Subject();
    let url = GitHubReleaseUtil.getLatestReleaseUrl(this.releaseInfo);
    this._gitHubReleaseUtil.hasReleaseInfo(url, this.releaseInfo).subscribe(hasReleaseInfo=>{
        if(hasReleaseInfo==="available"){
            this._gitHubReleaseUtil.getLatestReleaseInfo(url, this.releaseInfo).subscribe(appReleaseInfo=>{
                let appUpadateStatus = new AppUpadateStatus();
                appUpadateStatus.appReleaseInfo = appReleaseInfo;
                appUpadateStatus.currentAppVersion = this._electronAppUtil.npmVersion();
                if(this._gt(appReleaseInfo.version,appUpadateStatus.currentAppVersion)){
                    appUpadateStatus.updateAvailable = true;
                    updateStatus.next(appUpadateStatus);
                    updateStatus.complete();
                }
                else{
                    appUpadateStatus.updateAvailable = false;
                    updateStatus.next(appUpadateStatus);
                    updateStatus.complete();
                }
            });
        }
        else if(hasReleaseInfo==="not_available"){
            let appUpadateStatus = new AppUpadateStatus();
            appUpadateStatus.updateAvailable = false;
            updateStatus.next(appUpadateStatus);
            updateStatus.complete();
        }
        else if(hasReleaseInfo==="doesnot_exist"){
            let appUpadateStatus = new AppUpadateStatus();
            appUpadateStatus.updateAvailable = false;
            appUpadateStatus.noInfo = true;
            updateStatus.next(appUpadateStatus);
            updateStatus.complete();
        }
    });
    return updateStatus.asObservable();
  }

  _gt = (v1,v2) => {
    return this._electronInstallerUtil.gt(v1, v2);
  }

  _downloadLatest(downloadNotifierSubject, appUpadateStatus) {
    let url = GitHubReleaseUtil.getLatestReleaseUrl(this.releaseInfo);
    this._gitHubReleaseUtil.getLatestRelease(url, this.releaseInfo).subscribe(response=>{
        if(appUpadateStatus.updateAvailable){
            let appNewVersion = appUpadateStatus.appReleaseInfo.version;
            let appNameWithVersion = this.appName() + "-"+appNewVersion;
            let newAppAsset = this._getAppZipFileAssetInfo(appNameWithVersion,response.assets);
            this._downloadAsset(newAppAsset).subscribe(downloadNotifier=>{
                downloadNotifierSubject.next(downloadNotifier);
            },error=>{},()=>{
                downloadNotifierSubject.complete();
            })
        }
    })
  }

  _getAppZipFileName(appName, version) {
    let appZipName;
    if(this._electronAppUtil.isWindows()){
        appZipName = appName+'-'+version+'-win.zip';
    }
    else if(this._electronAppUtil.isMac()){
        appZipName = appName+'-'+version+'-mac.zip';
    }

    return appZipName;
  }

  _getAppZipFileAssetInfo(appNameWithVersion, assets) {
    let appZipName;
    if(this._electronAppUtil.isWindows()){
        appZipName = appNameWithVersion+'-win.zip';
    }
    else if(this._electronAppUtil.isMac()){
        appZipName = appNameWithVersion+'-mac.zip';
    }
    let appAsset = assets
              .find(asset=>asset.name.toLowerCase()===appZipName.toLowerCase());
    return appAsset;
  }

  _downloadAsset(asset) {
    let downloadUrl = asset.browser_download_url;
    let fileName = asset.name;
    let downloadRelativePath = this._getAppDownloadPath();
    return this._electronInstallerUtil.download(downloadUrl, downloadRelativePath,fileName);
  }

}
