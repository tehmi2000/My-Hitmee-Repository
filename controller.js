const connection = require('./config').connection;
const config = require('./config').dropboxConfig;
const mf = require('./modules/myFunctions');

// exports.home = 

exports.drop = (req,res,next)=>{
    
    let dbxRedirect= config.DBX_OAUTH_DOMAIN/ 
    + config.DBX_OAUTH_PATH/
    + "?response_type=code&client_id="+config.DBX_APP_KEY/
    + "&redirect_uri="+config.OAUTH_REDIRECT_URL;
    
    res.redirect(dbxRedirect);
};