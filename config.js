exports.dropboxConfig = {
		DBX_API_DOMAIN : 'https://api.dropboxapi.com',
		DBX_OAUTH_DOMAIN: 'https://www.dropbox.com',
		DBX_OAUTH_PATH: '/oauth2/authorize',
		DBX_TOKEN_PATH: '/oauth2/token',
		DBX_APP_KEY:'axlj06zt6og17pg',
		DBX_APP_SECRET:'lr40o9z94v2n773', 
		OAUTH_REDIRECT_URL:"https://localhost:3000/hitmee_contacts.html"
}

const model = function(){
	const mysql = require('mysql');
	const query_create = "CREATE TABLE users (id INT(100) NOT NULL AUTO_INCREMENT PRIMARY KEY, uID INT(100) NOT NULL, username VARCHAR(255) NOT NULL, password VARCHAR(255) NOT NULL, bio TEXT(500) NOT NULL, telcode VARCHAR(255) NOT NULL, phone VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL, profile_picture VARCHAR(255) NOT NULL) ENGINE=InnoDB  DEFAULT CHARSET=utf8";
	const query_test = "SELECT * FROM users";
	const mailer = require("nodemailer");
	const ePass = {
		user: "fbnquestreminderapp@gmail.com"
	};
	
	Object.defineProperty(ePass, "pass", {
		value: "aaf4a41d0f7c4d3ebbfe3b82d875ec",
		writable: true,
		configurable: true,
		enumerable: true
	});
	
	const transporter = mailer.createTransport({
		host: "smtp.gmail.com",
		port: 465,
		secure: true,
		auth: {
			user: ePass['user'],
			pass: ePass['pass']
		}
	});
	
	// <<<<<<<<<<<<<<<<<<<<<< Local development >>>>>>>>>>>>>>>>>>>>>>>>>>
	
	// const connection = mysql.createConnection({
	// 	host : 'localhost',
	// 	user : 'root',
	// 	password : '',
	// 	database : 'hitmee_db'
	// });
	
	// const MONGO_URL = 'mongodb://localhost:27017';
	
	
	// <<<<<<<<<<<<<<<<<<<<<< Heroku deployment >>>>>>>>>>>>>>>>>>>>>>>>>>
	
	// CLEARDB CONNECTION
	/*
	const connection = mysql.createConnection({
		host : 'us-cdbr-iron-east-02.cleardb.net',
		user : 'bc2161b3129b51',
		password : '84b85f0b',
		database : 'heroku_c5346097c07e3ac'
	});
	*/
	
	// JAWDB CONNECTION
	const connection = mysql.createConnection({
		host: 'qbct6vwi8q648mrn.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
		user : 'fnj34shti3p422g7',
		password: 'keuxufzygeai2zok',
		database: 's0e1xd46txbhy6qi'
	});
	
	// ATLAS CONNECTION STRING
	const MONGO_URL = "mongodb+srv://hItmee_01q7vl99:n6ormXKlEXUarGRB@hitmee-cluster0-smdsp.gcp.mongodb.net/test?retryWrites=true&w=majority";
	
	// MLAB CONNECTION STRING 
	// const MONGO_URL = "mongodb://heroku_01q7vl99:b7215l6q7fol8jk9gk3ss430mv@ds341837.mlab.com:41837/heroku_01q7vl99";
	
	
	return {
		ePass: ePass,
		transporter: transporter,
		connection: connection,
		MONGO_URL: MONGO_URL,
		query_create: query_create,
		query_test: query_test
	};
};

module.exports = model();