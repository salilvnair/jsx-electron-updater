const inquirer = require('./inquirer.util');
const chalk = require('chalk');
const shellJs = require('shelljs');
const fs = require('fs');
const clear = require('clear');
const figlet = require('figlet');
var path = require('path');
const jsonfile = require('jsonfile');

module.exports =  {

    createReactElectronApp: async (args,appName) =>{
        clear();
        console.log(
            chalk.green(figlet.textSync('React Electron Fusion', { font:'Doom'}))
        );
        await processCreatingReactElectronFusion(args,appName);
    },
    injectingJsxeuInPackageJson: (args,appName) =>{
        clear();
        console.log(
            chalk.green(figlet.textSync('jsxeu Injection', { font:'Doom'}))
        );
        processInjectingJsxeuInPackageJson(args,appName);
    },
}

async function processInjectingJsxeuInPackageJson(args,appName) {
    let appRootDir = shellJs.pwd()+"";
    setInfoInPackageJson(args,appRootDir);
    console.log(chalk.magenta('\n\njsxeu Build Config Injection completed!!'));
}

async function processCreatingReactElectronFusion(args,appName) {
    if(args['skip-react']){
        console.log(chalk.magenta('\n\nFusing your react app with electron...'));
    }
    else{
        let createNewReactCmd = "npx create-react-app "+appName;
        shellJs.exec(createNewReactCmd);
        console.log(chalk.magenta('\n\nFusing it with electron...'));
        shellJs.cd(appName);
    }
   
    let appRootDir = shellJs.pwd()+"";
    copyDefaultMainTemplateIntoRootDir(args,appRootDir);
    setInfoInPackageJson(args,appRootDir);
    if(args['skip-el']){
        console.log(chalk.red(figlet.textSync('Fused',{font:'Fire Font-k'})));
        process.exit();
    }
    let installElectronCmd = "npm install electron --save-dev";
    shellJs.exec(installElectronCmd);
    let installElectronBuilderCmd = "npm install electron-builder --save-dev";
    shellJs.exec(installElectronBuilderCmd);
    console.log(chalk.red(figlet.textSync('Fused',{font:'Fire Font-k'})));
    process.exit();
}

function setInfoInPackageJson(args,rootDir) {
    let packageJsonPath = path.join(rootDir,"package.json");
    let packageJson = jsonfile.readFileSync(packageJsonPath);
    packageJson.main = "main.js";
    if(!packageJson.devDependencies){
        packageJson.devDependencies = {};
    }
    let existingDevDependencies = packageJson.devDependencies;
    let electronDevDependencies = {};
    if(existingDevDependencies["electron"]){
        electronDevDependencies["electron"] = existingDevDependencies["electron"]+"";
    }
    else{
        electronDevDependencies["electron"] ="^4.0.1";
    }
    if(existingDevDependencies["electron-builder"]){
        electronDevDependencies["electron-builder"] = existingDevDependencies["electron-builder"]+"";
    }
    else{
        electronDevDependencies["electron-builder"] =  "^20.38.2";
    }
    packageJson.scripts["electron"] = "./node_modules/.bin/electron . --dev";   
    if(args.ts){
        packageJson.main = "./dist/main.js";
        packageJson.scripts["build-electron"] = "cd main/core && tsc";
        packageJson.scripts["build-lib"] = "cd main/ts-lib && tsc";
        packageJson.scripts["build"] = "npm run build-lib && npm run build-electron";
        packageJson.scripts["fire"] = "npm run build && npm run electron";
    }
    let jsxeu = {
        app:{
            dependencies: {
                "nedb": "^1.8.0"
            },
            devDependencies: electronDevDependencies,
            rootPath:"../<APP_NAME_STAGING>/electron"
        },
        "app-build":{
            outputPath:"../<APP_NAME_STAGING>/electron",
            packPath:"../<APP_NAME_STAGING>/electron/dist"
        },
        "react-build":{
            outputPath:"../<APP_NAME_STAGING>/react/build/resources/app",
            archivePath:"../<APP_NAME_STAGING>/react",
            packPath:"../<APP_NAME_STAGING>/react/dist"
        }
    }
    packageJson.jsxeu = jsxeu;
    jsonfile.writeFileSync(packageJsonPath,packageJson,{spaces: 2, EOL: '\r\n'});
}

function copyDefaultMainTemplateIntoRootDir(args,rootDir) {
    if(args.ts){
        let electronMainTemplateFile = "electron-main-template.ts";
        let electronMainFile = "main.ts";
        let libFolder = "ts-lib";
        let coreFolder = "core";
        let tsMainPath = path.join(rootDir,"main");
        let libCopyPath = path.join(tsMainPath,libFolder);
        forceCreateDirIfNotExist(libCopyPath);
        let corePath = path.join(tsMainPath,coreFolder);
        forceCreateDirIfNotExist(corePath);
        let electronMainTemplateFilePath = path.join(__dirname,'template',electronMainTemplateFile);
        var mainJsFileContent = fs.readFileSync(electronMainTemplateFilePath, 'utf8');    
        let mainJsCopyPath = path.join(corePath,electronMainFile);
        fs.writeFileSync(mainJsCopyPath,mainJsFileContent);

        let electronTsConfigMainJsPath = path.join(__dirname,'template',"mainjs-tsconfig.json");
        var tsConfigMainJsFileContent = fs.readFileSync(electronTsConfigMainJsPath, 'utf8'); 
        let tsConfigMainJsPath = path.join(corePath,"tsconfig.json");
        fs.writeFileSync(tsConfigMainJsPath,tsConfigMainJsFileContent);

        let electronTsConfigLibJsPath = path.join(__dirname,'template',"tslib-tsconfig.json");
        var tsConfigLibJsFileContent = fs.readFileSync(electronTsConfigLibJsPath, 'utf8'); 
        let tsConfigLibJsPath = path.join(libCopyPath,"tsconfig.json");
        fs.writeFileSync(tsConfigLibJsPath,tsConfigLibJsFileContent);

        let sampleTsPath = path.join(libCopyPath,"sample.ts");
        fs.writeFileSync(sampleTsPath,"");
    }
    else{
        let electronMainTemplateFile = "electron-main-template.js";
        let electronMainFile = "main.js";
        let libFolder = "js-lib";
        let electronMainTemplateFilePath = path.join(__dirname,'template',electronMainTemplateFile);
        var mainJsFileContent = fs.readFileSync(electronMainTemplateFilePath, 'utf8');    
        let mainJsCopyPath = path.join(rootDir,electronMainFile);
        fs.writeFileSync(mainJsCopyPath,mainJsFileContent);
        let libCopyPath = path.join(rootDir,libFolder);
        forceCreateDirIfNotExist(libCopyPath);
    }
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



