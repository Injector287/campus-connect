const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
schema = schema.replace(/previewFeatures\s*=\s*\["driverAdapters"\]/g, '// previewFeatures = ["driverAdapters"]');

fs.writeFileSync(schemaPath, schema);
console.log('✅ Switched schema.prisma to SQLite');