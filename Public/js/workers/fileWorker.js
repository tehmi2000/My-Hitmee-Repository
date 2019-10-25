const fileHandler = (e) => {
    try {
        // debugger;
        var file = e.data.file;
        console.log("fileWorker");
        var reader = new FileReader();
        
        reader.readAsDataURL(file);

        reader.onloadend = function(ev) {
            if(ev.target.readyState == FileReader.DONE){
                postMessage({
                    type: 'loaded',
                    message: reader.result
                });
            }
        };

        reader.onprogress = function(event) {
            var objects ={
                lengthComputable: event.lengthComputable,
                loaded: event.loaded,
                total: event.total
            };
            postMessage({
                type: `progress`,
                message: objects
            });
        };
    } catch (error) {
        postMessage({
            type: 'error', 
            message: error
        });
    }
};

self.addEventListener("message", fileHandler);

// self.addEventListener("file", fileHandler);
// const messageHandler = (e) => {
//     try {
//         postMessage({
//             type: `message`,
//             message: `From messageWorker: ${e.data.message}`
//         });
//     } catch (error) {
//         postMessage({
//             type: 'error', 
//             message: error
//         });
//     }
// };