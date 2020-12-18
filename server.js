'use strict';
//const server = require('https').createServer(certConfig, app);
// const certConfig = require('./modules/certificate').config;
const controller = require('./controller');
const appDBConfig = require("./config");
// const emailer = require("./modules/emailHandler");
const mf = require('./modules/myFunctions');

const fs = require('fs');
const path = require("path");
const express = require('express');
const app = express();
const { userTableExist, mongoConn, log, MongoErrorHandler, sqlConn } = appDBConfig;
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const PORT = (process.env.PORT == "" || process.env.PORT == null)? 3000 : process.env.PORT;
const usersOnline = [];
const url = appDBConfig.MONGO_URL;
const files = {};
const fileStructure = {
    name: null,
    type: null,
    size: null,
    data: [],
    slice_count: 0
};
const sessSecret = {
    secret: 'shh...its a secret',
    resave: true,
    saveUninitialized: true
};

console.log("Connecting to mysql server...");

sqlConn.connect(function (err) {
    if (err) {
        log(err);
    } else {
        console.log('Connected to mysql server!');
        console.log("Checking for mysql initialization requirements...");

        userTableExist();
    }
});

console.info('Web server started');

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(session(sessSecret));
app.use(fileUpload());

console.log("Serving files from -- Project Folder: ",__dirname);

app.get('/', function(req, res){
    res.redirect("/login");
});

app.post('/admin', (req, res)=>{
    const formatName = function (str){
        let formattedString = (str.charAt(0)).toUpperCase()+(str.substring(1)).toLowerCase();
        console.log(formattedString);
        return formattedString;
    };

    const accessFolder = function () {
        var uploadPath = path.join(__dirname, 'public/uploads/');

        try {

            fs.access(uploadPath + req.session.username, fs.constants.F_OK, (err)=>{
                if(err){
					
                    try{
                        fs.mkdir(uploadPath + req.session.username, (err)=>{console.log(err);});
                    }catch(e){
                        console.log('e');
                    }

                }
            });

            fs.access(uploadPath + req.session.username +'/dp', fs.constants.F_OK, (err)=>{
                if(err){

                    try{
                        fs.mkdir(uploadPath + req.session.username +'/dp', (err)=>{console.log(err);});
                    }catch(e){
                        console.log('e');
                    }

                }
            });

            fs.access(uploadPath + req.session.username +'/wp', fs.constants.F_OK, (err)=>{
                if(err){

                    try{
                        fs.mkdir(uploadPath + req.session.username + '/wp', (err)=>{console.error(err);});
                    }catch(e){
                        console.log('e');
                    }
                }
            });

        } catch (err) {
            console.log(err);
        }
    };

    const createNewAccount = function (type) {
        const sid = Math.ceil(Math.random()*10e8);
        let query = "INSERT INTO users (uID, username, password, bio, telcode, phone, email, profile_picture) VALUES ('"+sid.toString()+"', '"+userUsername+"', '"+mf.encrypt(userPassword)+"', 'I am  new to Hitmee', '+234', '"+user_phone.toString()+"', '"+user_email.toString()+"', 'images/contacts-filled_e.png')";

        sqlConn.query(query, function (err) {
            if(err) log(err);

            console.log('New user details uploaded successfully!');
            // emailer.sendVerificationMail(user_email).then(function(response){
            //     console.log("Sending Verification Email..");
            //     console.log(response);
            // }).catch(function(err){
            // 	console.log(err)
            // });
        });


        mongoConn.then(client => {

            let doc = [{chatwall: "assets/images/Hitmee_default_wallpaper.png"}];
            let collection = client.db(`${userUsername}`).collection('settings');
            collection.insertMany(doc, (err)=>{
                if (err) log(err);
            });
            
            // client.close();

        }).catch(err => {
            console.log("Inserting wallpaper went wrong"); 
			MongoErrorHandler(err);
		});

        if (mf.searchArrayFor(usersOnline, userUsername).found==false){

            usersOnline.push({
                uID : sid,
                sock: '',
                username: userUsername,
                profile_picture : "../assets/images/contacts-filled_e.png"
            });

            mongoConn.then(client => {
                let doc =   {
                    username : userUsername,
                    uID : sid,
                    sock: '',
                    status: '',
                    time_stamp: '',
                    username: userUsername,
                    profile_picture : '../assets/images/contacts-filled_e.png'
                };
        
                let collection = client.db("usersOnline").collection("all");
        
                collection.insertOne(doc, function(err){});
                // client.close();
    
            }).catch(err => {
                MongoErrorHandler(err);
            });

            io.sockets.emit('newconnect', {
                username: userUsername,
                uID : sid,
                profile_picture : '../assets/images/contacts-filled_e.png'
            });
        }

        let VALIDATION_COMPLETE = true;
        req.session.username = userUsername;
        accessFolder();
        res.cookie('hitmee-id', sid);
        res.cookie('hitmee-username', userUsername);
        res.cookie('hitmee-val', VALIDATION_COMPLETE, {maxAge:300000});

        if(type){
            res.redirect(`/success_fail.html?sess=${mf.genHex()}&redirect=home`);
        }else{
            res.json({
                status: "ok",
                statusCode: 200,
                redirectUrl: `/success_fail.html?sess=${mf.genHex()}&redirect=home`
            });
        }
        
    };

    const login = function (usersDBdata, type){
        let VALIDATION_COMPLETE = false;
        if (userPassword === mf.decrypt(usersDBdata.password)){

            if (mf.searchArrayFor(usersOnline, userUsername).found == false && !req.session.username){
                usersOnline.push({
                    uID : usersDBdata.uID,
                    sock: '',
                    username: userUsername,
                    profile_picture : usersDBdata.profile_picture
                });

                io.sockets.emit('newconnect', {
                    username: userUsername, 
                    uID : usersDBdata.uID, 
                    profile_picture : usersDBdata.profile_picture
                });
            }

            VALIDATION_COMPLETE = true;
            req.session.username = userUsername;
            accessFolder();
            res.cookie('hitmee-id', usersDBdata.uID);
            res.cookie('hitmee-username', userUsername);
            res.cookie('hitmee-val', VALIDATION_COMPLETE,{maxAge:300000});
            if(type){
                res.redirect(`/success_fail.html?sess=${mf.genHex()}&redirect=home`);
            }else{
                res.json({
                    status: "ok",
                    statusCode: 200,
                    redirectUrl: `/success_fail.html?sess=${mf.genHex()}&redirect=home`
                });
            }
        
            console.log("Sent");

        // Mismatched password...
        }else {
            VALIDATION_COMPLETE = false;
            res.cookie('hitmee-val', VALIDATION_COMPLETE, {maxAge:300000});
            // res.redirect('/?error=novalidid');
            if(type){
                res.redirect(`/login?sess=${mf.genHex()}&redirect=home`);
            }else{
                res.json({
                    status: "fail",
                    statusCode: 401
                });
            }
            
            console.log('Password Mismatch for '+userUsername+'\n\n');
        }
    };

    const userPassword = req.body['password'];
    const userUsername = formatName(req.body["username"]);
    const user_phone = req.body['phone-number'] || '08000000000';
    const user_email = req.body.email || 'example@coolmail.com';
    const userType = req.body.noscript;
    let query = `SELECT * FROM users WHERE username = '${userUsername}'`;

    console.log(req.body);

    sqlConn.query(query, function (err, [results]) {
        if(err) log(err);

        if(results){
            console.log('calling login...');
            login(results, userType);
        }else{
            console.log('calling createNewAccount...');
            createNewAccount(userType);
        }
    });
});

app.get('/logout', (req, res)=>{
    let divId;

    // Remove user from usersOnline array
    for (let i = 0 ; i < usersOnline.length ; i++) {
        if (usersOnline[i].username == req.session.username) {
            divId=usersOnline[i].uID;
            usersOnline.splice(i, 1);
            break;
        }
    }
    
    var date = new Date();
    var timeString = mf.formatTime(date.getHours(), date.getMinutes());
    var username = `${req.session.username}`;

    // Update users unline status to offline

    mongoConn.then(client => {

        let collection = client.db("usersOnline").collection("all");
        collection.updateMany({"username": username},{$set:{"status": "offline", "time_stamp": timeString}}, function(err){
            if (err) console.log(err);
        });
        // client.close();
            
    }).catch(err => {
        MongoErrorHandler(err);
    });

    io.emit("offline", "offline", timeString);


    // Clear users session data
    req.session.destroy(function(err) {
        if(err){
            console.log(err);
        }else{
            io.emit('logged out', divId);
            // io.emit('receiveOnlineUsers', usersOnline);
            // Clear all cookies used on logout
            res.clearCookie("hitmee-username");
            res.clearCookie("hitmee-id");
            res.clearCookie("hitmee-val");
            res.redirect("/login");
        }
    });

});

app.post('/update_settings',(req, res)=>{
    if(req.session.username != undefined || req.session.username!=null){

        if(req.body.bio){
            let query = "UPDATE users SET bio = \""+req.body.bio+"\" WHERE username = '"+req.session.username+"'";
            sqlConn.query(query, function(err) {
                if (err) throw err;
            });
        }

        if(req.body.email){
            let query = `UPDATE users SET email = '${req.body.email}' WHERE username = '${req.session.username}'`;
            sqlConn.query(query, function(err) {
                if (err) throw err;
            });
        }

        if(req.body.phone_no && req.body.tel_code){
            let query1 = `UPDATE users SET phone = '${req.body.phone_no}' WHERE username = '${req.session.username}'`;
            sqlConn.query(query1, function(err) {
                if (err) throw err;
            });

            let query2 = `UPDATE users SET telcode = '${req.body.tel_code}' WHERE username = '${req.session.username}'`;
            sqlConn.query(query2, function(err) {
                if (err) throw err;
            });
        }

        if(req.files){
            if(Object.keys(req.files).length==0){
                res.redirect('/home');
            }else{
                for (const key in req.files) {
                    var uploadPath = __dirname + '/public/Uploads/';

                    switch(key){

                        case 'picture_upload':
                            var sampleFilep = req.files[key];
							let sampNamep = uploadPath + req.session.username + '/dp/';
                            let extensionp = sampleFilep.name.split('.')[1];
                            
                            sampleFilep.mv(sampNamep + sampleFilep.name, function(err) {
                                if(err){
                                    throw err;
                                }else{
                                	fs.rename(sampNamep + sampleFilep.name, sampNamep + req.session.username + '_dp.' + extensionp, (err)=>{
                                		if (err) throw err;
                                	});
                                    update_pp(req.session.username, sampNamep + req.session.username + '_dp.' + extensionp);
                                    let query = "UPDATE users SET profile_picture = './Uploads/"+req.session.username+"/dp/"+ req.session.username + "_dp." + extensionp + "' WHERE username = '"+req.session.username+"'";
                                    sqlConn.query(query, function(err) {
                                        if (err) throw err;
                                    });
                                    console.log('uploaded')
                                }

                            });
                            break;

                        case 'wp_upload':
                            var sampleFilew = req.files[key];
							var sampName = uploadPath + req.session.username + '/wp/';
							let extensionw = sampleFilew.name.split('.')[1];
							
                            sampleFilew.mv(sampName + sampleFilew.name, function(err) {
                                if(err) {
                                	throw err;
                                }else{
                                
                                	fs.rename(sampName + sampleFilew.name, sampName + req.session.username + '_wp.' + extensionw, (err)=>{
                                		if (err) throw err;
                                	});
                                	
                                	mongoConnConn.connect(url, {useNewUrlParser: true}, (err, client)=>{
                                		if (err) {
                                			MongoErrorHandler(err);
                                		}else{
                                			let doc = [{chatwall: null}];
                                	
                                			let collection = client.db(`${req.session.username}`).collection('settings');
                                	
                                			collection.updateOne({}, {$set: {"chatwall": 'Uploads/' + req.session.username + '/wp/' + req.session.username + '_wp.' + extensionw}});
                                			// client.close();
                                		}
                                	});
                                }
                            });
                            break;
                    }
                }
            }
        }
		try{
			res.redirect('/home');
		}catch(e){
			console.table(e);
		}

    }else{
    	try{
        	res.redirect('/');
        }catch(e){
        	console.error(e);
        }
    }

});

app.get('/destroy_account', (req, res)=>{
    console.info('Destroying account...');
    if(req.session.username){
        des_username = req.session.username;
        let query = "DELETE FROM users WHERE username='"+des_username+"'";
        sqlConn.query(query, (err)=>{
            if(err) throw err;
            console.log('Destroyed sql database...');
        });

        mongoConnConn.connect(url, {useNewUrlParser: true}, (err, client)=>{
            if (err) MongoErrorHandler(err);

            let db = client.db(`${des_username}`);
            db.dropDatabase((err)=>{
                if(err) console.info(err);
            });
            console.log('Destroyed mongoConndb database.');
            // client.close();
        });
        
        var divId;

        for (let i = 0 ; i < usersOnline.length ; i++) {
        	if (usersOnline[i].username==req.session.username) {
        		divId=usersOnline[i].uID;
        		usersOnline.splice(i, 1);
        		break;
        	}
        }

        req.session.destroy(function(err) {
            if(err){
                console.error(err);
            }else{
                io.emit('logged out', divId);
                io.emit('receiveOnlineUsers', usersOnline);
                res.redirect("/?destroy_account=acknowledged&redirectedToLogin=true&oldAccount="+des_username);
            }
        });
    }else{
        res.redirect("/");
    }
});

app.get("/api/:username/getFriends", function(req, res) {
    let username = req.params.username;
    // mongoConn.connect(url, {useNewUrlParser: true}, (err, client)=>{
    // 	if (err) {
    //		MongoErrorHandler(err);
    //	}else{
    
    // 	var collection = client.db(`${username}`).collection('Friends');
    
    // 	collection.find().toArray((err, result)=>{
    // 		if (err) throw err;
    // 		console.log(result);
    // 		//socket.emit("set preferences", result);
    // 	});
        
    //	client.close();
    //	}
    // });

    console.time("all-user-request-timer");
    if (req.session.username === username) res.json(usersOnline);
    else res.json([]);
    console.timeEnd("all-user-request-timer");
    console.log();
});

const update_pp = function(username, imageName){
    // update profile_picture in usersOnline
    var searchResult1 = mf.searchArrayFor(usersOnline, username);
    if (searchResult1.found==true){
        usersOnline[searchResult1.index].profile_picture='./Uploads/'+username+'/dp/'+imageName;
    }
    
    mongoConn.connect(url, {useNewUrlParser: true}, (err, client)=>{
    	if (err) {
    		MongoErrorHandler(err);
    	}else{
    
    		let collection = client.db("usersOnline").collection("all");
    
    		collection.updateOne({"username": username},{$set:{"profile_picture": './Uploads/'+username+'/dp/'+imageName}}, function(err){
    			if (err) console.log(err);
    		});
    		
    		// client.close();
    	}
    });
}

const readFile = function(path, req, res) {
    fs.readFile(path, "utf8", function(err, content) {
        if (err) {
            throw err;
        } else {
            res.setHeader('Content-Type', 'text/html');
            res.end(content);
        }
    });
};

io.on('connection', function(socket) {
    socket.broadcast.emit("receive presence", "online", 0);
	socket.on('check existing', function(username){
        /** Executed when the user is logging in... */
        console.time("check-existing-user-timer");
		try{
			let query = `SELECT username FROM users WHERE username = '${username}'`;
			sqlConn.query(query, function (err, result) {
		
				if (err) throw err;
				
                if(result.length > 0) socket.emit('existing', true, username);
                else socket.emit('existing', false, username);
            });
            
		}catch(err){
			console.error(err);
		}
        console.timeEnd("check-existing-user-timer");
        console.log();
	});

    socket.on('update socketID', function(data) {
        console.time("update-user-socket-timer");

        console.log("updating socket for "+data+"...\n\n");
        mongoConn.then(client => {
        	let collection = client.db("usersOnline").collection("all");
        
        	collection.updateMany({"username": data},{$set:{"sock": socket.id, "status": "online"}}, function(err){
        		if (err) console.log(err);
            });
            
        	// client.close();
        }).catch(err => {
            console.log("Error at line 587");
            if (err) MongoErrorHandler(err);
        });

        console.timeEnd("update-user-socket-timer");
        console.log();
    });

    socket.on("get presence", function(friendUsername){

        console.time("presence-request-timer");
        
    	mongoConn.then(client => {
            let collection = client.db("usersOnline").collection("all");
            collection.findOne({"username": friendUsername}, {_id: 0}, function(err, result){
                if (err) console.log(err);

                if (result){
                    console.log("presence sent!");
                    socket.emit("receive presence", result.status, result.time_stamp);
                }
            });
            // client.close();
        }).catch(err => {
            MongoErrorHandler(err);
        });

        console.timeEnd("presence-request-timer");
        console.log();
    });

    socket.on('validate', function(data){
        if(data.val == true){
            socket.emit('navigate2home');
        } else {
            socket.emit('navigate2login');
            socket.volatile.emit('loginError', "Incorrect Password");
        }

    });

    socket.on('connectTo', function(idata, udata) {
        console.time("connect-to-user-timer");
        // IDATA contains id of the connectee
        // UDATA contains username of the connector
        // THE FOLLOWING FOR-LOOP WAS USED TO GET THE USERNAME OF THE CONNECTEE FROM THE USERS_ONLINE ARRAY
		try{
            let query = `SELECT username FROM users WHERE uID = '${idata}'`;
        	sqlConn.query(query, (err, results) => {
            	if (err) throw err;
            	let chattingWith = results[0].username;
            	socket.emit('proceed to chatroom', mf.genHex(), chattingWith);
            });
            
		}catch(err){
			console.error(err);
        }
        
        console.timeEnd("connect-to-user-timer");
    });

    socket.on('typing', function(switches, sender, receiver) {
		try{
        	let query = "SELECT uID FROM users WHERE username = '"+sender+"'";
        	sqlConn.query(query, function (err, results) {

            	if (err) throw err;
            	
            	try{
            		mongoConn.connect(url, {useNewUrlParser: true}, (err, client)=>{
            			if (err) {
            				MongoErrorHandler(err);
            			}else{
            	
            				let collection = client.db("usersOnline").collection("all");
            	
            				collection.findOne({"username": receiver},{_id: 0, uID: 1}, function(err, sock_gotten){
            					if (err) console.warn(err);
            					try{
            						io.sockets.connected[sock_gotten.sock.toString()].emit('isTyping', switches, sender, results[0].uID);
            					}catch(e){
            						console.warn(e.message);
            					}
            				});
            				// client.close();
            			}
            		});
            	
            	}catch(err){
            		console.warn(err.message, '\nThe socketis not defined or active');
            	}

        	});
        }catch(err){
        	console.warn(err);
        }

    });

    socket.on('getChat', function(sender, receipient) {
        console.time("user-message-request-timer");
		try{
        	let query = "SELECT * FROM users WHERE username = '"+receipient+"'";
        	sqlConn.query(query, function (err, results) {
                if (err) throw err;
                
                if(results.length > 0){
                    mongoConn.then(client => {
                        let collection = client.db(`${sender}`).collection(`${receipient}`);
                        collection.find({}, {sort: [['_id', -1]], limit:50}).toArray(function (err, result) {
                            if (err) throw err;
                        
                            // The sort option make the last message come first, so Reverse the array so that the last message is displayed last.
                            let reversedArray =[];
                            for(let i = 0, j = result.length-1; j > -1; i++, j--){
                                reversedArray[i] = result[j];
                            }
                            // Send the array of message to the client.
                            socket.emit('add2Chat', reversedArray, results[0].profile_picture, results[0].uID);
                        });

                    }).catch(err => {
                        MongoErrorHandler(err);
                    });
                }
            });
            
        }catch(err){
        	console.warn(err);
        }
        console.timeEnd("user-message-request-timer");
        console.log();
    });

    socket.on("read message", function(sender, message_list) {
        console.log("read-message-acknowledged");
        try{
            mongoConn.then(client => {
                let collection = client.db("usersOnline").collection("all");
        
                collection.findOne({"username": sender},{_id: 0, uID: 1}, function(err, user_object){
                    if (err) console.warn(err);
                    try{
                        message_list.forEach(msg_id => {
                            console.log("update-message-state");
                            io.sockets.connected[user_object.sock.toString()].emit('update-message-state', {
                                id: msg_id,
                                state: 2
                            });
                        });
                    }catch(e){
                        console.warn(e.message);
                    }
                });
                // client.close();

            }).catch(err => {
                MongoErrorHandler(err);
            });

        }catch(err){
        	console.warn(err.message, '\nThe socketis not defined or active');
        }
    });

    socket.on('delete message', function(sender, receiver, type, messages) {
        console.time("delete-messages-timer");

        mongoConn.connect(url, {useNewUrlParser : true}, (err, client)=>{

            var sender_collection = client.db(`${sender}`).collection(`${receiver}`),
                receiver_collection = client.db(`${receiver}`).collection(`${sender}`);

            if (err) {
            	MongoErrorHandler(err);
            }else{

            	if (type == 'delete-for-me'){
                	console.log('deleting fr me--',messages);

                	// Open sender's message collection and delete messages
                	sender_collection.deleteMany({}).then((result)=>{
                    	console.log("Delete ok");
                	}).catch((error)=>{
                    	console.log(error);
                	});

                	// Open receiver's message collection and delete messages
                	receiver_collection.deleteMany({}).then((result)=>{
                    	console.log("Delete ok");
                	}).catch((error)=>{
                    	console.log(error);
                	});

                
            	}else if(type == 'delete-for-everyone'){
                	console.log('deleting fr everyone--',messages);

                	// Open sender's message collection and delete messages
                	sender_collection.deleteMany({}).then((result)=>{
                    	console.log("Delete ok");
                	}).catch((error)=>{
                    	console.log(error);
                	});

                	// Open receiver's message collection and delete messages
                	receiver_collection.deleteMany({}).then((result)=>{
                    	console.log("Delete ok");
                	}).catch((error)=>{
                    	console.log(error);
                	});
            	}
           	}
        });

        // For sender
        socket.emit('update deleted messages', messages);

        // For receiver
        mongoConn.connect(url, {useNewUrlParser: true}, (err, client)=>{
            if (err) {
            	MongoErrorHandler(err);
            }else{
            	let collection = client.db("usersOnline").collection("all");
    
            	collection.findOne({"username": receiver},{_id: 0, uID: 1}, function(err, user_object){
                	if (err) console.warn(err);
                	try{
                    	io.sockets.connected[user_object.sock.toString()].emit('update deleted messages', messages);
                	}catch(e){
                    	console.warn(e.message);
                	}
            	});
            	// client.close();
            }
        });

        console.timeEnd("delete-messages-timer");
        console.log();
        console.log(messages);
    });

    socket.on('sendMsg2Server', function(data) {
        console.time("user-message-storage-timer");
        // data contains:
        //      sender...
        //      receipient...
        //      message

        data.message.state = 1
        mf.updateChatArray(data);
        socket.emit('update-message-state', {
            id: data.message.messageID,
            state: data.message.state
        }); // Delivered message

        mf.updateChatArray({
            sender: data.receipient,
            receipient: data.sender,
            message: {  
                mode : data.message.mode,
                messageID: data.message.messageID,
                duration : data.message.duration,
                timestamp: data.message.timestamp,
                state: 1,
                type: 'received',
                message : data.message.message
            }
        });

        let query = "SELECT uID FROM users WHERE username = '"+data.sender+"'";
        sqlConn.query(query, (err, [results]) => {
            if (err) throw err;

            try{
                mongoConn.then(client => {
                    let collection = client.db("usersOnline").collection("all");
                    collection.findOne({"username": data.receipient},{_id: 0, uID: 1}, function(err, sock_gotten){
                        if (err) console.log(err);
                        try{
                            data.message["sender"] = data.sender;
                            io.sockets.connected[sock_gotten.sock.toString()].emit('receiveMessage', data.message, results.uID);
                        }catch(e){
                            console.info('Socket is stale');
                        }
                    });
                    // client.close();

                }).catch(err => {
                    MongoErrorHandler(err);
                });

          	}catch(err){
            	console.log(err, '\nThe socketis not defined or active');
           	}
        });

        console.timeEnd("user-message-storage-timer");
        console.log();
    });

    socket.on('upload', function(data) {
        if(!files[`${data.file.name}`]){
            files[`${data.file.name}`] = Object.assign({}, fileStructure, {body: data.body}, data.file);
            files[`${data.file.name}`].data = []
            console.log("uploading..");
        }

        
        data.file.data = Buffer.from(new Uint8Array(data.file.data),)

        files[`${data.file.name}`].data.push(data.file.data);
        files[`${data.file.name}`].slice_count++;

        // console.log(data.file.data);

        if(files[`${data.file.name}`].slice_count * 100000 >= files[`${data.file.name}`].size){

            var fileBuffer = Buffer.concat(files[`${data.file.name}`].data);
            var filename = encodeURI(data.file.name);
            
            fs.writeFile(__dirname +'/public/Uploads/tmp/'+ filename, fileBuffer, (err)=>{
                let message_body = files[`${data.file.name}`].body;
                // console.log("Getting there: ", message_body.message.message.content)
                message_body.message.message.content = null;
                delete files[`${data.file.name}`];
                if (err) {
                    console.log(err);
                    return;
                }

                console.log("upload end");
                socket.emit("upload-end", {
                    body: message_body, 
                    path: 'Uploads/tmp/'+ filename
                });
            });

        }else{
            socket.emit("upload-next", {
                id: files[`${data.file.name}`].body.message.messageID,
                slice_count: files[`${data.file.name}`].slice_count
            });
        }
    });

    socket.on('get_details', function (username) {
    
    	try{
        	let query = "SELECT * FROM users WHERE username = '"+username+"'";
        	sqlConn.query(query, function (err, [results]) {

            	if (err) throw err;

                mongoConn.then(client => {
                    var collection = client.db(`${username}`).collection('settings');
			
                    collection.find().toArray((err, [result])=>{
                        if (err) throw err;
                    
                        let details = {
                                id : results["uID"],
                                username : results["username"],
                                bio : results["bio"],
                                phone : results["phone"],
                                email : results["email"],
                                pp : results["profile_picture"],
                                wp: result["chatwall"]
                        }
                
                        socket.emit('receive_details', details);
                    });
                    
                    // client.close();

                }).catch(err => {
                    MongoErrorHandler(err);
                });
        	});
        
        }catch(err){
        	console.error(err);
        }

    });
    
    socket.on('get preferences', (username)=>{
    	try{
    		mongoConn.connect(url, {useNewUrlParser: true}, (err, client)=>{
    			if (err) {
    				MongoErrorHandler(err);
    			}else{
    				var collection = client.db(`${username}`).collection('settings');
    		
    				collection.find().toArray((err, result)=>{
    					if (err) throw err;
    			
    					socket.emit("set preferences", result);
    				});
    				
    				// client.close();
    			}
    		});
    	
    	}catch(err){
    		console.error(err);
    	}
    
    });

    socket.on('search_friend', function (username, phone_no) {

        let query = "SELECT DISTINCT uID, username, phone, telcode, bio, profile_picture FROM users WHERE phone = '"+phone_no+"' AND username != '"+username+"' LIMIT 1";

        sqlConn.query(query, function (err, [results]) {

            if (err) throw err;
			// console.log('correct');
          	if (results){
              socket.emit('receive_search', results);
            }else{
				socket.emit('error_search');
            }

        });


    });

    socket.on('addBuddy', function(friendID, myUsername){
    	try{
    		mf.addBuddy(friendID, myUsername);
    	}catch(err){
    		console.error(err);
    	}
    });

    socket.on('sendCall', function(data) {

        switch(data.type){
            case 'video call':
                
                try{
                	mongoConn.connect(url, {useNewUrlParser: true}, (err, client)=>{
                		if (err) {
                			MongoErrorHandler(err);
                		}else{
                
                			let collection = client.db("usersOnline").collection("all");
                
                			collection.findOne({"username": data.receiver},{_id: 0, uID: 1}, (err, sock_gotten) => {
                				if (err) console.log(err);
                				try{
                					io.sockets.connected[sock_gotten.sock.toString()].emit('receiveVideoCall', data.data, data.sender);
                				}catch(e){
                					console.log("socket is stale for video");
                				}
                			});
                			// client.close();
                		}
                	});
                
                }catch(err){
                	console.log(err, '\nThe socketis not defined or active');
                }
                break;

            case 'voice call':
				try{
					mongoConn.connect(url, {useNewUrlParser: true}, (err, client) => {
						if (err) {
							MongoErrorHandler(err);
						}else{
						
							let collection = client.db("usersOnline").collection("all");
				
							collection.findOne({"username": data.receiver},{_id: 0, uID: 1}, (err, sock_gotten) => {
								if (err) console.log(err);
								try{
									console.log(sock_gotten.sock);
									io.sockets.connected[sock_gotten.sock.toString()].emit('receiveVoiceCall', data.data, data.sender);
								}catch(e){
									console.log("socket is stale for voice");
								}
							});
							
							// client.close();
						}
					});
				
				}catch(err){
					console.log(err, '\nThe socketis not defined or active');
				}
                break;

            default:
            	console.log('none...');
            	break;
        }

    });

    socket.on('disconnect', function() {
    	var date = new Date();
        var timeString = mf.formatTime(date.getHours(), date.getMinutes());
        
    	mongoConn.then(client => {

            let collection = client.db("usersOnline").collection("all");
            collection.updateMany({"sock": socket.id},{$set:{"status": "offline", "time_stamp": timeString}}, function(err, result){
                if (err) log(err);
            });
            
    	}).catch(err => {
            MongoErrorHandler(err);
        });
    	
   		console.log(timeString);
    	socket.broadcast.emit("offline", "offline", timeString)
    });

});

server.listen(PORT, '0.0.0.0', function() {
    console.info(`listening on port: ${PORT}`);
});


// app.get('/', function initViewsCount(req, res, next){
//     if (typeof req.session.views=='undefined') {
//         req.session.views=1;
//         return res.end('Welcome the session file demo. Refresh page!');
//     }
//     return next();
// });

// app.get('/', function incrementViewsCount(req, res, next){
//     console.assert(typeof req.session.views==='number', 'missing views count in session', req.session);
//     req.session.views++;
//     return next();
// });

// app.get('/', function sendPageWithCounter(req, res) {
//     res.setHeader('Content-Type', 'text/html');
//     res.write('<p>views: ' + req.session.views + '</p>\n');
//     res.end();
// });

// res.clearCookie('username');
// res.send(req.cookies);