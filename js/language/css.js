/**
 * CSS patterns
 *
 * @author Craig Campbell
 * @author Fabio Bucci Di Monte
 * @version 1.1.0
 */
!function(){

    'use strict';

    if(!Rainbow){
        return;
    }

    var regexes = {

        /* common */
        commonName          : /(-?\w+(?:-\w+)*)/g,
        parameters          : /\((.+)\)/g,

        /* reserved words / symbols */
        atDirective         : /(?:@[a-z]+)/g,
        exception           : /!important(?= *;)/g,
        reserved            : /(?:from|to(?! (?:top|bottom|right|left)))/g,

        /* comments */
        commentMulti        : /\/\*[^]*?\*\//gm,

        /* units */
        unitAbsolute        : /(?:p[xtc]|[cm]m|in)/g,
        unitRelative        : /(?:e[mx]|rem|ch)/g,
        unitViewport        : /(?:v(?:h|w|m(?:in|ax)))/g,
        unitAngle           : /(?:deg|g?rad|turn)/g,
        unitTime            : /(?:m?s)/g,
        unitFrequency       : /(?:k?Hz)/g,
        unitResolution      : /(?:dp(?:i|cm|px))/g,
        unitPercentage      : /%/g,

        /* values */
        valueText           : /\b\w+(?:-\w+)*\b/g,
        valueString         : /('|").*?\1/g,
        valuePath           : /[\w/-]+\.[a-z0-9]{3,4}\b(?!["'])/gi,
        valueHex            : /#(?:[a-f0-9]{6}|[a-f0-9]{3})\b/gi,
        valueNumber         : /(-?(?:\d*\.)?\d+)((?:p[xtc]|[cm]m|in)|(?:e[mx]|rem|ch)|(?:v(?:h|w|m(?:in|ax)))|(?:deg|g?rad|turn)|(?:m?s)|(?:k?Hz)|(?:dp(?:i|cm|px))|%)?/g,

        /* css rules */
        prefix              : /-(?:webkit|moz|ms|o)-/g,
        cssProperty         : /([a-z-]+)/g,
        cssMethod           : /(-?\w+(?:-\w+)*)(\(.+\))/g,
        cssSelector         : /((?:[\w.#:()+>~\[="\] -]|,\s?|&gt;)+)(?=\{)/g,

        /* ie hacks */
        cssPropertyWithHack : /([\*\+#_])?([a-z-]+)( *\/\*(?:\\\*)?\*\/)?(?= *:)/g,
        hackValue           : /((?:\\0|\\9|\\0\\9|\\9\\0)|!\w+?|\\0\/)(?= *[;}])/g,
        ieHacks             : /(_)|(\*|#|!.+)|(\*?\+|\+\*?)|(\\9)|(\\0\\9|\\9\\0)|(\/\*(?:\\\*)?\*\/)|(\\0\/)/g,

        /* entities */
        entityClass         : /\.(?!\.)\w+(?:-\w+)*/g,
        entityId            : /#(?!#[^\{])\w+(?:-\w+)*/g,
        entityPseudo        : /::?(?!::?)[a-z-]+/g,
        entityTag           : /[a-z]+\d?(?! *:.*;)/gi,
        entityAttribute     : /\[(\w+(?:-\w+)*)=(("|')?\w+(?:-\w+)*\3)]/g,

        /* siblings */
        directChild         : / ?(?:&gt;|>) ?/g,
        siblingGeneral      : / ?~ ?/g,
        siblingAdjacent     : / ?\+ ?/g,

        /* media queries */
        mediaReserved       : /\b(?:not|only|and)\b/g,
        mediaType           : /\b(?:all|aural|braille|handheld|print|projection|screen|tty|tv|embossed)\b/g,
        mediaFeature        : /\b(?:(?:(?:min|max)-)?(?:(?:device-)?(?:width|height|aspect-ratio)|color(?:-index)?|monochrome|resolution)|scan|grid|orientation)\b/g,
        mediaExpression     : /\((.+?)(?: *: *(.+?))?\)/g,
        mediaQuery          : /(?:(not|only) +)?(.+)/g,
        mediaQueryList      : / *([^,\n\r]+) */g,
        mediaQueryRule      : /(@media) +(.+)(?=\{)/g

    };

    /********************
     * @ DIRECTIVES
     ********************/

    var atDirective = {
        name: 'at-directive',
        pattern: regexes.atDirective
    };

    /********************
     * RESERVED WORDS / SYMBOLS
     ********************/

    var reserved = {
        name: 'reserved',
        pattern: regexes.reserved
    };

    var exception = {
        name: 'keyword.exception',
        pattern: regexes.exception
    };

    /********************
     * TYPES
     ********************/

    var unit = {
        absolute: {
            name: 'keyword.unit.absolute',
            pattern: regexes.unitAbsolute
        },
        relative: {
            name: 'keyword.unit.relative',
            pattern: regexes.unitRelative
        },
        viewport: {
            name: 'keyword.unit.viewport',
            pattern: regexes.unitViewport
        },
        angle: {
            name: 'keyword.unit.angle',
            pattern: regexes.unitAngle
        },
        time: {
            name: 'keyword.unit.time',
            pattern: regexes.unitTime
        },
        frequency: {
            name: 'keyword.unit.frequency',
            pattern: regexes.unitFrequency
        },
        resolution: {
            name: 'keyword.unit.resolution',
            pattern: regexes.unitResolution
        },
        percentage: {
            name: 'keyword.unit.percentage',
            pattern: regexes.unitPercentage
        }
    };

    var type = {
        attribute: {
            name: 'support.attribute-name',
            pattern: regexes.valueText
        },
        text: {
            name: 'support.text-value',
            pattern: regexes.valueText
        },
        string: {
            name: 'string',
            pattern: regexes.valueString
        },
        path: {
            name: 'constant.path',
            pattern: regexes.valuePath
        },
        hex: {
            name: 'constant.hex-color',
            pattern: regexes.valueHex
        },
        number: {
            name: 'constant.numeric',
            matches: {
                2: [
                    unit.absolute,
                    unit.relative,
                    unit.viewport,
                    unit.angle,
                    unit.time,
                    unit.frequency,
                    unit.resolution,
                    unit.percentage
                ]
            },
            pattern: regexes.valueNumber
        }
    };

    var arr_parameters = [
        type.number,
        type.path,
        type.text,
        type.string,
        type.hex
    ];

    /********************
     * HACKS (css attributes)
     ********************/

    var ieHacks = {
        name: 'hack',
        matches: {
            1: 'ie-6',
            2: 'ie-lte7',
            3: 'ie-7',
            4: 'ie-lte9',
            5: 'ie-9',
            6: 'ie-gt6',
            7: 'ie-8-9'
        },
        pattern: regexes.ieHacks
    };

    var cssHacks = {
        matches: {
            1: [ieHacks]
        },
        pattern: regexes.hackValue
    };

    /********************
     * CSS PROPERTIES / METHODS
     ********************/

    var prefix = {
        name: 'vendor-prefix',
        pattern: regexes.prefix
    };

    var cssProperties = {
        name: 'css-property',
        matches: {
            1: [prefix]
        },
        pattern: regexes.cssProperty
    };

    var cssPropertiesHacked = {
        matches: {
            1: [ieHacks],
            2: [cssProperties],
            3: [ieHacks]
        },
        pattern: regexes.cssPropertyWithHack
    };

    var cssMethods = {
        name: 'css-method',
        matches: {
            1: [
                {
                    name: 'method-name',
                    matches: {
                        1: [prefix]
                    },
                    pattern: regexes.commonName
                }
            ],
            2: [
                {
                    name: 'method-params',
                    matches: {
                        1: arr_parameters
                    },
                    pattern: regexes.parameters
                }
            ]
        },
        pattern: regexes.cssMethod
    };

    /********************
     * COMMENTS
     ********************/

    var commentMultiline = {
        name: 'comment',
        pattern: regexes.commentMulti
    };

    /********************
     * SELECTORS
     ********************/

    var entity = {
        cssClass: {
            name: 'entity.name.class',
            pattern: regexes.entityClass
        },
        cssId: {
            name: 'entity.name.id',
            pattern: regexes.entityId
        },
        cssAttribute : {
            name: 'entity.name.attribute',
            matches: {
                1: [type.attribute],
                2: [
                    type.text,
                    type.string
                ]
            },
            pattern: regexes.entityAttribute
        },
        cssPseudo: {
            name: 'entity.name.pseudo',
            pattern: regexes.entityPseudo
        },
        cssTag: {
            name: 'entity.name.tag',
            pattern: regexes.entityTag
        }
    };

    var sibling = {
        direct: {
            name: 'direct-child',
            pattern: regexes.directChild
        },
        general: {
            name: 'general-sibling',
            pattern: regexes.siblingGeneral
        },
        adjacent: {
            name: 'adjacent-sibling',
            pattern: regexes.siblingAdjacent
        }
    };

    var arr_siblings = [
        sibling.direct,
        sibling.general,
        sibling.adjacent
    ];

    var arr_commonEntities = [
        entity.cssClass,
        entity.cssId,
        entity.cssTag
    ];

    var arr_entities = arr_commonEntities.concat([
        entity.cssPseudo,
        entity.cssAttribute
    ]);

    var cssSelectors = {
        name: 'selector',
        matches: {
            1: arr_siblings.concat([reserved]).concat(arr_entities)
        },
        pattern: regexes.cssSelector
    };

    /********************
     * MEDIA QUERIES
     * ref: https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries/Using_media_queries#Pseudo-BNF_%28for_those_of_you_that_like_that_kind_of_thing%29
     ********************/

    var media = {
        reserved: {
            name: 'mediaquery.reserved',
            pattern: regexes.mediaReserved
        },
        types: {
            name: 'mediaquery.type',
            pattern: regexes.mediaType
        },
        features: {
            name: 'mediaquery.feature',
            pattern: regexes.mediaFeature
        }
    };

    media.expression = {
        name: 'mediaquery.expression',
        matches: {
            1: [media.features],
            2: arr_parameters
        },
        pattern: regexes.mediaExpression
    };

    media.query = {
        name: 'mediaquery.query',
        matches: {
            1: [media.reserved],
            2: [
                media.reserved,
                media.types,
                media.expression
            ]
        },
        pattern: regexes.mediaQuery
    };

    var mediaQuery = {
        name: 'media-query',
        matches: {
            1: 'at-directive',
            2: [
                {
                    matches: {
                        1: [media.query]
                    },
                    pattern: regexes.mediaQueryList
                }
            ]
        },
        pattern: regexes.mediaQueryRule
    };

    /********************
     * RAINBOW EXTENSION
     ********************/

    var cssSyntaxEnhanced = []
        .concat([
            commentMultiline,
            exception,
            mediaQuery,
            atDirective,
            cssSelectors,
            cssPropertiesHacked,
            cssHacks
        ])
        .concat(arr_parameters)
        .concat([
            cssMethods
        ]);

    Rainbow.extend('css', cssSyntaxEnhanced, true);

}();
