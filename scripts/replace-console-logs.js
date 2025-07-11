#!/usr/bin/env node
/**
 * Script to replace console.log/error/warn statements with logger calls
 * Run with: node scripts/replace-console-logs.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns to match and replace
const replacements = [
  {
    // console.log('message') -> logger.info('message')
    pattern: /console\.log\s*\(/g,
    replacement: 'logger.info('
  },
  {
    // console.error('message') -> logger.error('message')
    pattern: /console\.error\s*\(/g,
    replacement: 'logger.error('
  },
  {
    // console.warn('message') -> logger.warn('message')
    pattern: /console\.warn\s*\(/g,
    replacement: 'logger.warn('
  }
];

// Files to skip
const skipPatterns = [
  '**/node_modules/**',
  '**/.next/**',
  '**/scripts/**',
  '**/logger.ts',
  '**/logger.js',
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.spec.ts',
  '**/*.spec.tsx'
];

// Find all TypeScript/JavaScript files
const files = glob.sync('src/**/*.{ts,tsx,js,jsx}', {
  ignore: skipPatterns
});

console.log(`Found ${files.length} files to process`);

let totalReplacements = 0;
const filesToUpdate = [];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  let fileReplacements = 0;
  
  // Check if file has any console statements
  const hasConsole = content.includes('console.');
  if (!hasConsole) return;
  
  // Apply replacements
  replacements.forEach(({ pattern, replacement }) => {
    const matches = content.match(pattern);
    if (matches) {
      fileReplacements += matches.length;
      content = content.replace(pattern, replacement);
    }
  });
  
  if (fileReplacements > 0) {
    // Check if logger is already imported
    const hasLoggerImport = content.includes("from '@/lib/logger'") || 
                           content.includes('from "@/lib/logger"') ||
                           content.includes("from '../lib/logger'") ||
                           content.includes('from "../lib/logger"');
    
    if (!hasLoggerImport) {
      // Add logger import at the top of the file
      const importStatement = "import { logger } from '@/lib/logger'\n";
      
      // Find the right place to insert import
      if (content.includes('import')) {
        // Add after the last import
        const lastImportIndex = content.lastIndexOf('import');
        const lineEnd = content.indexOf('\n', lastImportIndex);
        content = content.slice(0, lineEnd + 1) + importStatement + content.slice(lineEnd + 1);
      } else if (content.includes('"use client"') || content.includes("'use client'")) {
        // Add after "use client" directive
        const useClientIndex = content.indexOf('"use client"') !== -1 
          ? content.indexOf('"use client"') 
          : content.indexOf("'use client'");
        const lineEnd = content.indexOf('\n', useClientIndex);
        content = content.slice(0, lineEnd + 1) + '\n' + importStatement + content.slice(lineEnd + 1);
      } else {
        // Add at the beginning
        content = importStatement + '\n' + content;
      }
    }
    
    filesToUpdate.push({
      file,
      replacements: fileReplacements,
      content
    });
    
    totalReplacements += fileReplacements;
  }
});

console.log(`\nFound ${totalReplacements} console statements to replace in ${filesToUpdate.length} files`);

if (filesToUpdate.length > 0) {
  console.log('\nFiles to update:');
  filesToUpdate.forEach(({ file, replacements }) => {
    console.log(`  ${file}: ${replacements} replacements`);
  });
  
  // Ask for confirmation
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('\nDo you want to apply these changes? (y/n) ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      filesToUpdate.forEach(({ file, content }) => {
        fs.writeFileSync(file, content);
      });
      console.log('\n✅ Changes applied successfully!');
      console.log('\nNext steps:');
      console.log('1. Review the changes with: git diff');
      console.log('2. Test the build: npm run build');
      console.log('3. Commit if everything looks good');
    } else {
      console.log('\n❌ Changes cancelled');
    }
    rl.close();
  });
} else {
  console.log('\n✅ No console statements found to replace!');
} 