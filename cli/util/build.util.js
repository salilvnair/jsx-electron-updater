const inquirer = require('./inquirer.util');
const chalk = require('chalk');
const shellJs = require('shelljs');
const { jsxeu_scripts } = require('../package.json')
const jsonfile = require('jsonfile');
const fs = require('fs');
let jsxeuinclude = require('./jsxeu.util');
var archiver = require('archiver');
const path = require('path');
require('./date.util');
const figlet = require('figlet');
const clear = require('clear');
const rimraf = require('rimraf');
const fsExtra = require("fs-extra");

module.exports =  {

    reactBuild: (args,appName) =>{
        reactBuild(args,appName,'.',false);
    },
    electronBuild:(args,appName,electronPackageJsonPath) =>{
        reactBuild(args,appName,electronPackageJsonPath,true);
    },
    reactPack:async (appName) => {
        await archiveReactBuild(appName);
    },
    moveReactBuildPackage: (args, appName, isElectronBuild) => {
        moveReactBuildPackage(args, appName, isElectronBuild);
    },

    createReleaseInfo: (args, appName) =>{
        let packageJson = jsonfile.readFileSync('./package.json');
        let currentVersion = packageJson.version;
        let appNameZipWithVersion = getAppNameZipWithVersionAndPlatform(appName,packageJson);
        console.log(chalk.green('\nCreating release info for ' +chalk.cyan(appNameZipWithVersion)+' !!')); 
        let releaseDate = new Date().format("dd/mm/yyyy");
        let updateType = "";
        if(args.type||args.t){
            updateType = args.type||args.t;
        }
        let appReleaseInfoPath;
        let releaseType = "react";
        if(updateType==="react"){
            appReleaseInfoPath =  packageJson.jsxeu["react-build"].packPath;
            releaseType = "build";
        }
        else {
            releaseType = "app";
            appReleaseInfoPath =  packageJson.jsxeu["app-build"].packPath;
        }
        appReleaseInfoPath = appReleaseInfoPath+'/app-release.json';

        let releaseInfo = {
            "name" : appName+"",
            "version": currentVersion+"",
            "date":releaseDate+"",
            "type":releaseType+""
        }
        jsonfile.writeFileSync(appReleaseInfoPath,releaseInfo,{spaces: 2, EOL: '\r\n'});  
        console.log(chalk.green('\nRelease info for ' +chalk.cyan(appNameZipWithVersion)+' created successfully!!')); 
        
    },
    
    installElectronBuilderPromt: async (appName) => {
        let answer = await promptElectronBuilderNpmInstall(appName);
        if(answer){
            installElectronBuilder(appName);
            buildElectronApp(appName);
        }
    },

    hasElectronBuilderInstalled() {
        let packageJson = jsonfile.readFileSync('./package.json');
        if(packageJson.devDependencies){
            if(packageJson.devDependencies["electron-builder"]){
                return true;
            }
        }
        return false;
    },
    checkIfElectronProject :async(args, appName) =>{
        if(fs.existsSync('./package.json')){
            if(fs.existsSync('./main.js')){
                return true;
            }
            else{
                console.log(chalk.red.bold('\nCurrent directory is not a valid electron project directory, please choose a proper one!\n'));  
            }
        }
        else{
            console.log(chalk.red.bold('\nCurrent directory is not a npm managed project, please choose a proper one!\n'));  
            return false;
        }

    },
    modifyPackageJson: (args, appName, buildCmd) =>{
        if(args.type||args.t){
            updateType = args.type||args.t;
        }
        upgradePackageVersion(args,appName);
        let packageJson = jsonfile.readFileSync('./package.json');
        modifyAppNamePlaceHolderIfAny(args,appName,packageJson,buildCmd);  
        injectJsxeuBuildScript(packageJson, buildCmd, "./" )    
    },

    prepareReactBuildCmd: (args) => {
        return jsxeu_scripts["react-build"];
    },
    prepareElectronBuildCmd: (args) => {
        let electron_build_cmd;
        let electron_build = jsxeu_scripts["electron-build"];
        let electron_build_debug = jsxeu_scripts["electron-build-debug"];
        let platform = getAppPlatform();
        electron_build_cmd = electron_build + ' --'+platform; 
        if(args.debug){
            electron_build_cmd = electron_build_debug + ' --'+platform; 
        }
        return electron_build_cmd;
    },
    moveAndInstallElectronPackage: (args, appName, electronBuildCmd) => {
        return processMoveAndInstallElectronPackage(args, appName, electronBuildCmd);
    },
    showDefaultBuildConfig: (args, appName) => {
        let includeData = jsxeuIncludeData();
        let finalFilesArray = ["**/*"]
        if(includeData){
            finalFilesArray = finalFilesArray.concat(includeData);
            finalFilesArray.push("!src");
        }
        else{
            finalFilesArray.push("build");
            finalFilesArray.push("!src");
        }
        let defautBuild = {
            "asar":false,
            "appId":appName,
            "productName":appName,
            "files": finalFilesArray,
            "mac": {
            "target": [
                "zip"
            ]
            },
            "win": {
            "target": [
                "zip"
            ]
            }

        }
        console.log(chalk.cyan(JSON.stringify(defautBuild, null, 2)));
    },

    electronBuildPath: (args, appName) =>{
        return getNewElectronPath(appName);
    },

    copyIconToBuild:(args,appName) =>{
        copyIconFileIntoBuildFolder(args,appName);
    }

}

function copyIconFileIntoBuildFolder(args,appName) {
    let iconFile = args.icon||args.i;
    let iconFileName = path.basename(iconFile);
    if(iconFile) {
        let electronAppPath = getNewElectronPath(appName);
        let buildPath = path.resolve(electronAppPath,"build");
        if(fs.existsSync(buildPath)) {
            let newIconPath = path.resolve(buildPath,iconFileName);
            console.log(chalk.green('\nCopying Icon file... ' +chalk.cyan(iconFile)+'.'));
            fsExtra.copySync(iconFile, newIconPath);
        }
    }
}

function getNewElectronPath(appName){
    let packageJson = jsonfile.readFileSync('./package.json');
    return getElectronBuildFolder(appName,packageJson);
}

async function promptElectronBuilderNpmInstall (appName){
    console.log(chalk.underline.red.bold('\nElectron builder dependency is missing in '+chalk.cyan(appName)+'!\n'));
    let message = 'Do you want to install it now?';
    const input = await inquirer.askConfirmationQuestion(message);
    if(input) {           
        return input.question;
    }
}

function injectJsxeuBuildScript(packageJson, buildCmd,packagePath) {
    let packJsonFile = packagePath+"/package.json"
    if(!packageJson){
        packageJson = jsonfile.readFileSync(packJsonFile);
    }
    if(packageJson.scripts){
        packageJson.scripts["jsxeu-build"] = buildCmd;
    }
    else{
        let scripts = {};
        scripts["jsxeu-build"] = buildCmd;
        packageJson.scripts = scripts;
    }
    //console.log(packageJson);
    jsonfile.writeFileSync(packJsonFile,packageJson,{spaces: 2, EOL: '\r\n'});
}

function modifyAppNamePlaceHolderIfAny(args,appName,packageJson,buildCmd){
    let appNamePlaceHolder = "<APP_NAME_STAGING>";
    let appNameVersionValue = appName+"-staging";
    if(packageJson.jsxeu){
        if(packageJson.jsxeu.app){
            packageJson.jsxeu.app.rootPath = packageJson.jsxeu.app.rootPath.replace(appNamePlaceHolder,appNameVersionValue);
        }
        if(packageJson.jsxeu["app-build"]){
            packageJson.jsxeu["app-build"].outputPath = packageJson.jsxeu["app-build"].outputPath.replace(appNamePlaceHolder,appNameVersionValue);
            packageJson.jsxeu["app-build"].packPath = packageJson.jsxeu["app-build"].packPath.replace(appNamePlaceHolder,appNameVersionValue);            
        }
        if(packageJson.jsxeu["react-build"]){
            packageJson.jsxeu["react-build"].outputPath = packageJson.jsxeu["react-build"].outputPath.replace(appNamePlaceHolder,appNameVersionValue);
            packageJson.jsxeu["react-build"].packPath = packageJson.jsxeu["react-build"].packPath.replace(appNamePlaceHolder,appNameVersionValue);
            packageJson.jsxeu["react-build"].archivePath = packageJson.jsxeu["react-build"].archivePath.replace(appNamePlaceHolder,appNameVersionValue);
        }
        jsonfile.writeFileSync('./package.json',packageJson,{spaces: 2, EOL: '\r\n'});
    }

}

function configureBuildCommandInElectronPackageJson(args,appName,packageJson) {
    if(!args['no-default']){
        let includeData = jsxeuIncludeData();
        let finalFilesArray = ["**/*"]
        if(includeData){
            finalFilesArray = finalFilesArray.concat(includeData);
            finalFilesArray.push("!src");
        }
        else{
            finalFilesArray.push("build");
            finalFilesArray.push("!src");
        }
        let defautBuild = {
            "asar":false,
            "appId":appName,
            "productName":appName,
            "files": finalFilesArray,
            "mac": {
                "target": [
                    "zip"
                ]
            },
            "win": {
                "target": [
                    "zip"
                ]
            }
        }
        packageJson.build = defautBuild;
    }
    return packageJson;
}

function installElectronBuilder(appName) {
    console.log(chalk.green('\ninstalling... electron-builder in ' +chalk.cyan(appName)+' app.'));
    let electronBuildInstallCmd = 'npm install --save-dev electron-builder'
    shellJs.exec(electronBuildInstallCmd);
}

function buildElectronApp(appName) {
    console.log(chalk.green('\nPackaging... ' +chalk.cyan(appName)+' app.'));
    let runElectronBuild = "npm run jsxeu-build";
    shellJs.exec(runElectronBuild);
}

function jsxeuIncludeData(){
    if(jsxeuinclude.parse('./.jsxeuinclude')){
        return jsxeuinclude.parse('./.jsxeuinclude').patterns;
    }
    else{
        return null;
    }
}

async function archiveReactBuild(appName){
    let packageJson = jsonfile.readFileSync('./package.json');
    let srcFolder = getReactArchiveSourcePathFolder(appName,packageJson);
    let zipRelativePath = getReactPackFolder(appName,packageJson);
    await archive(srcFolder,zipRelativePath);
    rimraf.sync(srcFolder);
}

function getReactArchiveSourcePathFolder(appName,packageJson) {
    return getJsxeu(appName,packageJson)["react-build"].archivePath;
}

function getReactPackFolder(appName,packageJson) {
    let destPath =  getJsxeu(appName,packageJson)["react-build"].packPath;
    forceCreateDirIfNotExist(destPath);
    let packRelativePath = getAppZipFileFullPath(appName,destPath);
    return packRelativePath;                
}

function getElectronBuildFolder(appName,packageJson) {
    return getJsxeu(appName,packageJson).app.rootPath
}

function getJsxeu(appName,packageJson) {
    return packageJson.jsxeu;
}

function getAppZipFileFullPath(appName,destPath,packageJson){
    let appZipName = getAppNameZipWithVersionAndPlatform(appName,packageJson);
    destPath = destPath+"/"+appZipName;
    return destPath;
}

function getAppPlatform() {
    if(this.process.platform==='win32'){
        return "win";
    }
    else if(this.process.platform==='darwin'){
       return "mac";
    }
    else{
        return "unknown"
    }
}

function getAppNameZipWithVersionAndPlatform(appName,packageJson){
    if(!packageJson){
        packageJson = jsonfile.readFileSync('./package.json');
    }
    let appNameWithVersion = appName+"-"+packageJson.version;
    let appZipName;
    if(this.process.platform==='win32'){
        appZipName = appNameWithVersion+'-win.zip';
    }
    else if(this.process.platform==='darwin'){
        appZipName = appNameWithVersion+'-mac.zip';
    }
    return appZipName;
}

function forceCreateDirIfNotExist(dir) {
    if (fs.existsSync(dir)) {
      return;
    }
    try {
      fs.mkdirSync(dir);
    } catch (err) {
      if (err.code==="ENOENT") {
        forceCreateDirIfNotExist(path.dirname(dir)); //create parent dir
        forceCreateDirIfNotExist(dir); //create dir
      }
    }
}

function upgradePackageVersion(args,appName){
    let tempPath = shellJs.pwd();
    clear();
    let packageJsonFile = "./package.json";
    let updateType;
    let buildType;
    if(args.type||args.t){
        updateType = args.type||args.t;
    }
    if(updateType==="react"){
        buildType="build";
    }
    else{
        buildType="app";
    }
    let figi = 'Building '+ appName;
    console.log(`${chalk.red(figlet.textSync(figi, { font:'Doom'}))}\n${chalk.yellow.bold('Type :')} ${chalk.blue.bold(buildType)}
            `);
    if(args.pack||args.p){
        let version = args.pack||args.p;
        let packageJson = jsonfile.readFileSync(packageJsonFile);
        if(version){
            packageJson.version = version;
            console.log(chalk.green('\nBuild app using the version ' +chalk.cyan(packageJson.version)+'.'));
            jsonfile.writeFileSync(packageJsonFile,packageJson,{spaces: 2, EOL: '\r\n'}); 
        }
        else{
            console.log(chalk.green('\nBuild app using the version ' +chalk.cyan(packageJson.version)+'.')); 
        } 
    }
    else{
        if(args.bump||args.b){
            let bumpVal = args.bump||args.b;
            if(bumpVal===true){
                bumpVal = "patch";
            }
            console.log(chalk.green('\nBumping the version...'));
            let updateVersionCmd = "npm version "+bumpVal;
            shellJs.exec(updateVersionCmd);
        }
    }
    shellJs.cd(tempPath);
}

function reactBuild(args,appName,pkgJsonFilePath,cont) {
    let tempPath = shellJs.pwd();
    if(!cont) {
        console.log(chalk.green('\nBuilding... ' +chalk.cyan(appName)+'.'));
    }
    else{
        console.log(chalk.green('\nPackaging... ' +chalk.cyan(appName)+'.'));
    }
    console.log(pkgJsonFilePath);
    shellJs.cd(pkgJsonFilePath);
    let runJsxeuBuild = "npm run jsxeu-build";
    if (shellJs.exec(runJsxeuBuild).code !== 0) {
        console.log(chalk.underline.red.bold('\nPackaging Failed... '));
        process.exit();
    }    
    shellJs.cd(tempPath);
}

function processMoveAndInstallElectronPackage(args, appName, electronBuildCmd){
    let newElectronRootPath = processElectronAsSeperateApp(args, appName, electronBuildCmd);
    installElectronApp(newElectronRootPath);
    return newElectronRootPath;
}

function processElectronAsSeperateApp(args, appName, electronBuildCmd) {
    let packageJson = jsonfile.readFileSync('./package.json');
    let newElectronRootPath = getElectronBuildFolder(appName,packageJson);
    forceCreateDirIfNotExist(newElectronRootPath);
    let jsxeu = getJsxeu(appName,packageJson);
    console.log(chalk.green('\nConfiguring the electron...'));
    packageJson.devDependencies = jsxeu.app.devDependencies;
    packageJson.dependencies = jsxeu.app.dependencies;
    packageJson = configureBuildCommandInElectronPackageJson(args, appName,packageJson);
    injectJsxeuBuildScript(packageJson,electronBuildCmd,newElectronRootPath);
    var mainJsFileContent = fs.readFileSync('./main.js', 'utf8');
    let mainJsCopyPath = path.join(newElectronRootPath,"main.js");
    fs.writeFileSync(mainJsCopyPath,mainJsFileContent);
    let libCopyPath = path.join(newElectronRootPath,"js-lib");
    if(fs.existsSync("./js-lib")){
        fsExtra.copySync("./js-lib", libCopyPath);
    }
    return newElectronRootPath;
}

function installElectronApp (newElectronRootPath) {
    let tempPath = shellJs.pwd();
    shellJs.cd(newElectronRootPath);
    shellJs.rm('-rf', './node_modules');    
    let intallationCmd = "npm install";
    shellJs.exec(intallationCmd);
    console.log(chalk.yellow('\nInstalling '+chalk.cyan('electron')+' ,'+chalk.cyan('electron builder')+' and other app dependencies.'));
    intallationCmd = "npm install @ngxeu/util follow-redirects fs-extra jsonfile unzipper semver";
    shellJs.exec(intallationCmd);
    shellJs.cd(tempPath);
}

function moveReactBuildPackage(args, appName, isElectronBuild) {
    console.log(chalk.yellow('\nMoving react final build to configured folder.'));
    let packageJson = jsonfile.readFileSync('./package.json');
    let reactBuildConfigPath;
    if(isElectronBuild) {
        reactBuildConfigPath =  getJsxeu(appName,packageJson)["app-build"].outputPath;
    }
    else {
        reactBuildConfigPath =  getJsxeu(appName,packageJson)["react-build"].outputPath;
    }

    console.log(chalk.green(reactBuildConfigPath));
    let tempPath = shellJs.pwd();
    console.log(chalk.green(tempPath));
    shellJs.mkdir('-p', reactBuildConfigPath);
    shellJs.mv('build', reactBuildConfigPath);
}

function archive(srcFolder,zipRelativePath) {
    const archive = archiver('zip', { zlib: { level: 9 }});
    const stream = fs.createWriteStream(zipRelativePath);
  
    return new Promise((resolve, reject) => {
      archive
        .directory(srcFolder, false)
        .on('error', err => reject(err))
        .pipe(stream)
      ;
  
      stream.on('close', () => {        
        let fileName = path.basename(zipRelativePath);
        let dir = path.dirname(zipRelativePath);
        let existingDir = shellJs.pwd();
        shellJs.cd(dir);
        let zipFullPath = shellJs.pwd();
        shellJs.cd(existingDir);
        console.log(chalk.green('\nPackage '+chalk.cyan(fileName)+' created at '+chalk.cyan(zipFullPath) +' successfully!!'));    
        resolve()
      });
      archive.finalize();
    });
}