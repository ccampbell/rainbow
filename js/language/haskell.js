/**
 * Haskell patterns
 *
 * @author Bruno Dias
 * @version 1.0.2
 */
Rainbow.extend('haskell', [
	///- Comments (block comment)
	{
		'name': 'comment',
		'pattern': /\{\-{2}[\s\S]*?\-{2}\}/mg
	}, 
	///- Comments (line comment)
	{
		'name': 'comment',
		'pattern': /\-\-(.*)/g
	},
	///- End Comments

	///- Keywords and Operators
	{
		'name': 'keyword.operator',
		'pattern': /\+|\!|\:{2}|-&gt;|\-|&(gt|lt|amp);|\/\=|\||\@|\:|\.|\+{2}|\:|\$|\*|\=|#|\.{2}|(\\)[a-zA-Z_]/g
	},
	{
		'name': 'keyword',
		'pattern': /\b(case|class|foreign|hiding|qualified|data|family|default|deriving|do|else|if|import|as|in|infix|infixl|infixr|instance|let|in|otherwise|module|newtype|of|then|type|where)\b/g
	},
	{
		'name': 'keyword',
		'pattern': /[\`][a-zA-Z_']*?[\`]/g
	},
	///- End Keywords and Operators


	///- Infix|Infixr|Infixl
	{
		'matches': {
			1: 'keyword',
			2: 'keyword.operator'
		},
		'pattern': /\b(infix|infixr|infixl)+\s\d+\s(\w+)*/g
	},
	///- End Infix|Infixr|Infixl

	///- Class
	{
		'name': 'entity.class',
		'pattern': /\b([A-Z][A-Za-z0-9_'\.]*[#]*)/g
	},
	///- End Class

	///- String
	{
		'name': 'constant.string',
		'pattern': /('|")(.*?)\1/g
	},
	///- End String

	///- String
	{
		'name': 'constant.numeric',
		'pattern': /\d+/g
	},
	///- End String

	// Haskell pragmas
	{
		'name': 'meta.preprocessor',
		'matches': {
			1: [
				{
					'matches': {
						1: 'keyword.define',
						2: [
							{
								'name': 'keyword.define',
								'pattern': /SPECIALIZED|UNPACK|[NO]?INLIN[E|ABLE]|LANGUAGE|DEPRECATED|OPTIONS_GHC|CONLIKE|RULES|CORE|INCLUDE|WARNING|LINE|SOURCE|MINIMAL/g
							},
							{
								'name': 'entity.name',
								 // CPP is needed to treat as an entity, otherwise it will parse as a definition.
								'pattern': /[\-]*\w+[\-]*/g
							},
							{
								'name': 'constant.string',
								'pattern': /(")(.*?)\1/g
							},
							{
								'name': 'keyword.operator',
								'pattern': /\+|\!|\:{2}|-&gt;|\-|&(gt|lt|amp);|\/\=|\||\@|\:|\.|\+{2}|\:|\$|\*|\=|#|\.{2}|(\\)[a-zA-Z_]/g
							}
						]
					},
					'pattern': /(\w+)\s(.*)/g
				}
			]
		},
		'pattern': /\{-#([\S\s]*?)\#-\}/gm
	},
	{
		'name': 'meta.preprocessor',
		'matches': {
			1: [
				{
					'matches': {
						1: 'keyword.define',
						2: 'entity.name'
					},
					'pattern': /(\w+)\s(\w+)\b/g
				},
				{
					'name': 'keyword.define',
					'pattern': /else|endif/g
				},
				{
					'name': 'constant.numeric',
					'pattern': /\d+/g
				},
				{
					'matches': {
						1: 'keyword.include',
						2: 'string'
					},
					'pattern': /(include)\s(.*?)$/g
				}
			]
		},
		'pattern': /\#([\S\s]*?)$/gm
	}
]); 
