var video_call_button = null, 
    lvideo = null, 
    rvideo = null, 
    endVideoCallButton = null, 
    peerVideoCon = null, 
    currentScreen = null, 
    timerVideo = null, 
    counter = 0;

var answerVideoState = false, //Determines if callee accepted the call or not
    hasReceivedVideoCall = false;

var videoConstraints = {
        video:true,
        audio:true
    };
    videoConfig = {
        'iceServers': [{ 'url' : 'stun:stun.services.mozilla.com'}, { 'url' : 'stun:stun.l.google.com:19302'}]
    };

socket.on('receiveVideoCall', function(data, username){
    // console.log('call enter');
    var signal = null;

    if(!peerVideoCon) {
        notifyIncomingVideoCall();
    }

     var signal = data;

     if(signal.sdp){
        if(signal.answer == true) {
            alert("answer-video:"+hasReceivedVideoCall);
            hasReceivedVideoCall=true;
            peerVideoCon.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        }

     }else if(signal.candidate){
        peerVideoCon.addIceCandidate(new RTCIceCandidate(signal.candidate));

     }else {
        console.log('end call');
        if(signal.closeConnection){
            console.log('end call');
            clearInterval(timerVideo);
            endVideoCall();
        }
     }

 });

function videoPageReady(){
    video_call_button = get('video-call-button');
    endVideoCallButton = get("endVideoCallButton");

    lvideo = get("localVideo");
    lvideo.addEventListener('click', function(evt){});

    rvideo = get("remoteVideo");

    if (navigator && navigator.getUserMedia){
        video_call_button.removeAttribute('disabled');
        video_call_button.addEventListener("click", makeVideoCall);

        endVideoCallButton.removeAttribute('disabled');
        endVideoCallButton.addEventListener('click', endVideoCall);
    }else{
        console.log("Sorry, your browser does not support WebRTC");
    }

    console.log('video ready');
}

function makeVideoCall(){

    function createAndSendVideoOffer() {
        peerVideoCon.createOffer(function(offer) {
    
            var off = new RTCSessionDescription(offer);
    
            peerVideoCon.setLocalDescription(off, function (){
                socket.emit('sendCall', {sender: get_cookie('hitmee-username').value, receiver: get_cookie('chattingWith').value, type: 'video call', data : {sdp : off}});
            }, function (err) {
               console.log(err.message); 
            });
    
        }, function (error) {
            console.log(error.message);
        });
    }

    currentScreen = get('chatbox');
    currentScreen.style.display='none';

    currentScreen = get('callbox');
    currentScreen.style.display='block';

    currentScreen = get('video-call');
    currentScreen.style.display='block';

    currentScreen = get('voice-call');
    currentScreen.style.display='none';

    prepareVideoCall();
    navigator.getUserMedia(videoConstraints, stream=>{
        lvideoStream = stream;
        lvideo.srcObject = lvideoStream;
        try{
            peerVideoCon.addStream(lvideoStream);
        }catch(err){
            peerVideoCon.addTrack(lvideoStream);
        }

        timerVideo = setInterval(()=>{
            if (hasReceivedVideoCall==false) {
                // console.log('hasReceivedVideoCall:', hasReceivedVideoCall);
                createAndSendVideoOffer();
                counter++;
                if (counter>=12){
                    clearInterval(timerVideo);
                    endVideoCall();
                }
            }else{
                // console.log('hasReceivedVideoCall:', hasReceivedVideoCall);
                clearInterval(timerVideo);
                counter=0;
            }
            
        }, 3500);
        
    }, err=> {
        console.log('Navigator.getUserMedia error:', err.message);
    });
}

function notifyIncomingVideoCall() {
    let notify = get('notify');
	get("call_notifier_text").innerHTML = `Tap to receive video call from ${get_cookie("chattingWith").value}...`;
    notify.style.display='flex';
    notify.addEventListener('click', function(evt) {
        answerVideoCall();
    });
}

function answerVideoCall(){

    function createAndSendVideoAnswer() {
        peerVideoCon.createAnswer(function(answer) {
    
            var ans = new RTCSessionDescription(answer);
    
            peerVideoCon.setLocalDescription(ans, function(){
                socket.emit('sendCall', {sender: get_cookie('hitmee-username').value, receiver: get_cookie('chattingWith').value, type: 'video call', data : {sdp : ans, answer : true}});
            }, function (err) {
               console.log(err.message); 
            });
    
        }, function (err) {
            console.log(err.message);
        });
    }

    if(navigator && navigator.getUserMedia){
        get('notify').style.display='none';

        currentScreen = get('chatbox');
        currentScreen.style.display='none';

        currentScreen = get('callbox');
        currentScreen.style.display='block';

        currentScreen = get('video-call');
        currentScreen.style.display='block';

        currentScreen = get('voice-call');
        currentScreen.style.display='none';
        
        prepareVideoCall();
        navigator.getUserMedia(videoConstraints, 
            function(stream){
                let lvideo = get("localVideo");
                lvideoStream = stream;
                lvideo.srcObject = lvideoStream;
                peerVideoCon.addStream(lvideoStream);
                createAndSendVideoAnswer();
            }, function(err) {
            console.log('Navigator.getUserMedia error:', err.message);
        }); 
    }else{
        alert("Sorry for this, but you wont be able to pick the video call due to lack of requirement!");
    }   
}

function prepareVideoCall() {

    function onIceCandidateHandler(event) {
        if (!event || !event.candidate) return;
        socket.emit('sendCall', {sender: get_cookie('hitmee-username').value, receiver: get_cookie('chattingWith').value, type: 'video call', data : {candidate : event.candidate}});
    }

    function onAddStreamHandler(event) {
        video_call_button.setAttribute("disabled", true);
        endVideoCallButton.removeAttribute('disabled');
        rvideo.srcObject=event.stream;
    }

    peerVideoCon = new webkitRTCPeerConnection(videoConfig);
    peerVideoCon.onicecandidate = onIceCandidateHandler;
    peerVideoCon.onaddstream = onAddStreamHandler;
}

function endVideoCall(){
    // hasReceivedVideoCall = true;
    currentScreen = get('chatbox');
    currentScreen.style.display='flex';

    currentScreen = get('callbox');
    currentScreen.style.display='none';

    let notify = get('notify');
    notify.style.display='none';

    try{
        if(peerVideoCon!=null) {
            peerVideoCon.close();
            socket.emit('sendCall',{sender: get_cookie('hitmee-username').value, receiver: get_cookie('chattingWith').value, type: 'video call', data : {closeConnection : true}});
        }
        peerVideoCon = null;
        video_call_button.removeAttribute('disabled');

        if (lvideoStream){
            lvideoStream.getTracks().forEach(track => {
                track.stop();
            });
            lvideo.srcObject=null;
        }
        if (rvideo) rvideo.srcObject=null;

    }catch(err){
        console.log(err.message);
    }
    
}