const onlineUsers = [];
let noOfUnreadMsg = 0;
let currentSection = "";

// Modify the array prototype
Object.defineProperty(Array.prototype, "last", {get: function(){
	return this[this.length-1];
}});

socket.on('add2Chat', function(data, picture, uID){
    let msg, f_message, messageData = data.last;

    if(messageData != undefined){
        switch (messageData.message.type) {
            case "text":
                f_message = messageData.message.content;
                break;
        
            case "image":
                f_message = "You received an image";
                break;

            case "video":
                f_message = "You received a video";
                break;

            default:
                f_message = "";
                break;
        }
    }else{
        f_message = "<i>No chat. Tap to chat</i>";
    }

    onlineUsers.forEach(person => {
        if(person.id === uID){
        	try{
        		msg = f_message;
            	person.message = msg;
            }catch(e){
            	console.log(e.message);
            }
        }
    });
    changeMessage("newMsg", msg, "m_"+uID);
});

socket.on('newconnect', function(data) {
    addNewUser(data);
});

socket.on('logged out', function(userID) {
    console.log("Logging out: ", userID);
    // debugger;
    removeUser(userID);
});

socket.on('proceed to chatroom', function (sessID, buddyName) {
    console.log('socket returned');
});

socket.on('isTyping', function (data, sender, uID) {
    console.log('receive typing event:',data);
    if (data === true) {
        changeMessage('typing', '', 'm_'+uID);
    }else{
        changeMessage('idle', '', 'm_'+uID);
    }
});

socket.on('receiveMessage', function(data, uID) {
    let messageData = data;

    if (messageData.message.type === "text") {
        f_message = messageData.message.content;
    } else if(messageData.message.type === "image"){
        f_message = "You received an image";
    }else {
        if(messageData.message.type === "video"){

        }
    }

    console.log('receive message event:',f_message);
    noOfUnreadMsg++;
    rearrange(uID);

    onlineUsers.forEach(person=>{
        if(person.id === uID){
            person.unread += 1;
            person.message = f_message;
            unread_msg(person.unread, 'c_'+uID);
        }
    });
    changeMessage('newMsg', f_message, 'm_'+uID);
});

socket.on("receiveVideoCall", function(data, username){
	if (data.closeConnection === true){
		let notification = "active";
		changeMessage('newMsg', notification, 't_'+username);
	}else{
		let notification = "<i style=\"color:#3bdc3b;\"><b>Video Calling...</b></i>";
		changeMessage('newMsg', notification, 't_'+username);
	}
});

socket.on("receiveVoiceCall", function(data, username){
	if (data.closeConnection === true){
		let notification = "active";
		changeMessage('newMsg', notification, 't_'+username);
	}else{
		let notification = "<i style=\"color:#3bdc3b;\"><b>Voice Calling...</b></i>";
		changeMessage('newMsg', notification, 't_'+username);
	}
});



const showFriendBox = function() {
    document.querySelector("aside.friend-search-box").style.top = "calc(50vh - 15vh)";
};

function showImage(event){

    let windX = parseInt(window.innerWidth),
        windY = parseInt(window.innerHeight),
        dialogWidth = Math.round(min(windX, windY)*0.8),
        dialogHeight = dialogWidth;

    gsap.fromTo("#dialog", 0.2, {
        display: "none",
        x: event.clientX,
        y: event.clientY,
        margin: 0,
        width: 0, 
        height: 0,
        opacity: 0,
        borderRadius: "50%"
    }, {
        display: "flex", 
        x: Math.round((windX-dialogWidth)/2),
        y: Math.round((windY-dialogHeight-(dialogHeight*0.25))/2),
        margin: 0,
        width: dialogWidth, 
        height: dialogHeight, 
        borderRadius: 0,
        opacity: 1
        }
    );
    get("dialog_header").innerHTML = "~"+event.currentTarget.id;
    get("dialog_download").href= event.currentTarget.src;
  	get("full-image").src= event.currentTarget.src;
  	get("full-image").addEventListener('click', hideImage);
}

function hideImage(event){

    let windX = parseInt(window.innerWidth),
        dialogWidth = Math.round(windX * 0.7),
        return_windX = Math.round((windX-dialogWidth)/2) * -1;

    gsap.to("#dialog", 0.5, {
            x: return_windX,
            y: 0,
            width: 0, 
            height: 0,
            opacity: 0,
            borderRadius: "50%",
            ease: Power0.easeNone,
            onComplete:function(evt){
                get("dialog").style.display="none";
            }
        }
    );
	get("dialog").style.width="0";
	get("dialog").style.height="0";
}

const searchForUser = function (searchParams) {
    return onlineUsers.find(itemInArray => {
        return itemInArray[searchParams.searchKey] === searchParams.searchKeyValue;
    });
}

const initiateChatroom = function (userID) {
    let chatSessionId = genHex();
    let buddyName = searchForUser({searchKey: 'id', searchKeyValue: userID}).username;
    addStoredData('chattingWith', buddyName);
    addStoredData('chatSessionId', chatSessionId);
    window.location.href = `/chat?sessionID=${chatSessionId}&chattingWith=${buddyName}`;
    // socket.emit('connectTo', event.currentTarget.id, getCookie("hitmee-username").value);
};

function getAllContact() {
    fetch(`/api/${getCookie("hitmee-username").value}/getFriends`).then(async function(response) {
        try {
            let usersOnlineList = await response.json();
            console.log(usersOnlineList);
            displayUsersOnline(usersOnlineList);
        } catch (err) {
            console.error(err);
        }
    }).catch(function(error) {
        console.error(error);
    });
}

function displayUsersOnline(array) {
    // Array contains:
    //      profile_picture
    //      sock
    //      uID
    //      username
    if (array.length === 1 && get('no-online') === null) {
        let div1 = createComponent("DIV", "No user online");
        div1.setAttribute('id', 'no-online');
        get('contact_box').appendChild(div1);
    }

    else if(array.length > 0) array.forEach(user => { addNewUser(user) });
    else{
        let div1 = createComponent("DIV", "Logging you out in 5 seconds...");
        div1.setAttribute('id', 'no-online');
        get('contact_box').appendChild(div1);

        let countOut = setTimeout(function() {
            window.location.replace("/logout");
            clearTimeout(countOut);
        }, 4997);
    }
 }

const addNewUser = function (user) {
    debugger;
    // If new user to be added isnt me...
    if(user.username !== getCookie('hitmee-username').value ){
        // Remove the 'no user online tag if it exists...
        if(get('no-online') !== null && get('no-online') !== undefined) {
            get('no-online').parentNode.removeChild(get('no-online'));
        }

        let div1 = createComponent("DIV", null, ["on_contact"]);
        let img1 = createComponent("IMG", null, ["user_dp"]);
        let div2 = createComponent("DIV", null, ["cols", "display-container"]);
        let div3 = createComponent("DIV", null, ["rows"]);
        let span1 = createComponent("SPAN", user.username, ['chat-name']);
        let span2 = createComponent("SPAN", "active", ["display-time"]);
        let div4 = createComponent("DIV", null, ["rows"]);
        let span3 = createComponent("SPAN", " ", ['chat-message']);
        let span4 = createComponent("SPAN", noOfUnreadMsg, ['unread-indicator', 'hide']);
        let span5 = createComponent("SPAN", null, ["pass-section"]);
        let button0 = createComponent("button", null, ["lock-toggle"]);
        let i0 = createComponent("i", null, ["icofont-lock"]);
        let input0 = create("input");

        img1.src = user.profile_picture;
        img1.setAttribute("id", user.username);
        input0.setAttribute("type", "password");
        img1.addEventListener('click', showImage);

        if(noOfUnreadMsg === 0){
            span4.classList.toggle('hide',true);
        }

        span2.setAttribute('id', 't_'+user.username);
        span3.setAttribute('id', 'm_'+user.uID);
        span4.setAttribute('id', 'c_'+user.uID);

        div3 = joinComponent(div3, span1, span2);
        div4 = joinComponent(div4, span3, span4);
        div2 = joinComponent(div2, div3, div4);
        button0 = joinComponent(button0, i0);
        span5 = joinComponent(span5, button0, input0);
        div1 = joinComponent(div1, img1, div2, span5);

        div1.setAttribute('id', `div_${user.uID}`);

        get('contact_box').appendChild(div1);
        if(!sessionStorage.getItem("Active Login")){
			gsap.from(`#div_${user.uID}`, 0.1, {marginLeft: "101%"});
			sessionStorage.setItem("Active Login", true);
		}
        
        div2.setAttribute('id', user.uID);
        div2.onclick = ev => { initiateChatroom(ev.currentTarget.id); };

        onlineUsers.push({
            id : user.uID,
            username : user.username,
            message : '',
            unread : 0
        });

        socket.emit('getChat', getCookie("hitmee-username").value, user.username);
    }
};

const removeUser = function (elementId) {
    let element = get('div_'+elementId);
    if(element){
        element.parentNode.removeChild(element);
    }
};

function changeMessage(type, message, id){

    let status;
    switch(true){

        case (type === "typing"):
            status = `<i style="color:#4bec4b;">typing...</i>`;
            get(id).innerHTML=status;
            break;

        case (type === 'idle'):
            console.log('online: ',onlineUsers,'\n id: ', id);

            onlineUsers.forEach(person =>{
                if(person.id === id){
                    get(id).innerHTML = person.message;
                }
            });
            break;

        case (type === 'newMsg'):
            status = message;
            get(id).innerHTML = status;
            break;

        default:
            status = "online";
            get(id).innerHTML = status;
            break;
    }

}

function unread_msg(count, id, bypass){
    bypass = bypass||false;
    // This function controls the unread messages icon and its content
    let msg = get(id);
    if(bypass === false){
        if(count === 0){
            msg.classList.toggle('hide',true);
        }else{
            msg.classList.toggle('hide',false);
            msg.innerHTML = count;
        }
    }else{
        // this else block is executed if the bypass value is true. That occurs only if a user tags a message as unread
        // manually
    }

}

function rearrange(id) {
    // ID is the id of the person that needs to be brought to top
    console.log(id);
    let wrapper = get('contact_box');
    let children = wrapper.children;
    let fragment = document.createDocumentFragment();

    for (let index = 0; index < children.length; index++) {

        if(children[index].getAttribute('id') === 'aor'){
            fragment.appendChild(children[index].cloneNode(true));
        }

        if(children[index].getAttribute('id') === id){
            fragment.appendChild(children[index].cloneNode(true));
        }
    }

    for (let idx = 0; idx < children.length; idx++) {
        if(children[idx].getAttribute('id') === id || children[idx].getAttribute('id') === 'aor'){
            continue;
        }else{
            fragment.appendChild(children[idx].cloneNode(true));
        }
    }


    wrapper.innerHTML = '';
    children = null;
    wrapper.appendChild(fragment);

    children = wrapper.children;

    for (let index = 0; index < children.length; index++) {
        
        if(children[index].getAttribute('id') === 'aor'){
            console.log('children['+index+'] is aor');
        }else{
            children[index].children[0].addEventListener('click', showImage);
            
            children[index].children[1].addEventListener('click', function(event) {
                socket.emit('connectTo', event.currentTarget.id, getCookie("hitmee-username").value);
            });
        }

    }
}

function search() {
    let search_string = document.getElementById("search").value;
    socket.emit('search_friend', getCookie("hitmee-username").value, search_string);
}

function displaySearch(details) {
        // Remove the 'no search yet...' tag
        if(document.getElementById('no-search') != null || document.getElementById('no-search') != undefined){
            document.getElementById('no-search').parentNode.removeChild(document.getElementById('no-search'));
        }

        try{
            var div0 = document.createElement("DIV");
            var h = document.createElement("H3");
            var div0_msg = document.createTextNode("Hitmee found a friend:");

            h.style.color = "rgb(120, 20, 0)";
            h.appendChild(div0_msg);
            div0.appendChild(h);

            document.getElementById("parent_wrap").innerHTML = '';

            var div1 = document.createElement("DIV");
                var div2 = document.createElement("DIV");
                    let center = document.createElement("CENTER");
                        var img1 = document.createElement("IMG");

                var div3 = document.createElement("DIV");
                    var div5 = document.createElement("DIV");
                        var span1 = createComponent("SPAN", details.username);
                        var span2 = createComponent("SPAN", '('+details.telcode+') '+details.phone);

                    var div6 = document.createElement("DIV");
                        var span3 = createComponent("SPAN", details.bio);

                var div4 = document.createElement("DIV");
                    var button = createComponent("BUTTON", "START CHAT");

                img1.src = details.profile_picture;

                img1.classList.add("user_dp");
                div1.classList.add("on_friend");
                div2.classList.add("image");
                div3.classList.add("details");
                div4.classList.add("chat_button");
                span1.classList.add('u');
                span2.classList.add('t');
                span3.classList.add('u');

                center.appendChild(img1);

                button.setAttribute('id', details.uID);

                div5 = joinComponent(div5, span1, span2);
                div6.appendChild(span3);

                div3 = joinComponent(div3, div5, div6);
                div4.appendChild(button);

                div2.appendChild(center);

                div1 = joinComponent(div1, div2, div3, div4);
                
                joinComponent(document.getElementById("parent_wrap"), div0, div1);

                // alert(JSON.stringify(details));
                button.onclick = function (event) {
                    socket.emit('addBuddy', event.currentTarget.id, getCookie("hitmee-username").value);
                };

        }catch(e){
            alert(e.message);
        }
}

function addFriend(username){
    socket.emit('addBuddy', username, getCookie("hitmee-username").value)
}

document.addEventListener("DOMContentLoaded", function(event){
	let nStatus = get("nav_status");
	let nChat = get("nav_chats");
	let nCalls = get("nav_games");
    let nFloatButton = get("add-friend");
    let sideButton = document.querySelector("#set-button");

    nFloatButton.setAttribute('onclick', "showFriendBox()");

    forEach(document.querySelectorAll(".friend-search-box .close"), function(element) {
        element.addEventListener("click", function() {
            document.querySelector("aside.friend-search-box").style.top  = "calc(0vh - 31vh)";
        });
    });

    nStatus.addEventListener('click', function(evt){
    	forEach(document.querySelectorAll(".active"), (elem)=>{
    		elem.classList.toggle("active", false);
    	});
    	evt.currentTarget.classList.toggle("active", true);
        currentSection = "status";

        get("sect").style.marginLeft="0%";
        document.querySelector("#add-friend i").setAttribute("class", "icofont-lens");
        nFloatButton.removeAttribute('onclick');
        nFloatButton.setAttribute('onclick', "navigatePage('chatroom')");
    });

	nChat.addEventListener('click', function(evt){
        forEach(document.querySelectorAll(".active"), (elem)=>{
        	elem.classList.toggle("active", false);
        });
        evt.currentTarget.classList.toggle("active", true);
        currentSection = "chats";
        
        get("sect").style.marginLeft="-100%";
        document.querySelector("#add-friend i").setAttribute("class", "icofont-search-user");
        nFloatButton.removeAttribute('onclick');
        nFloatButton.setAttribute('onclick', "showFriendBox()");
	});
	
	nCalls.addEventListener('click', function(evt){
		forEach(document.querySelectorAll(".active"), elem => {
			elem.classList.toggle("active", false);
		});
		evt.currentTarget.classList.toggle("active", true);
		currentSection = "calls";
		
        get("sect").style.marginLeft="-200%";
        document.querySelector("#add-friend i").setAttribute("class", "icofont-ui-delete");
		nFloatButton.removeAttribute('onclick');
		nFloatButton.setAttribute('onclick', "navigatePage('chats')");
    });
    
    
    sideButton.addEventListener("click", function (ev) {
        let target = ev.currentTarget;
        let element = document.querySelector("aside.side-menu");

        if(target.classList.contains("open")){
            // gsap.to(element, 0.6, { left: "120%"});
            target.classList.replace("open", "close");
        }else{
            // gsap.to(element, 0.6, { marginRight: "70%"});
            target.classList.replace("close", "open");
        }
    });

    if(currentSection === ""){
        nChat.classList.toggle("active", true);
        currentSection = "chats";
    }

    if (getCookie('hitmee-username')){
        document.querySelector("span#logo > span").innerHTML = "YOU";

        if(!sessionStorage.getItem("New") && window.speechSynthesis){
            window.speechSynthesis.speak(new SpeechSynthesisUtterance("welcome " + getCookie("hitmee-username").value));
            sessionStorage.setItem("New", true);
        }

        setTimeout(() => { getAllContact() }, 500);
	}else{
		window.addEventListener("load", function(){
            document.querySelector("span#logo > span").innerHTML = "";
			alert('Unrecognised login session!');
		});
	}
});
