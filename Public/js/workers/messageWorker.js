const messageHandler = (e) => {
    try {
        postMessage({message: `From messageWorker: ${e.data.message}`});
    } catch (error) {
        postMessage({type: 'error', message: error});
    }
};

self.addEventListener("message", messageHandler);