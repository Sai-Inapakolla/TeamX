const fs = require('fs');

let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Replace standard className={themeMode === 'dark' ? 'a' : 'b'}
content = content.replace(/className=\{themeMode === 'dark' \? '([^']+)' : '([^']+)'\}/g, 'className="$1"');

// Replace any remaining themeMode === 'dark' ? 'a' : 'b' with just 'a'
content = content.replace(/themeMode === 'dark' \? '([^']+)' : '([^']+)'/g, '"$1"');

// Save the file
fs.writeFileSync('src/pages/Dashboard.tsx', content);
