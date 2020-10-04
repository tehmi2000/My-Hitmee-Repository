const model = function() {
    const fs = require("fs");
    const cloudinary = require('cloudinary').v2;
    const mysql_config =  require("./config");
    // const emailHandler = require("./emailHandler");
    const { log } = mysql_config;
    // const ph = require("./passwordHash");

    // CLOUDINARY CONFIGURATION
    cloudinary.config({
        cloud_name: "https-oneunivers-herokuapp-com",
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    function genHex(length){
        length = length || 16;
        let counter = 0;
        let generated_hex = "t";
        let characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
        
        while(counter <= length){
            let rand_index = Math.round((Math.random()*characters.length)+1);
            generated_hex += characters.charAt(rand_index);
            counter += 1;
        }
        console.log(generated_hex);
        return generated_hex;
    }

    const formatName = str => {
        const wordArray = str.split(" ").map(word => (word.charAt(0)).toUpperCase()+(word.substring(1)).toLowerCase());
        let formattedString = wordArray.join(" ");
        return formattedString;
    };

    const readFile = function(path, request, response) {
        fs.readFile(path, "utf8", function(err, content) {
            if (err) {
                throw err;
            } else {
                response.setHeader('Content-Type', 'text/html');
                response.end(content);
            }
        });
    };

    const authSanitizer = function(input) {
        return input.replace(/ /g, '')
                    .replace(/\'/g, '')
                    .replace(/\"/g, '')
                    .replace(/\`/g, '')
                    .replace(/--/g, '')
                    .replace(/=/g, '');
    };

    // ************************ UPLOAD ***********************************************
    const cloudUpload = function(req, res) {
        let file = req.files;
        let localPath = "./public/uploads";

        const uploadToCloud = (name, path) => {

            const params = {
                overwrite: true,
                public_id: `univers_product_images/${name.split('.')[0]}`,
                eager: [{quality: "auto:best"}]
            };

            cloudinary.uploader.upload(path, params, function(cloudErr, result) {
                if (cloudErr) {
                    log(cloudErr);
                    res.json([{...cloudErr, status: 403}]);
                }else{
                    // console.log(result);
                    res.json([
                        {
                            status: 200, 
                            statusText: "Upload successful!",
                            version: result.version,
                            signature: result.signature
                        }
                    ]);
                }
            });
        };

        for (const key in file) {
            let uploadedFile = file[key];
            uploadedFile.name = uploadedFile.name.replace(" ", "");
            
            uploadedFile.mv(`${localPath}/${uploadedFile.name}`, function(err) {
                if (err) {
                    log(err);
                    res.json([{...err, status: 403}]);
                }else{
                    try{
                        uploadToCloud(uploadedFile.name, `${localPath}/${uploadedFile.name}`);
                    }catch(e){
                        log(e);
                        res.json([{...e, status: 403}]);
                    }
                }
            });
        }
    };

    const upload = function(req, res) {
        let file = req.files;
        let path = "./public/uploads";
        for (const key in file) {
            let uploadedFile = file[key];
            uploadedFile.mv(`${path}/${uploadedFile.name}`, function(err) {
                if (err) {
                    log(err);
                    res.json([{...err, status: 403}]);
                }else{
                    res.json([{status: 200, statusText: "Upload successful!"}]);
                }
            });
        }
    };

    // ************************ UPLOAD ***********************************************

    const update = function(req, res) {

        const user_username = authSanitizer(req.body.username);
        const user_address = `${authSanitizer(req.body.state)}, ${authSanitizer(req.body.country)}`;
        const user_firstname = authSanitizer(formatName(req.body.firstname));
        const user_lastname = authSanitizer(formatName(req.body.lastname));
        const user_phone = authSanitizer(req.body.phone);
        const user_telcode = authSanitizer(req.body.telcode);

        let query = `UPDATE users SET firstname='${user_firstname}', lastname='${user_lastname}', telcode='${user_telcode}', phone='${user_phone}', address='${user_address}' WHERE username='${user_username}'`;
        mysql_config.connection.query(query, function(err, result){
            if(err) {
                log(err);
            }else{
                console.log('User\'s account details updated successfully!');
                res.json(result);
            }
        });
    };

    const submitComplaint = function(req, res) {
        let [firstname, lastname] = req.body.fullname.split(" ");
        lastname = lastname || "";
        const email = req.body['user_email'];

        console.log(firstname, lastname, email);
        emailHandler.sendAcknowledgeSupport(email, firstname, lastname);
        res.end("Submitted");
    };

    const auth = function(req, res) {
        const { redirect_url } = req.body;
        const user_username = authSanitizer(req.body.username);
        const user_password = authSanitizer(req.body.password);
        

        const query = `SELECT username, password FROM users WHERE username='${user_username}'`;
        mysql_config.connection.query(query, function(err, result){
            if(err) {
                log(err);
            }else{
                let [user1] = result;
                if (result.length === 0){
                    res.redirect(`/login?error=${ph.softEncrypt("not found")}&idn=novalid`);
                }else{
                    if (ph.decrypt(user1.password) === user_password){
                        req.session.username = user_username;
                        res.cookie("username", user_username, {maxAge: 72000000});
                        res.redirect(redirect_url || `/?sess=${ph.softEncrypt("success")}&idn=success`);
                    }else{
                        res.redirect(`/login?error=${ph.softEncrypt("not found")}&idn=invalidid`);
                    }
                }
            }
        });
    };

    const register = function(req, res) {

        const uuid = genHex(32);
        const user_username = authSanitizer(req.body.username);
        const user_password = authSanitizer(req.body.password);
        const user_email = req.body.user_email;
        const user_firstname = formatName(req.body.firstname);
        const user_lastname = formatName(req.body.lastname);

        let query = `SELECT username, email FROM users WHERE username="${user_username}" OR email="${user_email}"`;

        mysql_config.connection.query(query, function(err, existing_users) {
            if(err){
                log(err);
            }else if(existing_users.length === 0){
                let query = `INSERT INTO users (uID, username, password, firstname, lastname, telcode, phone, email, address, profile_picture, verification_status) VALUES ('${uuid}', '${user_username}', '${ph.encrypt(user_password)}', '${user_firstname}', '${user_lastname}', '', '', '${user_email}', '', '/assets/images/contacts-filled.png', false)`;

                mysql_config.connection.query(query, function(err){

                    if(err) {
                        log(err);
                    }else{
                        console.log('Inserted successfully!');
                        emailHandler.sendVerificationMail(user_email, user_firstname, user_lastname, uuid);
                        req.session.username = user_username;
                        res.cookie("username", user_username, {maxAge: 72000000});
                        res.redirect(`/verification.html?idn=success&generated_uuid=${ph.softEncrypt(uuid)}`);
                    }
                });

            }else{
                res.redirect(`/signup?error=${ph.softEncrypt("not found")}&idn=userexist`);
            }
        });
    };

    const vendorRegister = function(req, res) {
        let vendorEmail = req.body['user-email'];
        let vendorName = req.body['user-brand'];
        let vendorBio = req.body['user-bio'];
        let vendorCountry = req.body['user-country'];
        let vendorRegion = req.body['user-region'];

        let query = `SELECT uID, username, firstname, lastname FROM users WHERE email="${vendorEmail}"`;

        mysql_config.connection.query(query, function(err, users) {
            if(err){
                log(err);
                res.json([{...err}]);
            }else if(users.length > 0){
                let sellerID = users[0].uID;
                let username = users[0].username;
                let vendorWebsite = (req.body['business-url'] === '')? `https://oneunivers.herokuapp.com/vendors/public_store/${sellerID}` : req.body['business-url'];

                let query = `INSERT INTO vendors (sellerID, username, vendorName, email, website, bio, country, region) VALUES ('${sellerID}', '${username}', '${vendorName}', '${vendorEmail}', '${vendorWebsite}', '${vendorBio}', '${vendorCountry}', '${vendorRegion}')`;
                mysql_config.connection.query(query, function(err){
                    if (err) {
                        log(err);
                        res.json([{...err}]);
                    }else{
                        console.log('New Vendor Profile Inserted successfully!');
                        emailHandler.sendVendorStatusReport(vendorEmail, vendorName, users[0].firstname, users[0].lastname, users[0].username, sellerID, website);
                        res.cookie(`univers-${username}-sellerID`, sellerID, {maxAge: 72000000});
                        res.json([{
                            status: 'ok',
                            sellerID,
                        }]);
                        // res.redirect();
                    }
                });
            }else{

                res.redirect(`/signup?error=${ph.softEncrypt("not found")}&idn=userexist`);
            }
        });
    };

    return {
        auth,
        register,
        vendorRegister,
        update,
        submitComplaint,
        cloudUpload,
        resetHandler: function(req, res) {
            const account_email = req.body["reset-email"];
            console.log(account_email);

            const query = `SELECT uID, email, firstname, lastname FROM users WHERE email='${account_email}'`;
            mysql_config.connection.query(query, function(err, result){
                if(err) {
                    log(err);
                }else{
                    let [user] = result;

                    if (result.length === 0){
                        res.redirect(`/passwordReset?error=${ph.softEncrypt("not found")}&idn=novalid`);
                    }else{
                        emailHandler.sendPasswordReset(account_email, user.firstname, user.lastname, user.uID);
                        res.end("Password Reset!");
                    }
                }
            });
        },
        dashboard: function(req, res) {
            readFile("./public/index.html", req, res);
        },
        search: function(req, res) {
            readFile("./public/search.html", req, res);
        },
        myprofile: function(req, res) {
            readFile("./public/profile.html", req, res);
        },
        control: function(req, res) {
            let { sectid } = req.query;
            switch (sectid) {
                case "1":
                    readFile("./public/myCartPage.html", req, res);
                    break;

                case "2":
                    readFile("./public/sellerPage.html", req, res);
                    break;

                case "3":
                    readFile("./public/myStorePage.html", req, res);
                    break;

                case "4":
                    readFile("./public/mySavedPage.html", req, res);
                    break;
            
                default:
                    readFile("./public/dummy.html", req, res);
                    break;
            }
            
        },
        productView: function(req, res) {
            res.redirect(`/productView.html?queryItem=${req.params.itemID}`);
        },
        publicStore: function(req, res) {
          readFile("./public/publicStore.html", req, res);  
        },
        vendorApplication: function(req, res) {
            readFile("./public/vendorApplyForm.html", req, res);
        },
        paymentSuccess: function(req, res) {
            readFile("./public/payment_success.html", req, res);
        },
        login: function(req, res) {
            readFile("./public/login.html", req, res);
        },
        signup: function(req, res) {
            readFile("./public/signup.html", req, res);
        },
        reset: function(req, res) {
            readFile("./public/reset.html", req, res);
        },
        logout: function(req, res) {
            req.session.destroy(function (err) {
                if (err) {
                    log(err);
                } else {
                    res.clearCookie("username");
                    res.redirect("/login");
                }
            });
        },
        aboutUs: function(req, res) {
            readFile("./public/dummy.html", req, res);
        },
        pricing: function(req, res) {
            readFile("./public/pricing.html", req, res);
        },
        support: function(req, res) {
            readFile("./public/support.html", req, res);
        }
    };
};

module.exports = model();