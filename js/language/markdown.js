/* Markdown Highlighting
 *
 * @author Nijiko Yonskai
 * @version 1.0.0
 */
Rainbow.extend('markdown', [
  { // Headers --- / ===
    'name': 'storage.header',
    'pattern': /(.*?)(\r\n|\n)(={3,}|-{3,})/g
  },
  { // Headers #
    'name': 'storage.header',
    'pattern': /(#{1,6})([^\r\n|\n]+?)/g
  },
  { // Strong
    'matches': {
      1: 'keyword.operator',
      3: 'keyword.operator',
      4: 'keyword.operator',
      6: 'keyword.operator'
    },
    'pattern': /\b(__)([\s\S]+?)(\1)\b|(\*\*)([\s\S]+?)(\4)/g
  },
  { // Emphasis
    'matches': {
      1: 'keyword.operator',
      3: 'keyword.operator',
      4: 'keyword.operator',
      6: 'keyword.operator'
    },
    'pattern': /\b(_)([\s\S]+?)(\1)\b|(\*)([\s\S]+?)(\4)/g
  },
  { // Lists
    'name': 'keyword.operator',
    'pattern': /((^|^\s{1,3})\*{1,3}|(^|^\s{1,3})\-{1,3}|(^|^\s{1,3})\+{1,3})/gm
  },
  { // Numbered Lists
    'name': 'constant.numeric',
    'pattern': /((^|^\s{1,3})[0-9]+\.)/gm
  },
  { // Links
    'name': 'storage.links',
    'pattern': /\[([^\]]+)\]\(([^)]+)\)/g
  },
  { // Reference Links
    'name': 'storage.links',
    'pattern': /^!?\[(inside)\]\s*\[([^\]]*)\]/g
  },
  { // No Links
    'name': 'storage.links',
    'pattern': /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/g
  },
  { // Inline Code ``
    'matches': {
      1: 'keyword.operator',
      5: 'keyword.operator'
    },
    'pattern': /(\`)(?=\S)([^\`]+?)(?!=\S)\1/g
  },
  { // Code block
    'name': 'storage.code',
    'pattern': /^( {4}[^\n]+\n*)+/gm
  },
  { // GFM Code ```[type] ```
    // TODO: Highlight inline-code
    'matches': {
      1: 'keyword.operator',
      4: 'keyword.operator'
    },
    'pattern': /^ *(`{3,}|~{3,}) *(\w+)? *\n([\s\S]+?)\s*\1 *(?:\n+|$)/gm
  }
], true);