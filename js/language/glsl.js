/**
 * GLSL patterns for Rainbow
 *
 * @author Mike Lodato
 * @version 1.0.0
 */
Rainbow.extend('glsl', [
	{
		'name': 'meta.preprocessor',
		'pattern': /#[\s\S]*?$/gm
	},
	{
		'name': 'comment',
		'pattern': /\/\*[\s\S]*?\*\//gm
	},
	{
		'name': 'comment',
		'pattern': /\/\/.*?$/gm
	},
	{
		'name': 'keyword.operator',
		'pattern': /\.|\+(?:\+|=)?|-(?:-|=)?|~|!=?|\*=?|\/=?|%=?|(?:&lt;){1,2}=?|(?:&gt;){1,2}=?|\?|:|==?|&amp;(?:&amp;|=)?|\|(?:\||=)?|\^(?:\^|=)?|,/g
	},
	{
		'name': 'keyword',
		'pattern': /\b(?:return|discard|break|continue|do|for|while|switch|case|default|if|else|precision|lowp|mediump|highp)\b/g
	},
	{
		'name': 'constant.language',
		'pattern': /\btrue|false\b/g
	},
	{
		'name': 'constant.numeric.integer',
		'pattern': /\b(?:0x[a-f\d]+|[1-9]\d*|0[0-7]*)u?\b/gi
	},
	{
		'name': 'constant.numeric.float',
		'pattern': /\b(?:\d+\.\d*|\.\d+|\d+(?=e[+-\d]))(?:e[+-]?\d+)?(?:f|lf)?\b/gi
	},
	{
		'name': 'storage.modifier',
		'pattern': /\b(?:const|in|out|attribute|uniform|varying|buffer|shared|centroid|sample|patch|layout|coherent|volatile|restrict|readonly|writeonly)\b/g
	},
	{
		'matches': {
			1: 'storage.type',
			2: 'entity.name.function'
		},
		'pattern': /\b(void|bool|int|uint|float|double|[dbiu]?vec[2-4]|d?mat[2-4](?:x[2-4])?|[iu]?(?!\w*?Shadow)(?:image|sampler)(?:(?:1D|2D(?!Rect)(?:MS(?!\w*?Shadow))?|Cube)(?:Array)?(?:Shadow)?|2DRect|3D|Buffer))\b(?:\s+(\w+)\s*\()?/g
	}
], true);

