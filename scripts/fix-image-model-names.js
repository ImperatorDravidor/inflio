#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Files to update
const filesToUpdate = [
  'src/app/api/generate-professional-photos/route.ts',
  'src/app/api/generate-thumbnail/route.ts',
  'src/app/api/generate-thumbnail-stream/route.ts',
  'src/app/api/generate-social-graphics/route.ts',
  'src/app/api/thumbnail-iterate/route.ts'
];

console.log('🔧 Fixing image model names...\n');

filesToUpdate.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  
  // Replace gpt-image-1 with dall-e-3
  content = content.replace(/gpt-image-1/g, 'dall-e-3');
  
  // Also update comments that reference gpt-image-1
  content = content.replace(/Using OpenAI's latest and most advanced image generation model/g, 'Using DALL-E 3 for image generation');
  content = content.replace(/Generate image with gpt-image-1/g, 'Generate image with DALL-E 3');
  content = content.replace(/Generate image using gpt-image-1/g, 'Generate image using DALL-E 3');
  content = content.replace(/Use gpt-image-1 for highest quality/g, 'Use DALL-E 3 for highest quality');
  content = content.replace(/gpt-image-1 handles transparency automatically/g, 'DALL-E 3 handles transparency automatically');
  content = content.replace(/optimal size for gpt-image-1/g, 'optimal size for DALL-E 3');
  
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Updated: ${filePath}`);
  } else {
    console.log(`⏭️  No changes needed: ${filePath}`);
  }
});

console.log('\n✨ Image model names fixed!');
console.log('\nNote: You may also need to check for any invalid API parameters like:');
console.log('- style (other than model dall-e-3 style parameter)');
console.log('- background');
console.log('- Any other non-standard OpenAI API parameters'); 