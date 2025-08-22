#!/usr/bin/env node

/**
 * Script to clean up empty test/debug directories
 */

const fs = require('fs');
const path = require('path');

const PATTERNS_TO_CHECK = [
  'test-',
  'debug-',
  'diagnose-',
  'fix-',
  'check-klap-',
  'restart-',
];

function shouldCheckDir(dirName) {
  return PATTERNS_TO_CHECK.some(pattern => dirName.includes(pattern));
}

function removeEmptyDirs() {
  const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
  const emptyDirs = [];
  const nonEmptyDirs = [];
  
  function scanDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const itemPath = path.join(currentDir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        const dirName = path.basename(itemPath);
        
        if (shouldCheckDir(dirName)) {
          const dirContents = fs.readdirSync(itemPath);
          
          if (dirContents.length === 0) {
            emptyDirs.push({
              name: dirName,
              path: itemPath,
              relativePath: path.relative(process.cwd(), itemPath)
            });
          } else {
            nonEmptyDirs.push({
              name: dirName,
              path: itemPath,
              relativePath: path.relative(process.cwd(), itemPath),
              contents: dirContents
            });
          }
        }
        
        // Don't recurse into API subdirectories for this cleanup
      }
    }
  }
  
  scanDirectory(apiDir);
  
  console.log('🧹 Cleaning up empty test/debug directories\n');
  
  if (emptyDirs.length > 0) {
    console.log(`Found ${emptyDirs.length} empty directories to remove:\n`);
    
    emptyDirs.forEach(dir => {
      console.log(`  - ${dir.name}`);
      try {
        fs.rmdirSync(dir.path);
        console.log(`    ✅ Removed`);
      } catch (error) {
        console.log(`    ❌ Error: ${error.message}`);
      }
    });
  } else {
    console.log('No empty directories found.');
  }
  
  if (nonEmptyDirs.length > 0) {
    console.log(`\n📁 ${nonEmptyDirs.length} test/debug directories with content (kept):\n`);
    nonEmptyDirs.forEach(dir => {
      console.log(`  - ${dir.name} (${dir.contents.join(', ')})`);
    });
  }
  
  console.log('\n✅ Cleanup complete!');
}

removeEmptyDirs();