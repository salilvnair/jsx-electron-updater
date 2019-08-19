const buildUtil = require('../util/build.util');
const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
module.exports = async (args) => {
    if(!args._[1]){
        console.log(chalk.red('\nError:App name is not specified please specify using command:')+' jsxeu build '+chalk.cyan('MyApp'));
        process.exit();
    }
    
    let appName = args._[1];

    if(args["show-default"]){
        buildUtil.showDefaultBuildConfig(args, appName);
        process.exit();
    }
    
    if(!args.type && !args.t){
        console.log(chalk.red('\nError:Build type is not specified please specify using command:')+' jsxeu build MyApp'+chalk.cyan(' --type=react or --type=electron or --type=e'));
        process.exit();
    }
    else {
        let buildType = args.type||args.t;
        if(!buildType==='react'
            && !buildType==='electron'&& !buildType==='e'){
            console.log(chalk.red('\nError:Build type should be one of these:')+chalk.cyan('--type=react or --type=electron or --type=e'));
            process.exit();
        }
    }

    if(!await processBuild(args, appName)){
        require('./help')(args);
        process.exit();
    }
}

async function processBuild(args, appName) {
    let buildType = args.type||args.t;
    clear();
    if(buildType==='electron'||buildType==='e'){
        await processElectronBuild(args, appName);
    }
    else {
        await processReactBuild(args, appName);
    }
    return true;
}

async function processReactBuild(args, appName) {
    let reactBuildCmd = buildUtil.prepareReactBuildCmd(args, appName);
    //console.log(electronBuildCmd);
    if(reactBuildCmd){
        buildUtil.modifyPackageJson(args, appName, reactBuildCmd);
        buildUtil.reactBuild(args,appName);
        await buildUtil.reactPack(appName);
        buildUtil.createReleaseInfo(args,appName);
        return true;
    }
    else{
        return false;
    }
}
 async function processElectronBuild(args, appName) {
    let isElectronProject = await buildUtil.checkIfElectronProject(args, appName);
    if(!isElectronProject){
        process.exit();
    }
     if(!args["skip-react-build"]){
        let reactBuildCmd = buildUtil.prepareReactBuildCmd(args, appName);
        buildUtil.modifyPackageJson(args, appName, reactBuildCmd);
        buildUtil.reactBuild(args,appName);
        buildUtil.moveReactBuildPackage(args, appName, true);
        let electronBuildCmd = buildUtil.prepareElectronBuildCmd(args, appName);
        buildUtil.moveAndInstallElectronPackage(args,appName,electronBuildCmd); 
        if(args.icon||args.i){
            buildUtil.copyIconToBuild(args, appName); 
        }
    }
    if(args.pack||args.p){
        console.log(chalk.red(figlet.textSync('Packaging '+appName,{ font:'Doom'})));
        let electronPackageJsonPath = buildUtil.electronBuildPath(args,appName);
        buildUtil.electronBuild(args,appName,electronPackageJsonPath);
        buildUtil.createReleaseInfo(args,appName);  
        console.log(chalk.green(figlet.textSync('\nFinished!!!',{ font:'Doom'})));       
    }
    return true;
}
