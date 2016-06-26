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

    self.close();
}
