import React from 'react';
import { ElectronUpdaterUtil } from './util/electron-updater.util';

const reactElectronUpdater = releaseInfo =>  ChildComponent => {
  class ComposedComponent extends React.Component {
    _electronUpdaterUtil;
    constructor() {
      super();
      this._electronUpdaterUtil = new ElectronUpdaterUtil(releaseInfo);
    }


    checkForUpdate() {
      console.log("checking for updates...")
      return this._electronUpdaterUtil.checkForUpdate();
    }

    hasPendingUpdates() {
      console.log("checking for pending updates...")
      return this._electronUpdaterUtil.hasPendingUpdates();
    }

    download() {
      console.log("downloading...")
      return this._electronUpdaterUtil.download();
    }

    install() {
      console.log("installing...")
      return this._electronUpdaterUtil.install();
    }

    restart() {
      return this._electronUpdaterUtil.restart();
    }

    reload() {
      return this._electronUpdaterUtil.reload();
    }


    render() {
      return (
        <ChildComponent
            checkForUpdate={() => this.checkForUpdate()}
            download={() => this.download()}
            install={()=>this.install()}
            restart={()=>this.restart()}
            reload={()=>this.reload()}
            hasPendingUpdates={()=>this.hasPendingUpdates()}
            {...this.props}
        />
      );
    }
  }

  return ComposedComponent;
}

export default reactElectronUpdater;
