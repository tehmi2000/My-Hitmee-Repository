const model = function(){
	const app_db_config = require("../config");
	const transporter = app_db_config.transporter;
	const mailOption = {
		sender: '"Hitmee App" <'+app_db_config.ePass['user']+'>'
	};
	
	const validation = async function(receiver){
		try{
			let info = await transporter.sendMail({
				from: mailOption.sender,
				to: receiver,
				subject: "Email Verification",
				text: "",
				html: "<b>Hey</b>"
			});
		
			console.log("Verification Email with messageID %s sent", info.messageId);
			return info;
			
		}catch(err){
		
			console.log("Verification Email sending error");
			console.error(err);
		}
	}
	
	const notification = async function(){
	
	}
	
	return {
		sendVerificationMail: validation,
		sendNotificationMail: notification
	};
};

module.exports = model();