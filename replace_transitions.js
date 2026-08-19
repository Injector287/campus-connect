const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
let changedCount = 0;
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('transition:')) {
    // Replace "all 0.x" with "transform 0.x, opacity 0.x, background-color 0.x, border-color 0.x"
    const newContent = content.replace(/transition:\s*(['"`])all\s+(.*?)\1/g, 
      (match, q, rest) => {
        return `transition: ${q}transform ${rest}, opacity ${rest}, background-color ${rest}, border-color ${rest}${q}`;
      }
    );
    if (newContent !== content) {
      fs.writeFileSync(file, newContent, 'utf8');
      changedCount++;
      console.log('Updated', file);
    }
  }
});
console.log('Modified', changedCount, 'files.');
