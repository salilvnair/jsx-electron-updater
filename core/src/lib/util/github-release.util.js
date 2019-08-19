import { Subject } from 'rxjs';
import { ReactHttpClient } from '@salilvnair/react-httpclient';

export class GitHubReleaseUtil {
  static API_RELEASES_URL = "https://api.github.com/repos/{user}/{repo}/releases";
  static API_LATEST_RELEASE_URL = "https://api.github.com/repos/{user}/{repo}/releases/latest";
  static USER_PLACEHOLDER = "{user}";
  static REPO_PLACEHOLDER = "{repo}";
  _appReleaseInfoFile = "app-release.json";
  githubLatestReleaseInfo;
  httpClient;
  constructor() {
    this.httpClient = new ReactHttpClient();

  }


  static getLatestReleaseUrl(releaseInfo) {
      let latestUrl = GitHubReleaseUtil.API_LATEST_RELEASE_URL;
      latestUrl = latestUrl.replace(GitHubReleaseUtil.USER_PLACEHOLDER,releaseInfo.user);
      latestUrl = latestUrl.replace(GitHubReleaseUtil.REPO_PLACEHOLDER,releaseInfo.repo);
      return latestUrl;
  }

  static getReleasesUrl(releaseInfo) {
      let latestUrl = GitHubReleaseUtil.API_RELEASES_URL;
      latestUrl = latestUrl.replace(GitHubReleaseUtil.USER_PLACEHOLDER,releaseInfo.user);
      latestUrl = latestUrl.replace(GitHubReleaseUtil.REPO_PLACEHOLDER,releaseInfo.repo);
      return latestUrl;
  }

  githubLatestReleasePublisher() {
      return this.githubLatestReleaseInfo.asObservable();
  }

  getLatestRelease(url, releaseInfo) {
      this.githubLatestReleaseInfo = new Subject();
      let observer = null;
      if(releaseInfo.isPrivate) {
          // const tokenSuffix = this.ngxElectronInstallerUtil.decrypt(releaseInfo.user+releaseInfo.repo,releaseInfo.cliEncryptedToken);
          // observer = this.httpClient.get(url,{headers:{'Authorization':'token '+tokenSuffix}});
      }
      else {
          observer = this.httpClient.get(url);
      }
      observer.subscribe((response)=>{
          this.githubLatestReleaseInfo.next(response.data);
      });
      return this.githubLatestReleaseInfo.asObservable();
  }

  hasReleaseInfo(url, releaseInfo) {
      let hasReleaseInfo = new Subject();
      let observer = null;
      if(releaseInfo.isPrivate) {
          // const tokenSuffix = this.ngxElectronInstallerUtil.decrypt(releaseInfo.user+releaseInfo.repo,releaseInfo.cliEncryptedToken);
          // observer = this.httpClient.get(url,{headers:{'Authorization':'token '+tokenSuffix},observe:'response'});
      }
      else {
          observer = this.httpClient.get(url);
      }
      observer.subscribe((response)=>{
          if(response.status==200){
              hasReleaseInfo.next("available");
          }
          else{
              hasReleaseInfo.next("not_available");
          }
      },error=>{
          hasReleaseInfo.next("doesnot_exist");
      });
      return hasReleaseInfo.asObservable();
  }

  getLatestReleaseInfo(url, releaseInfo) {
      let latestReleaseInfo= new Subject();
      this.getLatestRelease(url, releaseInfo).subscribe(releaseResponse=>{
          if(releaseResponse && releaseResponse.assets){
              let releaseAsset = releaseResponse.assets.find(asset=>asset.name===this._appReleaseInfoFile);
              let observer = null;
              if(releaseInfo.isPrivate) {
                  // const tokenSuffix = this.ngxElectronInstallerUtil.decrypt(releaseInfo.user+releaseInfo.repo,releaseInfo.cliEncryptedToken);
                  // observer = this.httpClient.get(releaseAsset.browser_download_url,{headers:{'Authorization':'token '+tokenSuffix}});
              }
              else {
                  observer = this.httpClient.get(releaseAsset.browser_download_url);
              }

              observer.subscribe((response) => {
                  latestReleaseInfo.next(response.data);
                });
          }
      })
      return latestReleaseInfo.asObservable();
  }

  getWebProtocol(url){
      if (url.indexOf("http://") == 0 ) {
          return "http"
      }
      else if(url.indexOf("https://") == 0){
          return "https"
      }
  }

}
