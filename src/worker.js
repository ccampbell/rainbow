import Raindrop from './raindrop';

export default function rainbowWorker(e) {
    const message = e.data;

    self.languagePatterns = message.languagePatterns;
    self.bypassDefaults = message.bypassDefaults;
    self.aliases = message.aliases;
    self.globalClass = message.globalClass;

    const drop = new Raindrop();
    const result = drop.refract(message.code, message.lang);

    self.postMessage({
        id: message.id,
        lang: message.lang,
        result
    });

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
        self.close();
    }
}
