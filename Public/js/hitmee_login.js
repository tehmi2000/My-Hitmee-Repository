const socket = io();
let check = false;
let shouldPrompt = false;
let errorD;
const querystring = get_query();

const welcome_delay = setTimeout(function () {
    // welcome_user();
}, 9000);

const playtracks = {
	"1": "images/Display-video.mp4",
	"2": "",
	"3": "",
	"4": ""
};

function initLogin(){
	errorD = get("error");
	
	document.querySelector("phone-body video").addEventListener("play", function(params) {
		
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

function forEach(elements, reaction){
    for(let i = 0; i < elements.length; i++){
        (reaction)(elements[i]);
    }
}

function get(id) {
	return document.getElementById(id);
}

function get_query() {
    let object = {};

    let query_list = window.location.search.substring(1).split('&');

    for (let index = 0; index < query_list.length; index++){
        object[query_list[index].split('=')[0]] = query_list[index].split('=')[1];
    }
    
    return object;
}

function welcome_user() {
    typing_msg = '';
    index = 0;
    pause = 68;
    let user_msg = "To get started, <b><u>LOG IN</u></b> below or <b><u>Create a new account</u></b> by entering a <i>new</i> account details. Our server would create a new account for you automatically. ENJOY!";

    let type_delay = setInterval(() => {
        typing_msg += user_msg.charAt(index);

        get('welcome').innerHTML = typing_msg;
        document.querySelector(".welcome").scrollTop = document.querySelector(".welcome").scrollHeight;

        if (index < user_msg.length){
            index++;
        }else{
            clearInterval(type_delay);
        }
    }, pause);
}

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

function validate() {
    
    if(get('login_user').value=='' || get('login_pass').value==''){
        errorD.classList.toggle("serror", true);
        errorD.innerHTML = 'Username/password field cannot be empty!';
        return false;
    }
    
    if((get('login_pass').value).length < 5){
        errorD.classList.toggle("serror", true);
        errorD.innerHTML = 'Password must be atleast 5 characters long!';
        return false;
    }
    
    errorD.innerHTML = '';
    errorD.classList.toggle("serror", false);
    
    // Confirm if user wants to create a new account
    if (shouldPrompt == true){
    	let answer = confirm("Do you want to create a new account?");
    	return answer;
    }
    
    return true;
}

socket.on('loginError', function(data) {
    console.log(data);
});

socket.on('existing', (bool)=>{
	const checkMembers = document.querySelectorAll("input[name='username']+button > *");
	const i = checkMembers[0];
	const span = checkMembers[1];
	const submitButton = document.querySelector("input[type='submit']");

	// reset values
	check = false;
	shouldPrompt = false;

	forEach(checkMembers, function(element) {
		element.style.opacity = "1";
	});
	
	if(bool==true){

		i.setAttribute("class", "icofont-check");
		span.textContent = "Welcome back";

		// If database finds username then remove any extra fields that myt have been created
		get("login-extra").style.display = "none";
		
		try{
			get("login_phone").removeAttribute("required");
		}catch(e){
			console.log(e);
		}
		
		submitButton.value = "LOG IN";
		
	}else{
		
		// Else add extra fields for a new account
		shouldPrompt = true;

		i.setAttribute("class", "icofont-question");
		span.textContent = "New user";

		get("login-extra").style.display = "flex";
		
		try{
			get("login_phone").setAttribute("required", true);
		}catch(e){
			console.log(e);
		}
		
		submitButton.value = "Create new account";
	}

	if (submitButton.hasAttribute("disabled") == true){
		submitButton.removeAttribute("disabled");
	}
});

document.addEventListener("DOMContentLoaded", initLogin);