var voice_call_button = null, raudio = null, endVoiceCallButton = null, peerCon = null;
var currentScreen = null, timerVoice = null, counterVoice = 0;

var answerState=false; //Determines if callee accepted the call or not
var hasReceivedVoiceCall = false;

var voiceConfig = {
        'iceServers': [{ 'url' : 'stun:stun.services.mozilla.com'}, { 'url' : 'stun:stun.l.google.com:19302'}]
    },

    voiceConstraints = {
        video:false,
        audio:true
    };

socket.on('receiveVoiceCall', function(data, username){
    var signal = null;

    console.log(data);
    if(!peerCon) {
        notifyIncomingVoiceCall();
    }

     var signal = data;

     if(signal.sdp){
        if(signal.answer == true) {
        	alert("answer:"+hasReceivedVoiceCall);
            hasReceivedVoiceCall=true;
            peerCon.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        }

     }else if(signal.candidate && peerCon){
        peerCon.addIceCandidate(new RTCIceCandidate(signal.candidate));

     }else {
        console.log('end call');
        if(signal.closeConnection==true){
            console.log('end call');
            endVoiceCall();
        }
     }

});


// Prepare the page for voice calling
getRTCPeerConnection();

function getRTCPeerConnection() {
    window.RTCPeerConnection = window.RTCPeerConnection||window.webkitRTCPeerConnection||window.mozRTCPeerConnection||window.msRTCPeerConnection;
    return window.RTCPeerConnection;
}

function voicePageReady(){
    voice_call_button = get('voice-call-button');
    endVoiceCallButton = get("endVoiceCallButton");

    raudio = get("remoteAudio");

    if (navigator && navigator.getUserMedia){
        voice_call_button.removeAttribute('disabled');
        voice_call_button.addEventListener("click", makeVoiceCall);

        endVoiceCallButton.removeAttribute('disabled');
        endVoiceCallButton.addEventListener('click', endVoiceCall);

    }else{
        alert("Sorry, your browser does not support WebRTC");
    }

    console.log('voice ready');
}

// Activate all neccesity when voice call is active
function prepareVoiceCall() {
    function onAddStreamHandler(event) {
        voice_call_button.setAttribute("disabled", true);
        endVoiceCallButton.removeAttribute('disabled');
        raudio.srcObject=event.stream;
    }

    function onIceCandidateHandler(event) {
        if (!event || !event.candidate) return;
        socket.emit('sendCall', {
                sender: get_cookie('hitmee-username').value,
                receiver: get_cookie('chattingWith').value,
                type: 'voice call',
                data : {candidate : event.candidate}
            }
        );
    }

    peerCon = new webkitRTCPeerConnection(voiceConfig);
    peerCon.onicecandidate = onIceCandidateHandler;
    peerCon.onaddstream = onAddStreamHandler;
}

function makeVoiceCall(){

    function createAndSendVoiceOffer() {
        peerCon.createOffer(function(offer) {
    
            var off = new RTCSessionDescription(offer);
    
            peerCon.setLocalDescription(new RTCSessionDescription(off), function(){
                let objects = {
                    sender: get_cookie('hitmee-username').value,
                    receiver: get_cookie('chattingWith').value,
                    type: 'voice call',
                    data : {sdp : off, answer : false}
                };
    
                socket.emit('sendCall', objects);
            }, function (err) {
               console.log(err);
            });
    
        }, function (offer_error) {
            console.log(JSON.stringify(offer_error));
        });
    }



	try{
		get("ringer").src="../tones/ringing.mp3";
	}catch(e){
		alert(e);
	}
	
    currentScreen = get('chatbox');
    currentScreen.style.display='none';

    currentScreen = get('callbox');
    currentScreen.style.display='block';

    currentScreen = get('video-call');
    currentScreen.style.display='none';

    currentScreen = get('voice-call');
    currentScreen.style.display='block';
    
    currentScreen = get('ring_screen');
    currentScreen.style.display='flex';
    
    currentScreen = get('voice_call_screen');
    currentScreen.style.display='none';

  	currentScreen = get('DI');

    display_picture = get('DP').getAttribute('src');
    currentScreen.style.backgroundImage = "url('../"+display_picture+"')";

    prepareVoiceCall();
    navigator.getUserMedia(voiceConstraints,
        function(stream){

            laudioStream = stream;
            try{
            	peerCon.addStream(laudioStream);
            }catch(err){
                peerCon.addTrack(laudioStream);
            }
			
			get("voice_call_state").innerHTML = `Making voicecall to ${get_cookie('chattingWith').value}...`;
            timerVoice = setInterval(()=>{
            	
                if (hasReceivedVoiceCall==false) {
                    createAndSendVoiceOffer();
                    counterVoice++;
                    if (counterVoice >= 12){
                    	clearInterval(timerVoice);
                    	get("ringer").src="";
                    	get("voice_call_state").innerHTML = `Unable to connect with ${get_cookie('chattingWith').value}...`;
                    	setTimeout(()=>{
                    		endVoiceCall();
                    	}, 3000);
                    }
                }else{
                	console.log(hasReceivedVoiceCall);
                    get("ringer").src="";
                    
                    currentScreen = get('ring_screen');
                    currentScreen.style.display='none';
                    
                    currentScreen = get('voice_call_screen');
                    currentScreen.style.display='block';
                    
                    clearInterval(timerVoice);
                    counterVoice = 0;
                }

            }, 2500);

        },
        function(err) {
        console.log('Navigator.getUserMedia error:', err);
    });
}

function notifyIncomingVoiceCall() {
    get('notify').style.display='flex';
    get("call_notifier_text").innerHTML = `Tap to receive voice call from ${get_cookie("chattingWith").value}...`;
    get('notify').addEventListener('click', answerVoiceCall);
}

function answerVoiceCall(){

    function createAndSendVoiceAnswer() {
        peerCon.createAnswer(function(answer) {
    
            var ans = new RTCSessionDescription(answer);
    
            peerCon.setLocalDescription(ans, function(){
                let objects = {
                    sender: get_cookie('hitmee-username').value,
                    receiver: get_cookie('chattingWith').value,
                    type: 'voice call',
                    data : {sdp : ans, answer : true}
                }
                socket.emit('sendCall', objects);
    
            }, function (err) {
               console.log("err");
            });
    
        }, function (answer_error) {
            alert(answer_error);
        });
    }

    if(navigator && navigator.getUserMedia){
        get('notify').style.display='none';

        currentScreen = get('chatbox');
        currentScreen.style.display='none';

        currentScreen = get('callbox');
        currentScreen.style.display='block';

        currentScreen = get('video-call');
        currentScreen.style.display='none';

        currentScreen = get('voice-call');
        currentScreen.style.display='block';
        
        currentScreen = get('ring_screen');
        currentScreen.style.display='none';
        
        currentScreen = get('voice_call_screen');
        currentScreen.style.display='block';
        
        prepareVoiceCall();
        navigator.getUserMedia(voiceConstraints, (stream)=>{
                laudioStream = stream;
                peerCon.addStream(laudioStream);
                createAndSendVoiceAnswer();
            }, (err) => {
                console.log('Navigator.getUserMedia error:', err);
        });   
    }else{
        alert("Sorry for this, but you wont be able to pick the voice call due to lack of requirement!");
    }
}

// Ends the voice calling session
function endVoiceCall(){
	counterVoice = 0;
	
	get("ringer").src="";
	get("notify").removeEventListener("click", answerVoiceCall);
    currentScreen = get('chatbox');
    currentScreen.style.display='flex';

    currentScreen = get('callbox');
    currentScreen.style.display='none';
    
    currentScreen = get('voice_call_screen');
    currentScreen.style.display='none';
    
    let notify = get('notify');
    notify.style.display='none';

    clearInterval(timerVoice);
    try{

        if(peerCon!=null){
            peerCon.close();
            socket.emit('sendCall', {
                sender: get_cookie('hitmee-username').value,
                receiver: get_cookie('chattingWith').value,
                type: 'voice call',
                data : {closeConnection : true}
            });
        }

        peerCon = null;
        voice_call_button.removeAttribute('disabled');
        if (laudioStream){
            laudioStream.getTracks().forEach(track => {
                track.stop();
            });
        }
        if (raudio) raudio.srcObject=null;
    }catch(err){
        console.error(err);
    }

}