#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of test endpoints to secure
const testEndpoints = [
  'src/app/api/test-assemblyai/route.ts',
  'src/app/api/debug-storage/route.ts', 
  'src/app/api/debug-production/route.ts',
  'src/app/api/diagnose-social-oauth/route.ts',
  'src/app/api/test-ai-analysis',
  'src/app/api/test-subtitles',
  'src/app/api/test-vercel-ai'
];

const middlewareImport = `import { requireDevelopmentOrAdmin } from '../middleware-auth'`;

function secureEndpoint(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${filePath} - directory doesn't have route.ts`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if already secured
  if (content.includes('requireDevelopmentOrAdmin')) {
    console.log(`Already secured: ${filePath}`);
    return;
  }

  // Add import if not present
  let updatedContent = content;
  if (!content.includes("import { requireDevelopmentOrAdmin }")) {
    // Find the last import line
    const importMatch = content.match(/import.*from.*\n/g);
    if (importMatch) {
      const lastImport = importMatch[importMatch.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      updatedContent = content.slice(0, lastImportIndex + lastImport.length) + 
                      middlewareImport + '\n' + 
                      content.slice(lastImportIndex + lastImport.length);
    }
  }

  // Add NextRequest import if needed
  if (!content.includes('NextRequest')) {
    updatedContent = updatedContent.replace(
      "import { NextResponse }",
      "import { NextRequest, NextResponse }"
    );
  }

  // Update function signatures and add auth check
  const functionPatterns = [
    /export async function (GET|POST|PUT|DELETE|PATCH)\(\)/g,
    /export function (GET|POST|PUT|DELETE|PATCH)\(\)/g
  ];

  for (const pattern of functionPatterns) {
    updatedContent = updatedContent.replace(pattern, (match, method) => {
      return `export async function ${method}(req: NextRequest)`;
    });
  }

  // Add auth check at the beginning of each function
  const functionBodyPattern = /export async function (GET|POST|PUT|DELETE|PATCH)\(req: NextRequest\)\s*{/g;
  updatedContent = updatedContent.replace(functionBodyPattern, (match) => {
    return match + `
  // Check authorization
  const authError = await requireDevelopmentOrAdmin(req)
  if (authError) return authError
`;
  });

  fs.writeFileSync(filePath, updatedContent);
  console.log(`Secured: ${filePath}`);
}

// Process each endpoint
testEndpoints.forEach(endpoint => {
  // If it's a directory, look for route.ts
  if (!endpoint.endsWith('.ts')) {
    const routePath = path.join(endpoint, 'route.ts');
    secureEndpoint(routePath);
  } else {
    secureEndpoint(endpoint);
  }
});

console.log('\nDone! Remember to:');
console.log('1. Add ADMIN_USER_IDS environment variable with comma-separated user IDs');
console.log('2. Test the endpoints in development to ensure they still work');
console.log('3. Verify they return 401/403 in production for non-admin users'); 