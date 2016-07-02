import Prism from './prism';

export default function rainbowWorker(e) {
    const message = e.data;

    const prism = new Prism(message.options);
    const result = prism.refract(message.code, message.lang);

    function _reply() {
        self.postMessage({
            id: message.id,
            lang: message.lang,
            result
        });
    }

    // I realized down the road I might look at this and wonder what is going on
    // so probably it is not a bad idea to leave a comment.
    //
    // This is needed because right now the node library for simulating web
    // workers “webworker-threads” will keep the worker open and it causes
    // scripts running from the command line to hang unless the worker is
    // explicitly closed.
    //
    // This means for node we will spawn a new thread for every asynchronous
    // block we are highlighting, but in the browser we will keep a single
    // worker open for all requests.
    if (message.isNode) {
        _reply();
        self.close();
        return;
    }

    setTimeout(() => {
        _reply();
    }, message.options.delay * 1000);
}
