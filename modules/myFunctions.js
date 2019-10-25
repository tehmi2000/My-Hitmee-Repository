const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const mongo=require('mongodb').MongoClient;
const url = require("../config").MONGO_URL;
const connection = require ("../config").connection;

exports.searchArrayFor = function (array, username){
    for (let index = 0; index < array.length; index++) {
        if(array[index].username==username){
            return {found : true, index : index};
        }
    }
    return {found : false, index : null};
}

exports.updateChatArray = (object)=>{

	// if (object.message.message.ref){
	// 	object.message.message.content = "";
	// }

	// console.log(object);
	
    mongo.connect(url, {useNewUrlParser : true}, (err, client)=>{

        if (err) throw err;

        var collection = client.db(`${object.sender}`).collection(`${object.receipient}`);

        collection.insertOne(object.message, function(err) {
            if (err) throw err;
        });

        client.close();
	});
	
	// console.log(object);

};

exports.genHex = ()=>{
	return crypto.randomBytes(16).toString('hex');
}

exports.encrypt = function(password) {
    const iv = crypto.randomBytes(16);
    const key = crypto.randomBytes(32);

    let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(password);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // console.log(`passHash = ${iv.toString('hex')}:${encrypted.toString('hex')}:${key.toString('hex')}`);

    return iv.toString('hex')+':'+encrypted.toString('hex')+':'+key.toString('hex');
}

exports.decrypt = function (encryptedpassword){
    let [iv, encrypted, key] = encryptedpassword.split(':');
    iv = Buffer.from(iv, 'hex');
    encrypted = Buffer.from(encrypted, 'hex');
    key = Buffer.from(key, 'hex');

    let decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted);

    decrypted = Buffer.concat([decrypted, decipher.final()]);
    // console.log(`passUnHash = ${decrypted.toString()}`);
    return decrypted.toString();
}

exports.addBuddy = function(friendID, myUsername){
	try{
		console.info (myUsername);
		let query = "SELECT DISTINCT uID, username, profile_picture FROM users WHERE uID = '"+friendID+"' AND username != '"+myUsername+"' LIMIT 1";
	
		connection.query(query, (errs, result)=>{
			if (errs) throw  errs;
			
			mongo.connect(url, {useNewUrlParser: true}, (errm, client)=>{
				if (errm) throw errm;
	
				let collection = client.db(`${myUsername}`).collection(`Friends`);
	
				let insertValue = {uID: result[0].uID,
									username : result[0].username,
									profile_picture: result[0].profile_picture};
	
				collection.updateOne({"uID": friendID}, {$setOnInsert: insertValue}, {upsert: true}, function(err){});
	
				client.close();
			});
	
		});
		
		query = "SELECT DISTINCT uID, username FROM users WHERE uID = '"+friendID+"' LIMIT 1";
		
		connection.query(query, (errs, result)=>{
			if (errs) throw  errs;
		
		
			let query = "SELECT DISTINCT uID, username, profile_picture FROM users WHERE username = '"+myUsername+"' AND uID != '"+friendID+"' LIMIT 1";
			connection.query(query, (err, rows)=>{
					
				mongo.connect(url, {useNewUrlParser: true}, (errm, client)=>{
					if (errm) throw errm;
					var collection = client.db(`${result[0].username}`).collection("Friends");
					let insertValue = {
										uID: rows[0].uID,
										username : rows[0].username,
										profile_picture: rows[0].profile_picture
					};
					
					collection.updateOne({"uID": rows[0].uID}, {$setOnInsert: insertValue}, {upsert: true}, function(err){
						if(err) throw err;
					});
					client.close();
				});
		
			});
		
		});
	}catch(e){
		console.log(e);	
	}
}

exports.formatTime = (hours, minutes)=>{
    var ampm=(hours>=12)? 'PM' : 'AM';
    var fhours=(hours>12)? hours-12 : hours;
    var fmin=(JSON.stringify(minutes).length==1)? '0'+minutes : minutes;
    var ftime=fhours+':'+fmin+' '+ampm;
    return ftime;
}