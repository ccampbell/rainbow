/**
* SQL patterns - specific to T-SQL but could be adapted for other dialects
*
* @author Nian Xu
* @version 0.01
*/

Rainbow.extend('tsql', [
    {
        // Based on SQL Server 2008 keywords
        // see http://msdn.microsoft.com/en-us/library/ms189822.aspx
        'name': 'command.sql',
        'pattern': /\b(add|alter|as|asc|authorization|backup|begin|break|browse|bulk|by|cascade|case|check|checkpoint|close|clustered|collate|column|commit|compute|constraint|contains|containstable|continue|create|current|current_date|current_time|cursor|database|dbcc|deallocate|declare|default|delete|deny|desc|disk|distinct|distributed|double|drop|dump|else|end|errlvl|escape|except|exec|execute|exit|external|fetch|file|fillfactor|for|foreign|freetext|freetexttable|from|full|function|goto|grant|group|having|holdlock|identity|identity_insert|identitycol|if|index|insert|intersect|into|key|kill|lineno|load|merge|national|nocheck|nonclustered|numeric|octet_length|of|on|open|opendatasource|openquery|openrowset|openxml|option|order|over|percent|plan|precision|primary|print|proc|procedure|public|raiserror|read|readtext|reconfigure|references|replication|restore|restrict|return|revert|revoke|right|rollback|rowcount|rowguidcol|rule|save|schema|securityaudit|select|session|set|setuser|shutdown|table|tablesample|textsize|then|to|top|tran|transaction|trigger|truncate|tsequal|union|unique|update|updatetext|use|values|varying|view|waitfor|when|where|while|with|writetext)\b/gi
    },
    {
        'name': 'field.sql',
        'pattern': /\b(all|and|any|between|cross|exists|in|inner|is|join|left|like|not|null|or|outer|pivot|some|unpivot)\b/gi
    },
    {
        'name': 'function.sql',
        'pattern': /\b(coalesce|convert|current_timestamp|current_user|nullif|session_user|system_user|user)\b/gi
    },
    {
        'name': 'comment',
        'pattern': /\/\*[\s\S]*?\*\/|(--).*?$/gm
    }
], true); 
