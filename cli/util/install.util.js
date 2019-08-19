const chalk = require('chalk');
const shellJs = require('shelljs');
const clear = require('clear');

module.exports =  {

    basicInstallation: async (args) =>{
        clear();
        await processBasicInstallation(args);
    },
    advancedInstallation: async (args) =>{
        clear();
        await processAdvancedInstallation(args);
    }
}

function processBasicInstallation(args){
    console.log(
        chalk.green("Installing @jsxeu/core  and its dependencies")
    );
    let intallationCmd = "npm install @jsxeu/core";
    shellJs.exec(intallationCmd);
    intallationCmd = "npm install follow-redirects fs-extra jsonfile unzipper";
    shellJs.exec(intallationCmd);
}

function processAdvancedInstallation(args){
    console.log(
        chalk.green("Installing @jsxeu/core  and its dependencies")
    );
    let intallationCmd = "npm install @jsxeu/core";
    shellJs.exec(intallationCmd);
    intallationCmd = "npm install --save-dev @ngxeu/util follow-redirects fs-extra jsonfile unzipper semver";
    shellJs.exec(intallationCmd);
}