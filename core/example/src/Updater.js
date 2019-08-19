import React,{Component} from 'react';

import reactElectronUpdater from 'jsxeu';

class Updater extends Component {

  checkForUpdate = () => {

    this.props.checkForUpdate().subscribe(response=>{
      console.log(response);
    })

  }

  download = () => {
    this.props.download().subscribe(response=>{
      console.log(response);
    })
  }

  install = () => {
    this.props.install().subscribe(response=>{
      console.log(response);
    })
  }

  hasPendingUpdates = () => {
    console.log(this.props.hasPendingUpdates());
  }

  render() {
    return (
      <div>
        <div>
          <input type="button" value="CheckForUpdate" onClick={()=>this.checkForUpdate()}/>
        </div>
        <div>
          <input type="button" value="Download" onClick={()=>this.download()}/>
        </div>
        <div>
          <input type="button" value="Install" onClick={()=>this.install()}/>
        </div>
        <div>
          <input type="button" value="HasPendingUpdates" onClick={()=>this.hasPendingUpdates()}/>
        </div>
      </div>
    )
  }

}

let releaseInfo = {
  user: 'salilvnair',
  repo: 'vdemy',
  appName: 'vdemy'
}

export default reactElectronUpdater(releaseInfo)(Updater);
