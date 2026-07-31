const fs = require('fs');
const path = require('path');

const files = [
  'src/app/admin/announcements/page.js',
  'src/app/admin/health/page.js',
  'src/app/admin/rate-limit/page.js',
  'src/app/admin/suggestions/page.js',
  'src/app/admin/users/page.js',
  'src/app/dashboard/finance/page.js',
  'src/app/dashboard/grades/page.js',
  'src/app/dashboard/library/page.js',
  'src/app/dashboard/profile/page.js',
  'src/app/dashboard/subjects/page.js',
  'src/app/dashboard/suggestions/page.js',
  'src/app/page.js'
];

files.forEach(file => {
  const fullPath = path.join('c:/Users/Shyaa/OneDrive/Documents/My Stuff/dev/ERP', file);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');

  // Replace spinner block with SkeletonPage
  const spinnerRegex = /if\s*\(([^)]+)\)\s*\{\s*return\s*\([\s\S]*?className="spinner"[\s\S]*?<\/main>\s*\);?\s*\}/;
  
  if (spinnerRegex.test(content)) {
    content = content.replace(spinnerRegex, (match, p1) => {
         return `if (${p1}) {\n    return <SkeletonPage />;\n  }`;
    });
    
    // Add import if not present
    if (!content.includes("import SkeletonPage")) {
        const importsEnd = content.lastIndexOf('import ');
        if (importsEnd !== -1) {
            const nextLine = content.indexOf('\n', importsEnd) + 1;
            content = content.slice(0, nextLine) + "import SkeletonPage from '@/components/SkeletonPage';\n" + content.slice(nextLine);
        } else {
            content = "import SkeletonPage from '@/components/SkeletonPage';\n" + content;
        }
    }
    
    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${file}`);
  }
});

// Update suspense fallback in page.js specifically
const pageJsPath = path.join('c:/Users/Shyaa/OneDrive/Documents/My Stuff/dev/ERP', 'src/app/page.js');
let pageContent = fs.readFileSync(pageJsPath, 'utf8');
if (pageContent.includes('className="spinner"')) {
    // only replace the Suspense one
    pageContent = pageContent.replace(
        /<Suspense fallback=\{<div className="main-container".*?spinner.*?<\/div><\/div>\}>/g,
        '<Suspense fallback={<SkeletonPage />}>'
    );
    if (!pageContent.includes("import SkeletonPage")) {
        const importsEnd = pageContent.lastIndexOf('import ');
        const nextLine = pageContent.indexOf('\n', importsEnd) + 1;
        pageContent = pageContent.slice(0, nextLine) + "import SkeletonPage from '@/components/SkeletonPage';\n" + pageContent.slice(nextLine);
    }
    fs.writeFileSync(pageJsPath, pageContent);
    console.log(`Updated page.js Suspense`);
}

