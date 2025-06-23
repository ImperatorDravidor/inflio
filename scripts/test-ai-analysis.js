// Test script for AI content analysis
// Run with: node scripts/test-ai-analysis.js

const testTranscript = `
Welcome to this comprehensive tutorial on modern web development. Today we're going to explore 
the latest trends in React, Next.js, and TypeScript. We'll cover best practices for building 
scalable applications, implementing authentication systems, and optimizing performance.

First, let's discuss the importance of choosing the right technology stack. React has become 
the industry standard for building interactive user interfaces. When combined with Next.js, 
you get powerful features like server-side rendering and static site generation.

TypeScript adds type safety to your JavaScript code, catching errors at compile time rather 
than runtime. This leads to more maintainable and robust applications. We'll also explore 
how to integrate AI services like OpenAI into your applications.

Performance optimization is crucial for user experience. We'll look at techniques like code 
splitting, lazy loading, and image optimization. Finally, we'll discuss deployment strategies 
using platforms like Vercel and best practices for monitoring your applications in production.
`;

async function testAIAnalysis() {
  console.log('🧪 Testing AI Content Analysis Service...\n');
  
  try {
    // Replace with your actual API endpoint URL
    const response = await fetch('http://localhost:3000/api/test-ai-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add your auth token if needed
        // 'Authorization': 'Bearer YOUR_TOKEN'
      },
      body: JSON.stringify({
        transcriptText: testTranscript
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ API Error:', result.error);
      return;
    }

    if (result.success) {
      console.log('✅ AI Analysis Successful!\n');
      console.log('📊 Results:');
      console.log(`- Keywords (${result.analysis.keywords.length}):`, result.analysis.keywords.slice(0, 5).join(', '), '...');
      console.log(`- Topics (${result.analysis.topics.length}):`, result.analysis.topics.join(', '));
      console.log(`- Sentiment:`, result.analysis.sentiment);
      console.log(`- Summary:`, result.analysis.summary);
      console.log(`- Key Moments:`, result.analysis.keyMoments.length);
      console.log(`- Processing Time:`, result.debug.processingTimeMs, 'ms');
      console.log(`- OpenAI Key Configured:`, result.debug.openAIKeyConfigured ? '✅' : '❌');
      
      console.log('\n📝 Content Suggestions:');
      console.log('Blog Ideas:', result.analysis.contentSuggestions.blogPostIdeas);
      console.log('Social Hooks:', result.analysis.contentSuggestions.socialMediaHooks);
      console.log('Short Form Ideas:', result.analysis.contentSuggestions.shortFormContent);
    } else {
      console.error('❌ Analysis Failed:', result.error);
      console.log('Debug Info:', result.debug);
    }
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    console.log('\nMake sure:');
    console.log('1. Your Next.js server is running (npm run dev)');
    console.log('2. You are authenticated');
    console.log('3. Your OpenAI API key is configured in .env.local');
  }
}

// Run the test
testAIAnalysis(); 