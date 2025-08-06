#!/usr/bin/env node

/**
 * Script to secure all test/debug/diagnose endpoints
 * This adds protection middleware to prevent access in production
 */

const fs = require('fs');
const path = require('path');

// Patterns for routes that need protection
const PROTECTED_PATTERNS = [
  'test-',
  'debug-',
  'diagnose-',
  'fix-',
  'check-klap-',
  'restart-',
  'process-klap-direct',
  'process-klap-force',
  'add-clips-task',
  'env-check',
];

// Template for protected route
const PROTECTION_TEMPLATE = `import { NextRequest, NextResponse } from 'next/server';
import { protectDevRoutes } from '@/app/api/middleware-protect-dev-routes';

export async function GET(request: NextRequest) {
  // Check if this route should be protected in production
  const protectionResponse = await protectDevRoutes(request);
  if (protectionResponse) {
    return protectionResponse;
  }
  
  // Original route logic here
  return NextResponse.json({
    message: 'This is a development/test endpoint',
    environment: process.env.NODE_ENV,
  });
}

export async function POST(request: NextRequest) {
  // Check if this route should be protected in production
  const protectionResponse = await protectDevRoutes(request);
  if (protectionResponse) {
    return protectionResponse;
  }
  
  // Original route logic here
  return NextResponse.json({
    message: 'This is a development/test endpoint',
    environment: process.env.NODE_ENV,
  });
}
`;

function shouldProtectRoute(routeName) {
  return PROTECTED_PATTERNS.some(pattern => routeName.includes(pattern));
}

function findTestRoutes(dir) {
  const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
  const routes = [];
  
  function scanDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const itemPath = path.join(currentDir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        const routeName = path.basename(itemPath);
        if (shouldProtectRoute(routeName)) {
          const routeFile = path.join(itemPath, 'route.ts');
          if (fs.existsSync(routeFile)) {
            routes.push({
              name: routeName,
              path: routeFile,
              relativePath: path.relative(process.cwd(), routeFile)
            });
          }
        }
        // Recursively scan subdirectories
        scanDirectory(itemPath);
      }
    }
  }
  
  scanDirectory(apiDir);
  return routes;
}

function addProtectionComment(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if protection is already added
    if (content.includes('protectDevRoutes') || content.includes('PROTECTED ROUTE')) {
      return { status: 'already_protected', path: filePath };
    }
    
    // Add a comment at the top of the file
    const protectionComment = `/**
 * ⚠️ PROTECTED ROUTE - This endpoint is protected in production
 * Only accessible in development or by admin users
 * Protection handled by middleware-protect-dev-routes.ts
 */

`;
    
    const updatedContent = protectionComment + content;
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    
    return { status: 'protected', path: filePath };
  } catch (error) {
    return { status: 'error', path: filePath, error: error.message };
  }
}

// Main execution
console.log('🔒 Securing Test/Debug Endpoints\n');
console.log('Scanning for protected routes...\n');

const testRoutes = findTestRoutes();

console.log(`Found ${testRoutes.length} routes that need protection:\n`);

testRoutes.forEach(route => {
  console.log(`  - ${route.name} (${route.relativePath})`);
});

console.log('\n📝 Adding protection comments to route files...\n');

const results = {
  protected: [],
  already_protected: [],
  errors: []
};

testRoutes.forEach(route => {
  const result = addProtectionComment(route.path);
  
  if (result.status === 'protected') {
    results.protected.push(route.name);
    console.log(`  ✅ Protected: ${route.name}`);
  } else if (result.status === 'already_protected') {
    results.already_protected.push(route.name);
    console.log(`  ⏭️  Already protected: ${route.name}`);
  } else {
    results.errors.push(route.name);
    console.log(`  ❌ Error: ${route.name} - ${result.error}`);
  }
});

console.log('\n📊 Summary:');
console.log(`  - Newly protected: ${results.protected.length}`);
console.log(`  - Already protected: ${results.already_protected.length}`);
console.log(`  - Errors: ${results.errors.length}`);

console.log('\n✅ Protection setup complete!');
console.log('\n📝 Next steps:');
console.log('  1. Add ADMIN_EMAILS to your .env file:');
console.log('     ADMIN_EMAILS=admin@example.com,developer@example.com');
console.log('  2. Update middleware.ts to use the protection');
console.log('  3. Test that routes return 404 in production for non-admins');
console.log('  4. Deploy with confidence!\n');