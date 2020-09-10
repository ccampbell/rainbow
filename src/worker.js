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

    if (message.isNode) {
        _reply();
        return;
    }

    setTimeout(() => {
        _reply();
    }, message.options.delay * 1000);
}
