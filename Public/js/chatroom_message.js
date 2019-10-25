//'use strict';
let bmButton = null, scmButton = null, smButton = null, nmButton = null,
    delButton = null, fwdButton = null, refButton = null, infoButton = null,
    bombMessageMode = false, scheduleMessageMode = false, secretMessageMode = false, normalMessageMode = true;

let selected = [];

function readyModes() {
    bmButton = get("bomb-message");
    scmButton = get("schedule-message");
    smButton = get("secret-message");
	nmButton = get("normal-message");
	setActive(nmButton);

    delButton = get("delete-button");
        del4me = get("delete-for-me");
        delCancel = get("delete-cancel");
        del4Everyone = get("delete-for-everyone");
    fwdButton = get("forward-button");
    refButton = get("refer-button");
    infoButton = get("info-button");


    bmButton.addEventListener('click', activateBombMessaging);
    scmButton.addEventListener('click', activateScheduleMessaging);
    smButton.addEventListener('click', activateSecretMessaging);
    nmButton.addEventListener('click', activateNormalMessaging);

    delButton.addEventListener('click', createDeleteNotification);
        del4me.addEventListener('click', deleteMsg);
        delCancel.addEventListener('click', deleteMsg);
        del4Everyone.addEventListener('click', deleteMsg);

    log('Message modes ready');
}

const setActive = function(button) {
	// debugger
	forEach(document.querySelectorAll("#msg_type_wrapper button"), function(element) {
		if(element.classList.contains("active") === true){
			element.classList.remove("active");
		}
	});

	button.classList.add("active");
};

function activateBombMessaging(evt) {
    bombMessageMode = true;
    scheduleMessageMode = false;
    secretMessageMode = false;
    normalMessageMode = false;

    get('type-wrapper').style.backgroundColor = "rgb(100, 40, 40)";
  	get('tb1').style.color = "white";
	get('type-wrapper').style.boxShadow = "2px 2px 3px rgba(100, 40, 40, 0.8)";
	setActive(evt.currentTarget);

}

function activateScheduleMessaging(evt) {

    bombMessageMode = false;
    scheduleMessageMode = true;
    secretMessageMode = false;
    normalMessageMode = false;

    get('type-wrapper').style.backgroundColor = "rgb(75, 156, 125)";
    get('tb1').style.color = "white";
	get('type-wrapper').style.boxShadow = "2px 2px 3px rgba(75, 156, 125, 0.8)";
	setActive(evt.currentTarget);
}

function activateNormalMessaging(evt) {

    bombMessageMode = false;
    scheduleMessageMode = false;
    secretMessageMode = false;
    normalMessageMode = true;

    get('type-wrapper').style.backgroundColor = "rgb(240, 240, 240)";
    get('tb1').style.color = "black";
	get('type-wrapper').style.boxShadow = "2px 2px 3px rgba(240, 240, 240, 0.8)";
	setActive(evt.currentTarget);
}

function activateSecretMessaging(evt) {

    bombMessageMode = false;
    scheduleMessageMode = false;
    secretMessageMode = true;
    normalMessageMode = false;

    get('type-wrapper').style.backgroundColor = "rgb(90, 40, 100)";
    get('tb1').style.color = "white";
	get('type-wrapper').style.boxShadow = "2px 2px 3px rgba(100, 40, 40, 0.8)";
	setActive(evt.currentTarget);
}

function displayUserMessage(object){
    // debugger;
    let message = new Message(object)
    message.show()
    

    let list = get("*[data-src]");
    for(let i = 0; i < list.length; i++){
        const media = list[i];
        const img = new Image();

        img.id = media.getAttribute("data-ref");
        img.src = media.getAttribute("data-src");
        img.onload = function() {
            document.querySelector("[data-ref="+this.id+"]").src = this.src;
        };
    }
}

function deleteMsg(evt){
	
	for (let i = 0 ; i < selected.length ; i++) {
		get(selected[i].id).parentNode.style.backgroundColor='transparent';
	}
	
	if(selected.length !=0 ){
		
    	if(evt.currentTarget.id == 'delete-for-me'){
        	alert('delete4me');
        	socket.emit('delete message', get_cookie('hitmee-username').value, get_cookie('chattingWith').value, 'delete-for-me', selected)
    	}else if (evt.currentTarget.id == 'delete-for-everyone') {
        	alert('delete4everyone');
        	socket.emit('delete message', get_cookie('hitmee-username').value, get_cookie('chattingWith').value, 'delete-for-everyone', selected)
    	}else{
        
    	}
    }
    
    get('delNotify').style.display = 'none';
    selected.splice(0, selected.length);
    removeSelectionMenu(evt);
}

function showSelectionMenu(evt){
	function searchArray(value, array){
		for(let i = 0; i < array.length; i++){
			if(array[i].id == value){
				return true;
			}
		}
		
		return false;
	}
	
	try{
		if(searchArray(evt.currentTarget.id, selected) === false){
    		let currentScreen = get('div_a');
    		currentScreen.style.display = 'none';

    		currentScreen = get('div_b');
    		currentScreen.style.display = 'flex';

    		selected.push({id : evt.currentTarget.id});
    		get(evt.currentTarget.id).style.backgroundColor='rgba(100, 100, 125, 0.5)';
    	}else{
    		removeSelectionMenu(evt);
    	}
    	
    }catch(err){
    	alert(err);
    }

}

function createDeleteNotification(event) {
    let currentScreen = get('delNotify');
    currentScreen.style.display = 'block';
}

function getId(name){
	return name.split("_")[1];
}

const Message = function(details){
	this.id = details.mid
	this.details = details
	this.mode = details.mode
	this.state = details.state
	this.action = details.type
	this.type = details.message.type
	
	this.stateControl = {
		0: "icofont-check-circled",
		1: "icofont-check",
		2: "icofont-check-circled"
	}
	
	this.styleControl = {
		"post": "msg-me",
		"receive": "msg-u"
	}
	
	this.messageFormat = {
		"text": details.message.content,
		"image": "<img src=\"\" data-src=\""+details.message.content+"\" data-ref="+details.message.ref+">",
		"video": "<video src="+details.message.content+" data-ref="+details.message.ref+" controls> <i>Your browser does not support video yet</i> </video>",
		"audio": "<audio src="+details.message.content+" controls> <i>Your browser does not support audio yet</i> </audio>"
	}
	
	this.timeDisplay = {
		"normal": createText(details.timestamp+' '),
		"schedule": createText(details.timestamp+' '),
		"bomb": createText(details.duration+' min '),
		"secret": createText(details.timestamp+' ')
	}
	
	
	
	this.show = function(){
		try{
		let msg_div = create("DIV"),
			msgwrap = create("DIV"),
			msg_read_img = create('I'),
			time_div = create('DIV'),
			time = this.timeDisplay[this.mode],
			glue = create('DIV'),
			state_image = this.stateControl[this.state];
		
		time_div.classList.add('time-stamp');
		glue.classList.add(this.styleControl[this.action]);
		msgwrap.classList.add("msg-wrap");
		
		glue.setAttribute('id', this.id);
		glue.setAttribute('draggable', true);
		msgwrap.setAttribute('id', 'mw_'+this.id);
		msg_div.setAttribute('id', 'msg_'+this.id);
		msg_read_img.setAttribute('id', 'i_'+this.id);
		msg_read_img.setAttribute("class", state_image);
		
		msg_div.innerHTML = this.messageFormat[this.type];

		if(this.action == "post"){
			// document.getElementById().o
			//msgwrap.addEventListener('dragend', showSelectionMenu);
			// msgwrap.addEventListener('touchmove', handleSwipe, false);
			msgwrap.addEventListener('click', showSelectionMenu);
			time_div = joinComponent(time_div, time, msg_read_img);
		}else{
			time_div = joinComponent(time_div, time);
		}
		
		glue = joinComponent(glue, msg_div, time_div);
		msgwrap.appendChild(glue);
		chatArea1.appendChild(msgwrap);
		}catch(e){
			alert(e)
		}
	}
	
}

function removeSelectionMenu(evt){
	const target = evt.currentTarget;
	try{
		for(let i = 0 ; i < selected.length ; i++){
			if(target.id == selected[i].id){
				selected.splice(i, 1);
			}
		}
	
		if(selected.length == 0){
			let currentScreen = get('div_a');
			currentScreen.style.display = 'flex';
	
			currentScreen = get('div_b');
			currentScreen.style.display = 'none';
		}else{
			//showSelectionMenu(evt);
		}
	
		get(target.id).style.backgroundColor='transparent';
	}catch(err){
		alert(err);
	}
}

function showSelectionMenu(evt){
	function searchArray(value, array){
		for(let i = 0; i < array.length; i++){
			if(array[i].id == value){
				return true;
			}
		}

		return false;
	}

	try{
		if(searchArray(evt.currentTarget.id, selected) === false){
			let currentScreen = get('div_a');
			currentScreen.style.display = 'none';

			currentScreen = get('div_b');
			currentScreen.style.display = 'flex';

			selected.push({id : evt.currentTarget.id});
			get(evt.currentTarget.id).style.backgroundColor='rgba(100, 100, 125, 0.5)';
		}else{
			removeSelectionMenu(evt);
		}

	}catch(err){
		alert(err);
	}
}

function handleSwipe(evt){
	evt.preventDefault();
	console.log(evt);
	// showSelectionMenu(evt);
};