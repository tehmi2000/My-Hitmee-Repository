exports.dropboxConfig = {
		DBX_API_DOMAIN : 'https://api.dropboxapi.com',
		DBX_OAUTH_DOMAIN: 'https://www.dropbox.com',
		DBX_OAUTH_PATH: '/oauth2/authorize',
		DBX_TOKEN_PATH: '/oauth2/token',
		DBX_APP_KEY:'axlj06zt6og17pg',
		DBX_APP_SECRET:'lr40o9z94v2n773', 
		OAUTH_REDIRECT_URL:"https://localhost:3000/hitmee_contacts.html"
};

const model = function(){
	const queryCreate = "CREATE TABLE users (id INT(100) NOT NULL AUTO_INCREMENT PRIMARY KEY, uID INT(100) NOT NULL, username VARCHAR(255) NOT NULL, password VARCHAR(255) NOT NULL, bio TEXT(500) NOT NULL, telcode VARCHAR(255) NOT NULL, phone VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL, profile_picture VARCHAR(255) NOT NULL) ENGINE=InnoDB  DEFAULT CHARSET=utf8";
	const queryTest = "SELECT * FROM users";

    const fs = require("fs");
    const mysql = require("mysql");
    const MONGO_CLIENT = require("mongodb").MongoClient;
    const ObjectID = require("mongodb").ObjectId;
    const sgMail = require('@sendgrid/mail');
	
	// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    // LOCALHOST CONNECTION
    // const connection = mysql.createConnection({
	// 	host : 'localhost',
	// 	port : 3306,
	// 	user : 'root',
	// 	password : '',
	// 	database : 'hitmee_db'
	// });
    
    // const MONGO_URL = "mongodb://localhost:27017";
    
    // JAWDB MYSQL CONNECTION
    const connection = mysql.createConnection({
    	host: "qbct6vwi8q648mrn.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
    	port: 3306,
    	user: process.env.MYSQL_USER,
    	password: process.env.MYSQL_PASS,
    	database: "s0e1xd46txbhy6qi"
    });
    
    // ATLAS MONGODB CONNECTION
    const MONGO_URL = process.env.MONGO_CONNECTION_STRING;

    const mOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true
    };

    const mongoConn = MONGO_CLIENT.connect(MONGO_URL, mOptions);


	const log = function(err) {
		let content = `${(new Date).toUTCString()}: ${JSON.stringify(err)}` + "\n";
		fs.appendFile("./stderr.log", content, function(err) {
			if(err){
				console.log(err);
			}
		});
		
		console.error(err);
	};

	const MongoErrorHandler = function(error){
		log(error);
		throw error;
	};
	
	const MysqlErrorHandler = function(error){
		log(error);
		throw error;
	};
	
	const checkTable = (test, create) => {
		try {
			connection.query(test, function (err) {
				if (err) {
					connection.query(create, function (err) {
						if (err) {
							log(err);
						} else {
							console.log("Mysql database is initialized and ready");
						}
					});
				} else {
					console.log("Connection to database is successful!");
				}
			});
		} catch (error) {
			log(error);
		}
	}

	const userTableExist = () => {
		const queryCreate = "CREATE TABLE users (id INT(100) NOT NULL AUTO_INCREMENT PRIMARY KEY, uID VARCHAR(100) NOT NULL, username VARCHAR(255) NOT NULL, password VARCHAR(255) NOT NULL, firstname VARCHAR(255) NOT NULL, lastname VARCHAR(255) NOT NULL, telcode VARCHAR(255) NOT NULL, phone VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL, address VARCHAR(255) NOT NULL, profile_picture VARCHAR(255) NOT NULL, verification_status BOOLEAN) ENGINE=InnoDB  DEFAULT CHARSET=utf8";
		const queryTest = "SELECT * FROM users LIMIT 1";
		checkTable(queryTest, queryCreate);
    };

    return {
        log,
        ObjectID,
        sqlConn: connection,
        mongoConn,
        userTableExist,
		sgMail,
		MysqlErrorHandler,
		MongoErrorHandler
    };
};

module.exports = model();