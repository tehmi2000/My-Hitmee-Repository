'use strict';

let media = "";
let upload_media = "";

let player = null;
let username = null;
let chatArea1 = null;
let inputBox1 = null;
let stat1 = null;
let data_p = null;

const postHandler = {
    record: {
        start: start_recording,
        stop: stop_recording
    },
    post: post
};

const messageHandler = {

};

const textboxHandler = {
    input: function() {
        let speed = 0.005;
        if(get("tb1").value == ""){
            TweenMax.to("#post", speed, {zIndex: -1, opacity: 0, display: "none", ease: Power0.none});
            TweenMax.to("#record-audio", speed, {zIndex: +1, opacity: 1, display: "flex", ease: Power0.none});
        }else{
            TweenMax.to("#post", speed, {zIndex: +1, opacity: +1, display: "block", ease: Power0.none});
            TweenMax.to("#record-audio", speed, {zIndex: -1, opacity: 0, display: "none", ease: Power0.none});
        }
    },

    focus: function() {
        get("msg_type_wrapper").style.visibility = "visible";
        TweenMax.to("#msg_type_wrapper", 0.5, {opacity: 1, marginTop: "5px", ease: Power0.none});
    },

    blur: function() {
        TweenMax.to("#msg_type_wrapper", 0.5, {opacity: 0, marginTop: "-4.9rem", ease: Power0.none, onComplete:function() {
            get("msg_type_wrapper").style.visibility = "hidden";
        }});
    }
};

//  SOCKET SECTION

socket.on('receiveMessage', function(data, uID){
    receive(data.sender, data);
});

socket.on('update-message-state', function(object) {
    // debugger;
    let newImage = "";

    switch (object.state) {
        case 1:
            newImage = "icofont-check";
            break;
        
        case 2:
            newImage = "icofont-eye-alt";
            break;

        default:
            break;
    }

    const ref_message = get("i_"+object.id);
    if(ref_message){
        try{
            ref_message.classList.replace(ref_message.getAttribute("class"), newImage);
        }catch(err){
            ref_message.removeAttribute("class");
            ref_message.setAttribute("class", newImage);
        }
    }
});

socket.on("update deleted messages", function(message_ids){
    // log(message_ids);
    message_ids.forEach(message_id=>{
        log(message_id.id);
        
        let element = get("mw_"+message_id.id);
        if(element){
            log(element);
            element.parentNode.removeChild(element);
        }
    });
});

socket.on('set preferences', (settings) => {
	get('chat-area1').style.backgroundImage = (settings[0])? "url("+settings[0].chatwall+")" : "url(\"images/Hitmee_default_wallpaper.png\")";
});

socket.on('isTyping', function (data, sender, uID) {
    if(sender == get_cookie('chattingWith').value){
        if (data == true) {
            changeStatus('typing');
        }else{
            changeStatus('idle');
        }
    }
});

socket.on('add2Chat', function(data, picture){
    // alert('adding to chats :'+JSON.stringify(data));
    data_p.setAttribute('src', picture);
    
    for (let index = 0; index < data.length; index++) {
       chats.push(data[index]);
    }

    for (let index = 0; index < chats.length; index++) {
        restore(chats[index]);
    }

    // var media_list = document.querySelectorAll("[data-src]");
    // loadMedias(media_list);
    // log(media_list);
});

socket.on("disconnect", function() {
    stat1.innerHTML = "checking...";
});

socket.on("receive presence", function(status, time){
    log(status);
	try{
		const stat1 = get('status1');
		if(status == "online"){
			stat1.innerHTML = status;
		}else{
			if(status == "offline"){
				stat1.innerHTML = "Last seen today by " + time;
			}
		}
	}catch(e){
        log("Error at hitmee_chatroom.js: line 49\nError: ", e.message);
    }
});

//  FUNCTION SECTION
document.addEventListener("keydown", function(keyEvent){
    // log(keyEvent.keyCode);
    if(keyEvent.keyCode == 13){
        post();
    }
});

document.addEventListener("DOMContentLoaded", function (event) {
	try{
        // Initialise variables and states
        const chat = formatName(get_cookie("chattingWith").value);
        player = get('player');
        username = get('uname');
        chatArea1 = get('chat-area1');
        inputBox1 = get('tb1');
        stat1 = get('status1');
        data_p = get('DP');

        stat1.innerHTML = 'checking...';
        socket.emit('get preferences', get_cookie("hitmee-username").value);
        const div1 = createComponent("DIV", 'Chats are safe and secured');
        div1.setAttribute('id', 'starter');
        chatArea1.appendChild(div1);
        
        username.innerHTML = chat;
        document.title = `${get_cookie("hitmee-username").value} | You're chatting with ${chat}`;

        socket.emit('get presence', chat);
        socket.emit('getChat', get_cookie("hitmee-username").value, chat);

        // Initialise video and voice calling and message modes
        try{
            // Sorts out vendor dependencies
            getRTCPeerConnection();

            // video-calling.js --- Sorts out all video calling functionalities 
            videoPageReady();

            // voice-calling.js --- Sorts out all voice calling functionalities 
            voicePageReady();

            // recorder.js --- Sorts out all recording functionalities 
            ready_recorder();

            // chatroom_messaging.js --- Sorts out all the messaging mode functionalities
            readyModes();
            
        }catch(e){
            alert("An error occurred while loading page:" + e.message);
        }

        get("tb1").addEventListener("input", textboxHandler.input);
        get("tb1").addEventListener("focus", textboxHandler.focus);
        get("tb1").addEventListener("blur", textboxHandler.blur);

        get("post").addEventListener("click", postHandler.post);

        setTimeout(()=>{
            socket.emit("read message", "New", ["529084457472720060", "18919991706188856"]);
            log("Timer");
        }, 20000);

    }catch(err){
        log(err);
        window.location.href="/home";
    }
});

function post(evt){
    function addProgress(target_id){
        const progress = create("PROGRESS");
        progress.setAttribute("id", "prog_"+target_id);
        progress.setAttribute("min", "0");
        progress.setAttribute("max", "100");
        progress.setAttribute("value", "0");
        get("mw_"+target_id).appendChild(progress);
    }

    function generateDummyMessages(number_of_messages, message){
        for (let i = 0; i<number_of_messages; i++){
            createMessageObject("text", `Message ${i} is ${message}`);
        }
    }

    // Read through the user input and check for texts that need to be styled. 
    // Example of user input is *i am a text* which is converted to <b>I am a text</b>
    function formatInput(content){
	
		var formattedContent = "",
			startBold= false,
			endBold = false,
			startItalic = false,
			endItalic = false,
			startLink = {state: false,
						position: null},
			endLink = {state: false,
						position: null};
			
		for(let index=0; index < content.length ; index++){
			if(content.charAt(index)=='*'){
				if(startBold==false){
					startBold = true;
					content = content.substr(0, index)+"<b>"+content.substr(index+1);
				}else{
					endBold = true;
					startBold = false;
					content = content.substr(0, index)+"</b>"+content.substr(index+1);
				}
			}
			
			if(content.charAt(index)=='_'){
				if(startItalic==false){
					startItalic = true;
					content = content.substr(0, index)+"<i>"+content.substr(index+1);
				}else{
					endItalic = true;
					content = content.substr(0, index)+"</i>"+content.substr(index+1);
					endItalic = false;
					startItalic = false;
				}
			}
			
			if(content.charAt(index)=='~'){
				try{
					if(startLink.state==false){
						startLink.state = true;
						startLink.position = index;
					}else{
					
						endLink.state = true;
						endLink.position = index;
						content = content.substr(0, startLink.position)+"<a href=\"https://"+content.substr(startLink.position+1, endLink.position-startLink.position-1)+"\">"+content.substr(startLink.position+1, endLink.position-startLink.position-1)+"</a>"+content.substr(index+1);
						startLink.position = null;
						endLink.state = false;
						startLink.state = false;
					}
				}catch(e){alert(e);}
			}
		}
		
		formattedContent = content;
		return formattedContent;
    }

    // Create a template object that stores each users message details. This template is sent to the server and used to create the displayed message 
    function createMessageObject(type, contents) {
        let date=new Date(),
            mid=Math.random()*(10e17),
            content = contents.media,
            time_string=formatTime(date.getHours(), date.getMinutes());

        const object_structure = {
            sender: get_cookie('hitmee-username').value,
            receipient: get_cookie('chattingWith').value,
            message : {
                mode : null,
                messageID : mid,
                duration : null,
                timestamp : time_string,
                state: 0,
                type: 'sent',
                message : {
                    type: type,
                    ref: contents.ref,
                    content: content
                }
            }
        };

        switch (true) {
            
            case normalMessageMode:
                displayUserMessage({
                    mode : 'normal',
                    mid : mid,
                    type : 'post',
                    timestamp : time_string,
                    state: 0,
                    message : {
                        type: type,
                        ref: contents.ref,
                        content: content
                    }
                });

                object_structure.message = Object.assign({}, object_structure.message, {
                    mode: "normal"
                });

                if(type == "video" || type == "image" || type == "audio"){
                    upload(upload_media, 0, object_structure);
                    addProgress(mid);
                }else{
                    socket.emit('sendMsg2Server', object_structure);
                }
                
                break;
        
            case scheduleMessageMode:
                displayUserMessage({
                    mode : 'schedule',
                    mid : mid,
                    type : 'post',
                    timestamp : time_string,
                    state: 0,
                    message : {
                        type: type,
                        ref: contents.ref,
                        content: content
                    }
                });

                object_structure.message = Object.assign({}, object_structure.message, {
                    mode: "schedule"
                });
                socket.emit('sendMsg2Server', object_structure); 

                break;

            case bombMessageMode:
                var time = null;
                while (time == null || time < 5){
                    time = parseInt(prompt("Please enter duration of message (in minutes)", "5"));
                }
                displayUserMessage({
                    mode : 'bomb',
                    mid : mid,
                    type : 'post',
                    duration : time,
                    message : {
                        type: type,
                        ref: contents.ref,
                        content: content
                    }
                });

                object_structure.message = Object.assign({}, object_structure.message, {
                    mode: "bomb",
                    duration: time
                });
                socket.emit('sendMsg2Server', object_structure);
                
                break;
            
            case secretMessageMode:
                displayUserMessage({
                    mode : 'secret', 
                    mid : mid, 
                    type : 'post', 
                    timestamp : time_string, 
                    message : {
                        type: type,
                        ref: contents.ref,
                        content: content
                    }
                });

                object_structure.message = Object.assign({}, object_structure.message, {
                    mode: "secret"
                });
                socket.emit('sendMsg2Server', object_structure);
                
                break;

            default:
                break;
        }

        chatArea1.scrollTop = chatArea1.scrollHeight;
        inputBox1.value = "";

        // Change the button to a record button after clearing text input
        TweenMax.to("#post", 0.005, {zIndex: -1, opacity: 0, display: "none", ease: Power0.none});
        TweenMax.to("#record-audio", 0.005, {zIndex: +1, opacity: 1, display: "flex", ease: Power0.none});

        emitTyping(false);
    }

    const hex = genHex(32);

    // Determines which type of message is to be sent and which template is to be created
    // debugger;
    switch (evt.currentTarget.id) {
        case "post":
            if(inputBox1.value != ''){
                
                createMessageObject("text", {
                    ref: null,
                    media: formatInput(inputBox1.value)
                });
                // generateDummyMessages(100, tex);
            }
            break;
    
        case "post-image":
            if(media != ""){
                createMessageObject("image", {
                    ref: hex,
                    media: media
                });

                media = "";
            }
            break;
        
        case "post-video":
            if(media != ""){
                createMessageObject("video", {
                    ref: hex,
                    media: media
                });
                media = "";
            }
            break;

        case "audio-select":
            if(media != ""){
                createMessageObject("audio", {
                    ref: hex,
                    media: media
                });
                media = "";
            }
            break;

        default:
            log(evt.currentTarget.id);
            break;
    }
}

// Defines a function for handling received messages
function receive(sender, message_object) {
    log(message_object);

    if(sender === get_cookie("chattingWith").value){
        let date = new Date();
        let time_string = formatTime(date.getHours(), date.getMinutes());

        player.src = "../tones/receive1.mp3";

        switch (message_object.mode) {
            case 'normal':
                displayUserMessage({
                    mode : message_object.mode,
                    mid : message_object.messageID,
                    type : 'receive',
                    duration: null,
                    timestamp : time_string,
                    message : message_object.message
                });
                break;
        
            case 'schedule':
                displayUserMessage({
                    mode : message_object.mode,
                    mid : message_object.messageID,
                    type : 'receive',
                    duration: null,
                    timestamp : time_string,
                    message : message_object.message
                });
                break;

            case 'bomb':
                displayUserMessage({
                    mode : message_object.mode,
                    mid : message_object.messageID,
                    type : 'receive',
                    duration : message_object.duration,
                    timestamp: null,
                    message : message_object.message
                });
                break;
            
            case 'secret':
                displayUserMessage({
                    mode : message_object.mode,
                    mid : message_object.messageID,
                    type : 'receive',
                    duration: null,
                    timestamp : time_string,
                    message : message_object.message
                });
                break;

            default:
                break;
        }
        chatArea1.scrollTop = chatArea1.scrollHeight;
    }
}

// Defines a function for handling retrieved messages after page has reloaded or any activity that refreshes the display
function restore(object){
    // debugger;

    const template = {
        mode : object.mode,
        mid : object.messageID,
        type : (function(type) {
            //case to select if msg was sent or received
            return (type == "sent")? 'post' : 'receive';
        })(object.type), 
        duration: object.duration,
        timestamp : object.timestamp,
        state: object.state,
        message : object.message
    };
    
    displayUserMessage(template);
    chatArea1.scrollTop = chatArea1.scrollHeight;
}


// Defines a local array for storing messages received so that details messages can be accessed locally
function updateLocalChat(array, mid, type, msg){
    const m_object = {messageID : mid, type: type, message : msg};
    array.push(m_object);
}

// Defines a function for watch the users typing action and broadcasting it.
function emitTyping(switches) {
    // switches contains true or false
    const sent_from = get_cookie('hitmee-username').value;
    const sent_to = get_cookie('chattingWith').value;

    switch(switches){
        case true:
            socket.emit('typing', switches, sent_from, sent_to);
            break;
        
        case false:
        
            if(get('tb1').value==''){
                socket.emit('typing', switches, sent_from, sent_to);
            }
            break;

        default:
            break;
    }
}

// Defines a function for animating the opening and closing of the emoji and file picker container
function containerAnimation() {
    const container = get('ec');
    const closeContainer = function(){
        TweenMax.to("#ec", 0.30, {height : 0, onComplete: function() {
            container.innerHTML = '';
            container.style.display = 'none';
        }, onStart: function() {
            get("chat-area1").style.filter = "blur(0px)";
        }});
    };

    if(container.style.display != 'flex'){
        container.style.display = 'flex';
        container.style.height = '0px';
        TweenMax.to("#ec", 0.30, {height : "auto", onStart: function(evt) {
            get("chat-area1").style.filter = "blur(1px)";
        }});  // 0.25*window.innerHeight
        return {state : 'open', container : container};

    }else{
        closeContainer();
        return {state : 'close', container : container};
    }
    
}

function displayFileOption() {

    function progressHandler(progress_event) {
        if(progress_event.lengthComputable){
            var percentLoad = Math.round((progress_event.loaded / progress_event.total)*100);

            if (percentLoad < 100){
                get("prog").value = percentLoad;
            }
        }else{
            // log(progress_event);
        }
    }

    function pictureOptionHandler(event) {
        // alert('Picture');
        media = "";
        if(window.File && window.FileReader && event.target.files[0]){
            log("File Api supported");
            get("previewer").style.display = "flex";

            let image_holder = create("IMG"),
                progress_bar = create('progress'),
                sender_button = createComponent("BUTTON", "SEND"),
                cancel_button = createComponent("BUTTON", "CANCEL");
            
            progress_bar.id = "prog";
            progress_bar.setAttribute("min", "0");
            progress_bar.setAttribute("max", "100");
            progress_bar.setAttribute("value", "0");
            progress_bar.classList.add("progress_bar");

            image_holder.setAttribute("id", "image-selected");
            sender_button.setAttribute("id", "post-image");

            sender_button.addEventListener("click", function(evt) {
                if(get("image-select")){
                    get("image-select").value = "";
                }

                if(get("previewer")){
                    get("previewer").innerHTML = "";
                    get("previewer").style.display = "none";
                }
                post(evt);
            });

            cancel_button.addEventListener("click", function(evt) {
                if(get("image-select")){
                    get("image-select").value = "";
                }

                if(get("previewer")){
                    get("previewer").innerHTML = "";
                    get("previewer").style.display = "none";
                }
            });
            
            const fileWorker = new Worker("js/workers/fileWorker.js");
            const file = event.target.files[0];
            upload_media = file;
            
            log(file);

            fileWorker.postMessage({
                file: file
            });

            fileWorker.onerror = e => {
                log(e);
                fileWorker.terminate();
            };

            fileWorker.onmessage = e => {

                switch (e.data.type) {
                    case 'loaded':
                        get("prog").value = "100";
                        image_holder.src = e.data.message;
                        media = e.data.message;
                        fileWorker.terminate();
                        break;
                
                    case 'progress':
                        progressHandler(e.data.message);
                        break;

                    case 'error':
                        console.error(e.data);
                        break;

                    default:
                        console.error(e.data);
                        break;
                }
            };

            joinComponent(get("previewer"), progress_bar, image_holder, cancel_button, sender_button);

        }else{
            const button_dismiss = createComponent("BUTTON", "DISMISS");

            button_dismiss.addEventListener("click", function() {
                if(get("1")) get("1").parentNode.removeChild(get("1"));
            });

            notify("1", "Your browser does not support this action!", button_dismiss);
        }
        
    }

    function audioOptionHandler(event) {
        // alert('audio');
        media = "";
        if(window.File && window.FileReader && event.target.files[0]){
            log("File Api supported for audio");

            const fileWorker = new Worker("js/workers/fileWorker.js");
            const file = event.target.files[0];
            log("File size: ", event.target.files[0].size);

            upload_media = file;

            fileWorker.postMessage({
                file: file
            });

            fileWorker.onerror = e => {
                log(e);
                fileWorker.terminate();
            };

            fileWorker.onmessage = e => {

                switch (e.data.type) {
                    case 'loaded':

                        media = e.data.message;
                        post({
                            currentTarget:{
                                id: "audio-select"
                            }
                        });

                        fileWorker.terminate();
                        break;
                
                    case 'progress':
                        log("audio progress");
                        break;

                    case 'error':
                        console.error(e.data);
                        break;

                    default:
                        log(e.data);
                        break;
                }
            };

        }else{
            const button_dismiss = createComponent("BUTTON", "DISMISS");
            button_dismiss.addEventListener("click", function(button_event) {
                if(get("1")) get("1").parentNode.removeChild(get("1"));
            });

            notify("1", "Your browser does not support this action!", button_dismiss);
        }
    }

    function videoOptionHandler(event) {
        // alert('video');
        if(window.File && window.FileReader ){
            log("File Api supported for video");
            if(event.target.files[0]){
                get("previewer").style.display= "flex";

                const fileWorker = new Worker("js/workers/fileWorker.js");
                const file = event.target.files[0];
                upload_media = file;

                const max_length = 100000000;
                const truncated_file = (file.size > max_length)? file.slice(0, max_length) : file;

                let video_holder = create("VIDEO"),
                    progress_bar = create('PROGRESS'),
                    button_wrapper = create("DIV"),
                        sender_button = createComponent("BUTTON", "SEND"),
                        cancel_button = createComponent("BUTTON", "CANCEL");
                
                progress_bar.id = "prog";
                progress_bar.setAttribute("min", "0");
                progress_bar.setAttribute("max", "100");
                progress_bar.setAttribute("value", "0");
                progress_bar.classList.add("progress_bar");

                video_holder.setAttribute("id", "video-select");
                video_holder.setAttribute("controls", true);
                video_holder.setAttribute("autoplay", true);
                sender_button.setAttribute("id", "post-video");

                sender_button.addEventListener("click", function(evt) {
                    if(get("video-select")){
                        get("video-select").value = "";
                    }
                    
                    if(get("previewer")){
                        get("previewer").innerHTML = "";
                        get("previewer").style.display = "none";
                    }

                    post(evt);
                });

                cancel_button.addEventListener("click", function(evt) {
                    if(get("video-select")){
                        get("video-select").value = "";
                    }
                    
                    if(get("previewer")){
                        get("previewer").innerHTML = "";
                        get("previewer").style.display = "none";
                    }
                    fileWorker.terminate();
                });
                

                fileWorker.postMessage({
                    file: truncated_file
                });

                fileWorker.onerror = e => {
                    log(e);
                    fileWorker.terminate();
                };

                fileWorker.onmessage = e => {

                    switch (e.data.type) {
                        case 'loaded':
                            get("prog").value = "100";
            
                            video_holder.src = e.data.message;
                            media = e.data.message;
                            fileWorker.terminate();
                            break;
                    
                        case 'progress':
                            progressHandler(e.data.message);
                            break;

                        case 'error':
                            console.error(e.data);
                            break;

                        default:
                            console.error(e.data);
                            break;
                    }

                };

                log("File size: ", truncated_file.size);
                button_wrapper = joinComponent(button_wrapper, cancel_button, sender_button);
                joinComponent(get("previewer"), progress_bar, video_holder, button_wrapper);
            }

        }else{
            const button_dismiss = createComponent("BUTTON", "DISMISS");
            button_dismiss.addEventListener("click", function() {
                if(get("1")) get("1").parentNode.removeChild(get("1"));
            });

            notify("1", "Your browser does not support this action!", button_dismiss);
        }
    }

    function contactOptionHandler(event) {
        alert('contact');
    }

    function locationOptionHandler(event) {
        alert('location');

        if(navigator.geolocation){
            const options = {
                enableHighAccuracy: true,
                timeout : 10000,
                maximumAge : 5000
            };

            navigator.geolocation.getCurrentPosition(position => {
                log(position);

            }, error => {
                log(error);

                const dismiss = createComponent("BUTTON", "Dismiss");

                dismiss.addEventListener("click", function(){
                    get("n1").parentNode.removeChild(get("n1"));
                });

                const error_codes = {
                    0: "unknown error",
                    1: "permission denied",
                    2: "position unavailable",
                    3: "timeout"
                };

                notify("n1", error.message, dismiss);
            }, options);
        }
    }

    function documentOptionHandler(event) {
        alert('document');
    }
    
    function createOption(container, no_of_options, value) {

        // <div class="fill-container cols">
        //     <div class="head-label">
        //         <span class="icofont-close" title="close"></span>
        //     </div>
        // </div>

        let closeButton = create("DIV");
            let div0 = create("DIV");
                let span0 = create("SPAN");

        closeButton.classList.add("fill-container", "cols");
        div0.classList.add("head-label");
        span0.classList.add("icofont-close");
        span0.setAttribute("title", "close");

        closeButton.addEventListener("click", function() {
            containerAnimation();
        });

        div0.appendChild(span0);
        closeButton.appendChild(div0);

        container.appendChild(closeButton);

        for (let index = 0; index < no_of_options; index++) {

            let option_wrap = create('DIV'),
                    option_label = create("label"),
                        image = create('I'),
                    option = create('INPUT'),
                    description = create('DIV');

            option.setAttribute("type", "file");
        
            option_label.classList.add('file-option');
            option_wrap.classList.add('file-option-wrap');
            option.addEventListener("click", function(evt) {
                let result = containerAnimation();
            });

            switch (index) {
                case 0: // Image
                    option_label.setAttribute("for", "image-select");
                    option.setAttribute("id", "image-select");
                    option.setAttribute("accept", "image/*");

                    description.innerHTML = "Picture";
                    image.classList.add('icofont-picture');
                    option.style.backgroundColor = 'rgba(73, 73, 73, 0.937)';

                    option.addEventListener('change', pictureOptionHandler);
                    option_label.appendChild(image);

                    option_wrap = joinComponent(option_wrap, option_label, option, description);
                    break;

                case 1: // Video
                    option_label.setAttribute("for", "video-select");
                    option.setAttribute("id", "video-select");
                    option.setAttribute("accept", "video/*");

                    description.innerHTML = "Video";
                    image.classList.add('icofont-video');
                    option.style.backgroundColor = 'black';

                    option.addEventListener('change', videoOptionHandler);
                    
                    option_label.appendChild(image);
                    option_wrap = joinComponent(option_wrap, option_label, option, description);
                    break;

                case 2:
                    option_label.setAttribute("for", "audio-select");
                    option.setAttribute("id", "audio-select");
                    option.setAttribute("accept", "audio/*");

                    description.innerHTML = "Audio";
                    image.classList.add('icofont-play-alt-3');
                    option.style.backgroundColor = 'black';

                    option.addEventListener('change', audioOptionHandler);
                    
                    option_label.appendChild(image);
                    option_wrap = joinComponent(option_wrap, option_label, option, description);
                    break;

                case 3:
                    option_label.setAttribute("for", "contact-select");
                    option.setAttribute("id", "contact-select");
                    option.setAttribute("accept", "mpeg/*");

                    description.innerHTML = "Contact";
                    image.classList.add('icofont-ui-user');
                    option.style.backgroundColor = 'black';

                    option.addEventListener('change', contactOptionHandler);
                    
                    option_label.appendChild(image);
                    option_wrap = joinComponent(option_wrap, option_label, option, description);
                    break;
                
                case 4:
                    option_label.setAttribute("for", "document-select");
                    option.setAttribute("id", "document-select");
                    option.setAttribute("accept", ".doc, .pdf, .docx, .xml, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document");

                    description.innerHTML = "Document";
                    image.classList.add('icofont-file-document');
                    option.style.backgroundColor = 'black';

                    option.addEventListener('change', documentOptionHandler);
                    
                    option_label.appendChild(image);
                    option_wrap = joinComponent(option_wrap, option_label, option, description);
                    break;
            
                case 5:
                    option_label.setAttribute("id", "location-select");

                    description.innerHTML = "Location";
                    image.classList.add('icofont-google-map');
                    option.style.backgroundColor = 'tan';

                    option_label.addEventListener('click', locationOptionHandler);
                    option_label.appendChild(image);

                    option_wrap = joinComponent(option_wrap, option_label, option, description);
                    
                    break;
                default:
                    alert('Nothing yet');
                    break;
            }

            container.appendChild(option_wrap);
        }
    }

    let result = containerAnimation();
    if(result.state =='open'){
        const values = [ 'lilac', 'purple', 'black', 'red', 'brown', 'green', 'tan', 'salmon', 'wine', 'maroon' ];
        result.container.style.justifyContent = "space-around";
        createOption(result.container, 6, values);
    }else{

    }
}

function createAndDisplayEmoji() {
    
    function createEmoji(container, no_of_emoji, value) {
        for (let index = 0; index < no_of_emoji; index++) {
            const option = createComponent('DIV', String.fromCodePoint(value[index]));
            option.classList.add('emoji-option');

            option.setAttribute('id', value[index]);

            option.addEventListener('click', function(event){
                let inputBox = get('tb1');
                inputBox.value = inputBox.value + String.fromCodePoint(event.currentTarget.id)+' ';
                inputBox.value = inputBox.value;
            });

            container.appendChild(option);
        }
    }
    var result = containerAnimation();
    if(result.state =='open'){
        const values = [  0x1F600, 0x1F601, 0x1F602, 0x1F923, 0x1F603, 0x1F604,  
                        0x1F605, 0x1F606, 0x1F607, 0x1F608, 0x1F609, 0x1F610,
                        0x1F611, 0x1F612, 0x1F613, 0x1F614, 0x1F615, 0x1F616, 
                        0x1F617, 0x1F618, 0x1F619, 0x1F620, 0x1F621, 0x1F622, 
                        0x1F624, 0x1F625, 0x1F626, 0x1F623, 0x1F627, 0x1F628, 
                        0x1F629, 0x1F630, 0x1F631, 0x1F632, 0x1F633, 0x1F634,
                        0x1F643, 0x1F60D, 0x263A,  0x1F61A, 0x1F61B, 0x1F61C,
                        0x1F92A, 0x1F61D, 0x1F911, 0x1F917, 0x1F92D, 0x1F92B,
                        0x1F914, 0x1F910, 0x1F928, 0x1F636, 0x1F60F, 0x1F612,
                        0x1F644, 0x1F62C,
                        0x1F526, 0x1F527, 0x1F528, 0x1F529, 0x1F530, 0x1F531
                          ];
        result.container.style.justifyContent = "unset";
        createEmoji(result.container, values.length, values);
    }
}

function getRTCPeerConnection() {
    window.RTCPeerConnection = window.webkitRTCPeerConnection||window.mozRTCPeerConnection||window.msRTCPeerConnection||window.RTCPeerConnection;
    return window.RTCPeerConnection;
}

/**
 * 
 * @param {*} file 
 * @param {*} count 
 * @param {*} body 
 */
function upload(file, count, body) {

    // Rate is the amount of kilobyte that is processed per second
    // Count is the number of rate that has been processed
    // Start is the start position of the slice
    // End is the end position of the slice

    body = body || null;

    const uploadWorker = new Worker("js/workers/storageWorker.js");
    const rate = 128000;
    var slice;

    if(file.size > rate){
        var start = (count * rate);
        var end = start + Math.min(file.size-start, rate);
        slice = file.slice(start, end);
    }else{
        slice = file;
    }

    uploadWorker.postMessage({
        file: slice
    });

    uploadWorker.onerror = e => {
        log(e);
        fileWorker.terminate();
    };

    uploadWorker.onmessage = e => {

        switch (e.data.type) {
            case 'loaded':
                socket.emit("upload", {
                    sender: get_cookie("hitmee-username").value,
                    receipient: get_cookie("chattingWith").value,
                    body: body,
                    file: {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        data: e.data.result
                    }
                });

                uploadWorker.terminate();
                break;

            case 'error':
                console.error(e.data);
                break;

            default:
                console.error(e.data);
                break;
        }

    };
}

socket.on("upload-next", function(object) {
    // log((object.slice_count/(Math.round(upload_media.size/100000)))*100);
    if(get("prog_"+object.id)){
        let value = (object.slice_count/(Math.round(upload_media.size/100000)))*100;
        get("prog_"+object.id).setAttribute("value", value);
    }
    upload(upload_media, object.slice_count);
});

socket.on("upload-end", function(object) {
    upload_media = "";
    media = object.path;

    if(get("prog_"+object.body.message.messageID)){
        get("prog_"+object.body.message.messageID).parentNode.removeChild(get("prog_"+object.body.message.messageID));
    }
    object.body.message.message.content = object.path;
    socket.emit('sendMsg2Server', object.body);
    log(object.body);
});