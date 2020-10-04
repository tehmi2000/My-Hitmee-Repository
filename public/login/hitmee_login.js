const socket = io();
let check = false;
let shouldPrompt = false;
let errorD;
const querystring = getQuery();
let inputElement = null;

const welcomeDelay = setTimeout(function () {
    // welcome_user();
}, 9000);

const playtracks = {
	"1": "images/Display-video.mp4",
	"2": "",
	"3": "",
	"4": ""
};

const controlStrings = ["back", "restart"]

const userData = {
	login: {
		nameList: ["username", "password"],
		data: {

		}
	},
	create: {
		nameList: ["username", "password", "confirm-password", "email", "phone-number"],
		data: {

		}
	}, 

};

function initLogin(){
	errorD = get("error");
	
	document.querySelector(".phone-body video").addEventListener("play", function(params) {
		
	});

	document.querySelector("input[name='username']").addEventListener("input", function(evt) {
		const submitButton = document.querySelector("input[type='submit']");
		if (submitButton.hasAttribute("disabled") == false){
			submitButton.setAttribute("disabled", true);
		}
	});

	document.querySelector("form button").addEventListener("click", function(evt) {
		evt.preventDefault();
	});

	if (querystring && querystring["error"] && querystring["error"]=="novalidid"){
		errorD.innerHTML = 'Incorrect password!';
		errorD.classList.toggle("serror", true);
	}
}

// action="/admin"

function getQuery() {
    let object = {};

    let queryList = window.location.search.substring(1).split('&');

    for (let index = 0; index < queryList.length; index++){
        object[queryList[index].split('=')[0]] = queryList[index].split('=')[1];
    }
    
    return object;
}

function createComponent(elementName, value, classList) {
    value = value || null;
    classList = classList || null;

    const component = document.createElement(elementName);
    if (value){
        // text = document.createTextNode(value);
        component.innerHTML = value;
    }

    if(classList){
        classList.forEach(className => {
            component.classList.add(className);
        });
    }
    return component;
}

function joinComponent(container, ...components) {
    for (let component of components){
        container.appendChild(component);
    }
    return container;
}

// function welcome_user() {
//     typing_msg = '';
//     index = 0;
//     pause = 68;
//     let user_msg = "To get started, <b><u>LOG IN</u></b> below or <b><u>Create a new account</u></b> by entering a <i>new</i> account details. Our server would create a new account for you automatically. ENJOY!";

//     let type_delay = setInterval(() => {
//         typing_msg += user_msg.charAt(index);

//         get('welcome').innerHTML = typing_msg;
//         document.querySelector(".welcome").scrollTop = document.querySelector(".welcome").scrollHeight;

//         if (index < user_msg.length){
//             index++;
//         }else{
//             clearInterval(type_delay);
//         }
//     }, pause);
// }

function checkExisting(){
    // get the value in the username input field
    const usernameField = get("login_user");
	const value = usernameField.value;

    //if field is not empty and database check has not been done
    if(value != '' && check==false){
        socket.emit('check existing', value);

		const checkMembers = document.querySelectorAll("input[name='username']+button > *");
		forEach(checkMembers, function(element) {
			element.style.opacity = "1";
		});

		const i = checkMembers[0];
		const span = checkMembers[1];

		i.setAttribute("class", "icofont-refresh");
		span.textContent = "Checking...";

		check = true;
	}
}

// function validate() {
    
//     if(get('login_user').value=='' || get('login_pass').value==''){
//         errorD.classList.toggle("serror", true);
//         errorD.innerHTML = 'Username/password field cannot be empty!';
//         return false;
//     }
    
//     if((get('login_pass').value).length < 5){
//         errorD.classList.toggle("serror", true);
//         errorD.innerHTML = 'Password must be atleast 5 characters long!';
//         return false;
//     }
    
//     errorD.innerHTML = '';
//     errorD.classList.toggle("serror", false);
    
//     // Confirm if user wants to create a new account
//     if (shouldPrompt == true){
//     	let answer = confirm("Do you want to create a new account?");
//     	return answer;
//     }
    
//     return true;
// }

let animateChats = function (elements, type) {
	if(type === "reply"){
		gsap.from(elements, 0.3, {x: -200, y: "90%", stagger: 0.8, opacity: 0});
	}else{
		gsap.from(elements, 0.3, {x: "90%", y: "90%", stagger: 0.8, opacity: 0});
	}	
};

let animateSlides = function (noOfSlides) {
	let element = document.querySelector(`#slider .slide:nth-child(${noOfSlides})`);
	gsap.set(element, {opacity: 1});
	gsap.fromTo(element, 0.8, {opacity: 0.5, y: "80vh"}, {opacity: 1, y: "10vh", ease: "elastic.out(2, 0.3)", onComplete: function () {
		gsap.to(element, 0.6, {opacity: 0, y: -40, delay: 9, onComplete: function() {
			gsap.set(element, {transform: "unset"});
		}});
	}});

	setTimeout(() => {
		let nextElement = document.querySelector(`#slider .slide:nth-child(${noOfSlides + 1})`);
		if(nextElement === null || nextElement === undefined){
			animateSlides(1);
		}else{
			animateSlides(noOfSlides + 1);
		}
	}, 12000);
}

const createAliasedText = function (text, alias){
	let aliasedText = '';
	for (let index = 0; index < text.length; index++) {
		aliasedText += alias
	}
	return aliasedText;
}

const startChatBot = function() {
	replyChat("Hello, I am Hitmee. What is your username?");
};

const createChat = function (message, alias) {
	alias = alias || null;
	if (alias !== null) message = createAliasedText(message, alias);
	let ids = [];
	let elementId = Math.round(Math.random()*10e5);
	let container = document.querySelector("#chat-form .chat-form-screen");
	let div0 = createComponent("DIV", null, ["chat-wrapper"]);
	let div1 = createComponent("DIV", message, ["chat", "sent-chat"]);

	div0 = joinComponent(div0, div1);
	div0.id = `sent_${elementId}`;
	container.appendChild(div0);

	ids.push(`#sent_${elementId}`);
	container.scrollTop = container.scrollHeight;

	animateChats(ids, "sent");
};

const replyChat = function (message) {
	let ids = [];
	let create = function (container, content) {
		let elementId = Math.round(Math.random()*10e5);
		let div0 = createComponent("DIV", null, ["chat-wrapper"]);
		let div1 = createComponent("DIV", content, ["chat", "reply-chat"]);

		div0 = joinComponent(div0, div1);
		div0.id = `reply_${elementId}`;
		// div0.style.opacity = 0;

		container.appendChild(div0);

		ids.push(`#reply_${elementId}`);
		container.scrollTop = container.scrollHeight;
	};

	let container = document.querySelector("#chat-form .chat-form-screen");
	if(typeof message === typeof []){
		message.forEach(singleMessage => {
			create(container, singleMessage);
		});
	}else{
		create(container, message);
	}

	animateChats(ids, "reply");
};

const analyseInput = function (dataValue, inputElement) {
	let index = parseInt(inputElement.getAttribute("data-count"));
	let type = inputElement.getAttribute("data-type");
	dataValue = dataValue.trim();

	// console.log(index, type);
	if(dataValue.startsWith("/") === true){
		botCommands(dataValue, index, type);
	}else{
		if(index === 0){
			socket.emit("check existing", dataValue);
		}else{
			mainBotLogic(index, type, dataValue);
		}
	}
};

const botCommands = function(action, index, type){
	switch (action) {

		case "/signup":
			// replyChat("Okay, we are going back one step!");
			mainBotLogic(-1, "create", null);
			break;

		case "/restart":
			replyChat("Okay, Let's restart!");
			mainBotLogic(-1, type, null);
			break;

		case "/back":
			replyChat("Okay, we are going back one step!");
			mainBotLogic(index - 1, type, null);
			break;

		case "/about":
			let listOfMessages = ["Wawu! Okay, seems you are getting the hang of it.", "Hitmee is a instant messaging web application that helps you connect with your friends and family all over the globe", "So..."];
			replyChat(listOfMessages);
			setTimeout(()=>{
				botCommands("/restart", index, type);
			}, 1000 * (listOfMessages.length + 1));			
			break;
	
		default:
			replyChat("Didn't get the command! What would you like to do?");
			mainBotLogic(index - 1, type, null);
			break;
	}
};

const mainBotLogic = function (index, type, dataValue) {
	let currentQuestion = userData[`${type}`].nameList[index];
	let nextQuestion = userData[`${type}`].nameList[index + 1];
	let message = null;
	let placeholder = null;
	let shouldProceed = true;

	// Store data in corresponding global object
	if(currentQuestion !== undefined && currentQuestion !== null){
		userData[`${type}`].data[`${currentQuestion}`] = dataValue;
	}

	console.log(userData);
	if(currentQuestion === "confirm-password"){
		let userPassword = userData['create'].data['password'];
		let confirmedPassword = userData['create'].data['confirm-password'];

		if(userPassword !== confirmedPassword){
			replyChat("Inputted password did not match previous password!");
			mainBotLogic(index - 1, "create", userPassword);
			shouldProceed = false;
		}else{
			replyChat("Yeah, perfect!");
		}
	}
	
	// Used to skip the logic to proceed to the next question
	if(shouldProceed === true){
		if(nextQuestion !== undefined){
			message = `What is your ${nextQuestion}?`;
			placeholder = `Type your ${nextQuestion} here...`;
	
			inputElement.setAttribute("data-count", index + 1);
			inputElement.setAttribute("data-type", type);
	
			switch (nextQuestion) {
				case 'username':
					// if(type === "login") message = `Hey ${dataValue}, what is your ${nextQuestion}?`;
					if(type === "create") message = "What username would you like to use?";
					inputElement.setAttribute("type", "text");
					break;

				case 'password':
					if(type === "login") message = `Hey ${dataValue}, what is your ${nextQuestion}?`;
					if(type === "create" && index === 0) message = [`That username isn't registered with us!`, `Would you like to create a new account with username: <b>${dataValue}</b>?`, `If Yes, enter your preferred ${nextQuestion}.`, `If No, just type /restart`];
					inputElement.setAttribute("type", "password");
					break;
			
				case 'email':
					inputElement.setAttribute("type", "email");
					message = `What email address would you like to use?`;
					break;
				
				case "confirm-password":
					inputElement.setAttribute("type", "password");
					placeholder = `Type your password again here...`;
					message = `Please do confirm this password.`;
					break;
	
				case "phone-number":
					inputElement.setAttribute("type", "tel");
					placeholder = `Type your mobile number here...`;
					message = `Lastly, what is your mobile number?`;
					break;
				default:
					inputElement.setAttribute("type", "text");
					break;
			}
	
			inputElement.setAttribute("placeholder", placeholder);
			replyChat(message);
	
		}else{
			switch (type) {
				case "login":
					replyChat("Nice! I would be logging you in shortly.");
					authenticateUser();
					break;
			
				case "create":
					replyChat(["Thank you for signing up! I would be logging you in shortly.", "Do have a wonderful time!"])
					createUser();
					break;
	
				default:
					console.log("None");
					break;
			}
		}
	}
	
	inputElement.focus();
	shouldProceed = true;
}

const authenticateUser = function(count){
	count = count || 1;
	let timeout = count * 5;
	let apiUrl = `/admin`;

	fetch(apiUrl, {
		method: "POST",
		body: JSON.stringify(userData['login'].data),
		headers: {
			"Content-Type": "application/json;charset=utf-8"
		}
	}).then(async response => {
		try {
			let result = await response.json();
			// console.log(result);
			if(result.statusCode === 200 && result.redirectUrl){

				replyChat("HERE WE GOOOOOOOO!!!");
				window.location.href = result.redirectUrl;

			}else if(result.statusCode === 401 && !result.redirectUrl){
				let index = parseInt(inputElement.getAttribute("data-count"));
				let fieldName = userData["login"].nameList[index - 1];
				let dataValue = userData["login"].data[`${fieldName}`];

				replyChat("The password provided was invalid. Please try again!");
				// Go back one step
				mainBotLogic(index - 1, "login", dataValue);
			}else{

				let message = {
					try1: "Sorry dear, there was an issue logging you in. Please hold on...",
					try2: `Something is not right...Please do try refreshing the page or hold on for ${timeout} seconds.`
				}
				replyChat(message[`try${count}`]);
				setTimeout(() => {
					authenticateUser(count + 1);
				}, timeout);
			}
		} catch (error) {
			console.error(error);
		}
	}).catch(error => {
		console.error(error);
	});
}

const createUser = function (count) {
	count = count || 1;
	let timeout = count * 5;
	let apiUrl = `/admin`;

	fetch(apiUrl, {
		method: "POST",
		body: JSON.stringify(userData['create'].data),
		headers: {
			"Content-Type": "application/json;charset=utf-8"
		}
	}).then(async response => {
		try {
			let result = await response.json();
			// console.log(result);
			if(result.statusCode === 200 && result.redirectUrl){

				replyChat("HERE WE GOOOOOOOO!!!");
				window.location.href = result.redirectUrl;

			}else if(result.statusCode === 401 && !result.redirectUrl){
				let index = parseInt(inputElement.getAttribute("data-count"));
				let fieldName = userData["create"].nameList[index - 1];
				let dataValue = userData["create"].data[`${fieldName}`];

				replyChat("The password provided was invalid. Please try again!");
				// Go back one step
				mainBotLogic(index - 1, "create", dataValue);
			}else{

				let message = {
					try1: "Sorry dear, there was an issue logging you in. Please hold on...",
					try2: `Something is not right...Please do try refreshing the page or hold on for ${timeout} seconds.`
				}
				replyChat(message[`try${count}`]);
				setTimeout(() => {
					createUser(count + 1);
				}, timeout);
			}
		} catch (error) {
			console.error(error);
		}
	}).catch(error => {
		console.error(error);
	});
};

const formHandler = function (ev) {
	ev.preventDefault();
	const messageInput = inputElement;
	let message = messageInput.value;
	
	if(message !== '' && message.length > 2){
		if(messageInput.getAttribute("type") === "password"){
			createChat(message, '*');
		}else{
			createChat(message);
		}
		messageInput.value = '';
		analyseInput(message, messageInput);
	}	
};

const switchToChatHandler = function (ev) {
	let chatFormType = document.querySelector("#chat-type-login");
	let normalFormType = document.querySelector("#normal-type-login");

	if(chatFormType.classList.contains("none")){
		chatFormType.classList.replace("none", "cols");
	}

	normalFormType.classList.replace("cols", "none");
};

const switchToNormalHandler = function (ev) {
	let chatFormType = document.querySelector("#chat-type-login");
	let normalFormType = document.querySelector("#normal-type-login");

	if(normalFormType.classList.contains("none")){
		normalFormType.classList.replace("none", "cols");
	}

	chatFormType.classList.replace("cols", "none");
};

const loadControllers = function () {
	let form = document.querySelector("#chat-form");
	let chatFormTypeBtn = document.querySelector("#chat-type-login .element-btn");
	let normalFormTypeBtn = document.querySelector("#normal-type-login .element-btn");

	form.addEventListener("submit", formHandler);
	chatFormTypeBtn.addEventListener("click", switchToNormalHandler);
	normalFormTypeBtn.addEventListener("click", switchToChatHandler);
	startChatBot();
};

socket.on('loginError', function(data) {
    console.log(data);
});

socket.on('existing', (bool, dataValue) => {
	let index = parseInt(inputElement.getAttribute("data-count"));

	// reset values
	check = false;
	shouldPrompt = false;
	
	if(bool === true){
		mainBotLogic(index, "login", dataValue);
		
	}else{
		mainBotLogic(index, "create", dataValue);
	}
});

document.addEventListener("DOMContentLoaded", function (ev) {
	document.querySelectorAll("#slider .slide").forEach(el => {
		el.classList.add("js-enabled");
	});
	loadControllers();
	animateSlides(1);
	inputElement = document.querySelector(`#chat-form .chat-form-controls #login-credentials`);
});