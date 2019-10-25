const fileHandler = (e) => {
    try {
        // debugger;
        var file = e.data.file;
        var reader = new FileReader();
        
        reader.readAsArrayBuffer(file);

        reader.onloadend = function(ev) {
            if(ev.target.readyState == FileReader.DONE){
                postMessage({
                    type: 'loaded',
                    result: reader.result
                });
            }
        };

        // reader.onprogress = function(event) {
        //     var objects ={
        //         lengthComputable: event.lengthComputable,
        //         loaded: event.loaded,
        //         total: event.total
        //     };
        //     postMessage({
        //         type: `progress`,
        //         result: objects
        //     });
        // };
    } catch (error) {
        postMessage({
            type: 'error', 
            result: error
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