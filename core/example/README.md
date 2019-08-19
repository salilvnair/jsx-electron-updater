# React Higher Order Component Example

> React electron updater HOC to update electron fused react desktop apps.

[![NPM](https://img.shields.io/npm/v/@jsxeu/core.svg)](https://www.npmjs.com/package/@jsxeu/core) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save @jsxeu/core
```

## Usage

```jsx
import React, { Component } from 'react'

import reactElectronUpdater from '@jsxeu/core'

class MyApp extends Component {

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

  render () {
    return (
      .....

    )
  }
}
const releaseInfo = {
  user: 'salilvnair',
  repo: 'myrepo',
  appName: 'myapp'
};

export default reactElectronUpdater(releaseInfo)(MyApp);

```

## License

MIT © [salilvnair](https://github.com/salilvnair)
