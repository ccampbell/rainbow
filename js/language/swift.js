/**
 * Swift patterns
 *
 * @author Evgenii Neumerzhitckii
 * @version 1.0.0
 */
Rainbow.extend('swift', [
    {
        'matches': {
            1: 'storage.function',
            2: 'entity.name.function'
        },
        'pattern': /(func)\s(.*?)(?=\()/g
    }
]);