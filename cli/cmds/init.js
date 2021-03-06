const github = require('../util/github-inquirer.util');
const chalk = require('chalk');
module.exports = async (args) => {
    try {
        //console.log(args)
        if(args.list||args.l){
            console.log(chalk.cyan(JSON.stringify(github.getAllConfigData(), null, 2)));
            process.exit();
        }
        if(!args._[1]){
            console.log(chalk.red('\nError:App name is not specified please specify using command:')+' jsxeu init '+chalk.cyan('MyApp'));
            process.exit();
        }
        let appName = args._[1];
        if(args.clear||args.c){
            github.deleteStoredGithubToken(appName);
            github.deleteStoredRepoDetails(appName);
            console.log(chalk.green('cleared access token and repo details!'));
            process.exit();
        }
        if(args['clear-token']||args.ct){
            github.deleteStoredGithubToken(appName);
            github.deleteStoredRepoDetails(appName);
            console.log(chalk.green('cleared access token details!'));
            process.exit();
        }
        if(args['clear-repodetails']||args.cr){
            github.deleteStoredGithubToken(appName);
            github.deleteStoredRepoDetails(appName);
            console.log(chalk.green('cleared repo details!'));
            process.exit();
        }
        await getGitHubAccessToken(appName);
        await getGitHubRepositoryDetails(appName);

    } catch (err) {
      console.error(err)
    }
  }
  let getGitHubAccessToken = async(appName) =>{
    // Check if access token for ginit was registered
    let accessToken = github.getStoredGithubToken(appName);
    if(!accessToken && accessToken!='') {
        console.log(chalk.red('No access token has been found please set one!'));
        // ask user to generate a new token
        accessToken = await github.generateNewToken(appName);
        return accessToken;
    }
    else{
        console.log(chalk.yellow('Existing token found: ') + chalk.cyan(accessToken));
    }
    return accessToken
}

let getGitHubRepositoryDetails = async(appName) =>{
    // Check if access token for ginit was registered
    let repoDetails = github.getStoredRepoDetails(appName);
    if(!repoDetails) {
        console.log(chalk.red('Repo details not found please set one!'));
        // ask user to generate a new token
        repoDetails = await github.generateRepositoryDetails(appName);
        return repoDetails;
    }
    else{
        console.log(chalk.yellow('Existing repo details found: ') + chalk.cyan(JSON.stringify(repoDetails)));
    }
    return repoDetails
}