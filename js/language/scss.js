/**
 * SCSS patterns
 * 
 * @author Fabio Bucci Di Monte
 * @version 1.0.1
 */
!function(){

    'use strict';

    var regexes = {

        /* common */
        anyChars            : /(.+)/g,// <- added for SCSS
        commonName          : /(?=-?[\w#]+)((?:[\w-]+)*(?:#\{[^}]+})?(?:[\w-]*\w+)*)/g,// <- enhanced for SCSS (interpolations)
        parameters          : /\((.*)\)/g,// <- enhanced for SCSS (accepts void parameters)
        parametersEnhanced  : /\((.*)\)/g,// <- added for SCSS (same regex as above)

        /* reserved words / symbols */
        atDirective         : /(?:@[a-z]+)/g,
        exception           : /!(?:important|default|optional)(?= *;)/g,// <- enhanced for SCSS
        reserved            : /(?:and|or|not|in|from|through|to(?! (?:top|bottom|right|left)))/g,// <- enhanced for SCSS

        /* comments */
        commentMulti        : /\/\*([^]*?)\*\//gm,// <- enhanced for SCSS (interpolations)
        commentSingle       : /\/\/(.*?)$/gm,// <- added for SCSS

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
        valueText           : /(-(?:webkit|moz|ms|o)-)?\b\w+(?:-\w+)*\b/g,
        valueString         : /('|")(.*?)\1/g,// <- enhanced for SCSS (grouped string content for interpolations recognition)
        valuePath           : /[\w/-]+\.[a-z0-9]{3,4}\b(?!["'])/gi,
        valueHex            : /#(?:[a-f0-9]{6}|[a-f0-9]{3})\b/gi,
        valueNumber         : /(-?(?:\d*\.)?\d+)((?:p[xtc]|[cm]m|in)|(?:e[mx]|rem|ch)|(?:v(?:h|w|m(?:in|ax)))|(?:deg|g?rad|turn)|(?:m?s)|(?:k?Hz)|(?:dp(?:i|cm|px))|%)?/g,

        /* css rules */
        prefix              : /-(?:webkit|moz|ms|o)-/g,
        cssProperty         : /([a-z-]+)/g,
        cssMethod           : /(-?\w+(?:-\w+)*)(\(.+\))/g,
        cssMethodEnhanced   : /(?=(?:-?[\w#{$} "'!=*/+])+\(.*\))((?:[\w-]+)*(?:#\{[^}]+})?(?:[\w-]*\w+)*)(\(.*\))/g,// <- added for SCSS
        cssSelector         : /((?:[\w.#:()%+>~\[="\] -]|\{.+}|,\s?|&(?:gt|amp);)+)(?=\{)/g,// <- enhanced for SCSS (interpolations, placeholders, parent selectors)

        /* ie hacks */
        cssPropertyWithHack : /([\*\+#_])?([a-z-]+)( *\/\*(?:\\\*)?\*\/)?(?= *:)/g,
        hackValue           : /((?:\\0|\\9|\\0\\9|\\9\\0)|!\w+?|\\0\/)(?= *[;}])/g,
        ieHacks             : /(_)|(\*|#|!.+)|(\*?\+|\+\*?)|(\\9)|(\\0\\9|\\9\\0)|(\/\*(?:\\\*)?\*\/)|(\\0\/)/g,

        // TODO: improve entity regexes - eg. change [\w-]+ into \w+(?:-\w+)*
        /* entities */
        entityClass         : /\.(?!\.)[\w-]*(#\{[^}]+})?[\w-]*/g,// <- enhanced for SCSS (interpolations)
        entityId            : /#(?!#[^{])[\w-]*(#\{[^}]+})?[\w-]*/g,// <- enhanced for SCSS (interpolations)
        entityPseudo        : /::?(?!::?)[a-z-]*(#\{[^}]+})?[a-z-]*/g,// <- enhanced for SCSS (interpolations)
        entityTag           : /[a-z]+\d?(#\{[^}]+})?(?! *:.*;)/gi,// <- enhanced for SCSS (interpolations)
        entityAttribute     : /\[([\w#{$}-]+)=(("|')?[\w#{$}-]+\3)]/g,// <- enhanced for SCSS (interpolations)
        entityParent        : /(?:&amp;|&)(?!(?:&amp;|&))/g,// <- added for SCSS
        entityPlaceholder   : /%(?!%)\w+(?:-\w+)*/g,// <- added for SCSS

        /* siblings */
        directChild         : / ?(?:&gt;|>) ?/g,
        siblingGeneral      : / ?~ ?/g,
        siblingAdjacent     : / ?\+ ?/g,

        /* media queries */
        mediaReserved       : /\b(?:not|only|and)\b/g,
        mediaType           : /\b(?:all|aural|braille|handheld|print|projection|screen|tty|tv|embossed)\b/g,
        mediaFeature        : /(-(?:webkit|moz|ms|o)-)?\b(?:(?:(?:min|max)-)?(?:(?:device-)?(?:width|height|(?:pixel|aspect)-ratio)|color(?:-index)?|monochrome|resolution)|scan|grid|orientation)\b/g,
        mediaExpression     : /\(([^:]+)(?: *: *([^)]+))?\)/g,
        mediaQuery          : /(?:(not|only) +)?(.+)/g,
        mediaQueryList      : / *([^,\n\r]+) */g,
        mediaQueryRule      : /(@media) +(.+)(?=\{)/g,

        /* scss only */
        constant            : /\b(?:true|false|null)\b/g,
        variable            : /\$\w+(?:-\w+)*/g,
        operator            : /(&[lg]t;|<|>|==|!=|\/|\*|\+|\-)(?!\1)/g,
        interpolation       : /#\{([^}]+)}/g,

        /* scss directives */
        scssList            : /\(((?:[^,\s]+ ?, ?)+)([^,\s]+)\)/g,
        scssExtend          : /(@extend) +([.#%]?\w+(?:-\w+)*)(?= *;)/g,
        scssImport          : /(@import) +(('|").+\3)(?= *;)/g,
        scssInclude         : /(@include) +(\w+(?:-\w+)*)(\(.*\))?(?= *(?:;|\{))/g,
        scssMethod          : /(@function) +(\w+(?:-\w+)*)(\(.*\))/g,
        scssMixin           : /(@mixin) +(\w+(?:-\w+)*)(?: *(\(.*\)))?(?= *\{)?/g,
        scssLoopFor         : /(@for) +(.+)(?= *\{)/g,
        scssLoopEach        : /(@each) +(.+)(?= *\{)/g,
        scssLoopWhile       : /(@while)(?: |\((?=.+\)))+(.+?)\)?(?= *\{)/g,
        scssCondition       : /(@(?:else )?if)(?: |\((?=.+\)))+(.+?)\)?(?= *\{)/g,
        scssTernary         : /\b(if) *(\(.+,.+,.+\))/g,
        scssMaps            : /\(((?:\s*(?:("|')?\w+(?:-\w+)*\2 *: *.+|\/\*[^]*?\*\/|\/\/.*?$))+\s*\))(?=;)/gm,

        /* scss directives syntax */
        scssLoopForSyntax   : /(.+) +(from) +(.+) +(to|through) +(.+)/g,
        scssLoopEachSyntax  : /(.+) +(in) +(.+)/g,
        scssLoopWhileSyntax : /(.+) +(.+) +(.+)/g,
        scssTernarySyntax   : /\((.+),(.+),(.+)\)/g,
        scssMapsSyntax      : /(("|')?\w+(?:-\w+)*\2) *: *((?:[\w"' $\(\),\*\+-]|\/(?!\/))+)(?=,.*\n?|\n?\s*\)| \/\/)/g

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

    var operator = {
        name: 'constant.operator',
        pattern: regexes.operator
    };

    var constant = {
        name: 'scss.constant',
        pattern: regexes.constant
    };

    var variable = {
        name: 'scss.variable',
        pattern: regexes.variable
    };

    var prefix = {
        name: 'vendor-prefix',
        pattern: regexes.prefix
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
            matches: {
                1: [prefix]
            },
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
        operator,
        variable,
        constant,
        type.number,
        type.path,
        type.text,
        type.string,
        type.hex
    ];

    var scssList = {
        name: 'scss.list',
        matches: {
            1: arr_parameters,
            2: arr_parameters
        },
        pattern: regexes.scssList
    };

    arr_parameters.unshift(scssList);

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

    // method inside a method (as parameter) – note: weirdly there is no easier way to achieve the same result..
    var cssMethodsEnhanced = {
        name: cssMethods.name,
        matches: {
            1: cssMethods.matches[1],
            2: [
                {
                    name: cssMethods.matches[2][0].name,
                    matches: {
                        1: [cssMethods].concat(arr_parameters)
                    },
                    pattern: regexes.parametersEnhanced// same as regexps.parameters (won't work if using the same) (??)
                }
            ]
        },
        pattern: regexes.cssMethodEnhanced
    };

    var interpolation = {
        name: 'scss.interpolation',
        matches: {
            1: [cssMethodsEnhanced].concat(arr_parameters)
        },
        pattern: regexes.interpolation
    };

    // interpolation inside a string
    arr_parameters.unshift({
        name: 'string',
        matches: {
            2: [interpolation]
        },
        pattern: regexes.valueString
    });

    // interpolation inside method name
    // TODO (fix) weirdly will not consider methods inside interpolation that is part of another method's name
    // eg: #{unquote($type)}-gradient($params); // unquote() method will not be recognized
    cssMethodsEnhanced.matches['1'][0].matches['1'] = [prefix,interpolation];

    // interpolation inside method parameters
    cssMethodsEnhanced.matches['2'][0].matches['1'] = [cssMethods].concat(arr_parameters);

    /********************
     * COMMENTS
     ********************/

    var commentMultiline = {
        name: 'comment',
        matches: {
            1: [interpolation]
        },
        pattern: regexes.commentMulti
    };

    var commentSingleline = {
        name: 'scss.comment',
        matches: {
            1: [interpolation]
        },
        pattern: regexes.commentSingle
    };

    var arr_comments = [
        commentMultiline,
        commentSingleline
    ];

    /********************
     * SELECTORS
     ********************/

    var entity = {
        scssParent: {
            name: 'entity.scss.parent',
            pattern: regexes.entityParent
        },
        scssPlaceholder: {
            name: 'entity.scss.placeholder',
            pattern: regexes.entityPlaceholder
        },
        cssClass: {
            name: 'entity.name.class',
            matches: {
                1: [interpolation]
            },
            pattern: regexes.entityClass
        },
        cssId: {
            name: 'entity.name.id',
            matches: {
                1: [interpolation]
            },
            pattern: regexes.entityId
        },
        cssAttribute : {
            name: 'entity.name.attribute',
            matches: {
                1: [
                    interpolation,
                    type.attribute
                ],
                2: [
                    interpolation,
                    type.text,
                    type.string
                ]
            },
            pattern: regexes.entityAttribute
        },
        cssPseudo: {
            name: 'entity.name.pseudo',
            matches: {
                1: [interpolation]
            },
            pattern: regexes.entityPseudo
        },
        cssTag: {
            name: 'entity.name.tag',
            matches: {
                1: [interpolation]
            },
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
        entity.scssPlaceholder,
        entity.cssClass,
        entity.cssId,
        entity.cssTag
    ];

    var arr_entities = arr_commonEntities.concat([
        entity.cssPseudo,
        entity.cssAttribute,
        entity.scssParent
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
            matches: {
                1: [prefix]
            },
            pattern: regexes.mediaFeature
        }
    };

    media.expression = {
        name: 'mediaquery.expression',
        matches: {
            1: [media.features,variable,interpolation],
            2: [cssMethodsEnhanced].concat(arr_parameters)
        },
        pattern: regexes.mediaExpression
    };

    media.query = {
        name: 'mediaquery.query',
        matches: {
            1: [media.reserved],
            2: [
                interpolation,
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
     * SASS EXTRA
     ********************/

    var maps = {
        name: 'scss.map',
        matches: {
            1: arr_comments.concat([
                {
                    name: 'scss.map-pair',
                    matches: {
                        1: 'scss.map-name',
                        3: arr_comments.concat([
                            {
                                name: 'scss.map-value',
                                matches: {
                                    1: arr_parameters
                                },
                                pattern: regexes.anyChars
                            }
                        ])
                    },
                    pattern: regexes.scssMapsSyntax
                }
            ])
        },
        pattern: regexes.scssMaps
    };

    var mixin = {
        name: 'scss.mixin',
        matches: {
            1: [atDirective],
            2: 'scss.mixin-name',
            3: [
                {
                    name: 'scss.mixin-params',
                    matches: {
                        1: [cssMethodsEnhanced].concat(arr_parameters)
                    },
                    pattern: regexes.parameters
                }
            ]
        },
        pattern: regexes.scssMixin
    };

    // TODO: consider to let all loops recognize methods inside loop expressions
    var loops = {
        forLoop: {
            name: 'scss.loop.for',
            matches: {
                1: [atDirective],
                2: [
                    {
                        name: 'scss.loop-condition',
                        matches: {
                            1: [variable],
                            2: [reserved],
                            3: [
                                variable,
                                type.number
                            ],
                            4: [reserved],
                            5: [
                                variable,
                                type.number
                            ]
                        },
                        pattern: regexes.scssLoopForSyntax
                    }
                ]
            },
            pattern: regexes.scssLoopFor
        },
        eachLoop: {
            name: 'scss.loop.each',
            matches: {
                1: [atDirective],
                2: [
                    {
                        name: 'scss.loop-condition',
                        matches: {
                            1: [variable],
                            2: [reserved],
                            3: [
                                scssList,
                                variable,
                                type.text
                            ]
                        },
                        pattern: regexes.scssLoopEachSyntax
                    }
                ]
            },
            pattern: regexes.scssLoopEach
        },
        whileLoop: {
            name: 'scss.loop.while',
            matches: {
                1: [atDirective],
                2: [
                    {
                        name: 'scss.loop-condition',
                        matches: {
                            1: [
                                variable,
                                type.number
                            ],
                            2: [operator],
                            3: [
                                variable,
                                type.number
                            ]
                        },
                        pattern: regexes.scssLoopWhileSyntax
                    }
                ]
            },
            pattern: regexes.scssLoopWhile
        }
    };

    var ternary = {
        name: 'scss.condition.ternary',
        matches: {
            1: 'scss.ternary-method',
            2: [
                {
                    name: 'scss.ternary-params',
                    matches: {
                        1: [
                            {
                                name: 'ternary-condition',
                                matches: {
                                    1: [cssMethodsEnhanced].concat(arr_parameters)
                                },
                                pattern: regexes.anyChars
                            }
                        ],
                        2: [
                            {
                                name: 'ternary-true',
                                matches: {
                                    1: [cssMethodsEnhanced].concat(arr_parameters)
                                },
                                pattern: regexes.anyChars
                            }
                        ],
                        3: [
                            {
                                name: 'ternary-false',
                                matches: {
                                    1: [cssMethodsEnhanced].concat(arr_parameters)
                                },
                                pattern: regexes.anyChars
                            }
                        ]
                    },
                    pattern: regexes.scssTernarySyntax
                }
            ]
        },
        pattern: regexes.scssTernary
    };

    var condition = {
        name: 'scss.condition',
        matches: {
            1: 'at-directive',
            2: [
                {
                    name: 'scss.condition-expression',
                    matches: {
                        1: [reserved,cssMethodsEnhanced].concat(arr_parameters)
                    },
                    pattern: regexes.anyChars
                }
            ]
        },
        pattern: regexes.scssCondition
    };

    var method = {
        name: 'scss.method',
        matches: {
            1: [atDirective],
            2: 'scss.method-name',
            3: [
                {
                    name: 'method-params',
                    matches: {
                        1: [cssMethodsEnhanced].concat(arr_parameters)
                    },
                    pattern: regexes.parameters
                }
            ]
        },
        pattern: regexes.scssMethod
    };

    var extend = {
        name: 'scss.extend',
        matches: {
            1: [atDirective],
            2: arr_commonEntities
        },
        pattern: regexes.scssExtend
    };

    var imports = {
        name: 'scss.import',
        matches: {
            1: [atDirective],
            2: [type.string]
        },
        pattern: regexes.scssImport
    };

    var include = {
        name: 'scss.include',
        matches: {
            1: [atDirective],
            2: 'scss.mixin-name',
            3: [
                {
                    name: 'scss.mixin-params',
                    matches: {
                        1: [cssMethodsEnhanced].concat(arr_parameters)
                    },
                    pattern: regexes.parameters
                }
            ]
        },
        pattern: regexes.scssInclude
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
            cssMethodsEnhanced
        ]);

    var scssSyntax = [
        commentSingleline,
        interpolation,
        maps,
        mixin,
        loops.forLoop,
        loops.eachLoop,
        loops.whileLoop,
        ternary,
        condition,
        method,
        extend,
        imports,
        include
    ];

    Rainbow.extend('scss', cssSyntaxEnhanced, true);
    Rainbow.extend('scss', scssSyntax, true);

}();
