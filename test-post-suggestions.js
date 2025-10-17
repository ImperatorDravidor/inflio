// Quick test to verify post suggestions are working
const testProjectId = process.argv[2];

if (!testProjectId) {
  console.log('Usage: node test-post-suggestions.js <project-id>');
  process.exit(1);
}

async function testPostSuggestions() {
  try {
    const response = await fetch(`http://localhost:3000/api/posts/suggestions?projectId=${testProjectId}`);
    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Suggestions Found:', data.count || 0);
    
    if (data.suggestions && data.suggestions.length > 0) {
      console.log('\nFirst suggestion structure:');
      const first = data.suggestions[0];
      console.log('- ID:', first.id);
      console.log('- Type:', first.type);
      console.log('- Status:', first.status);
      console.log('- Has platform_copy:', !!first.platform_copy);
      console.log('- Has eligibility:', !!first.eligibility);
      console.log('- Has metadata:', !!first.metadata);
      
      if (first.metadata) {
        console.log('\nMetadata fields:');
        console.log('- title:', first.metadata.title);
        console.log('- description:', first.metadata.description);
        console.log('- eligible_platforms:', first.metadata.eligible_platforms);
        console.log('- engagement_prediction:', first.metadata.engagement_prediction);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testPostSuggestions();