
function ready_recorder(){
    recordAudio = get("record-audio");

    if (navigator && navigator.mediaDevices && navigator.getUserMedia){
        recordAudio.removeAttribute('disabled');
        recordAudio.addEventListener('mousedown', postHandler.record.start);
        recordAudio.addEventListener('mouseup', postHandler.record.stop);
    }else{
        alert("Sorry, your browser does not support WebRTC");
    }
}

function start_recording(){
    function handleSuccess(stream) {
        var context = new AudioContext();
        var source = context.createMediaStreamSource(stream);
        var processor = context.createScriptProcessor(1024, 1, 1);

        source.connect(processor);
        processor.connect(context.destination);

        processor.onaudioprocess = function(e) {
            // console.log(e.inputBuffer);
            get("player").src = e.inputBuffer;
        };
    }

    var config = {
        audio: true,
        video: false
    };


    navigator.mediaDevices.getUserMedia(config).then(handleSuccess);
}

function stop_recording() {
    
}