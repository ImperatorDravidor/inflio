// Test script to verify OpenAI configuration
require('dotenv').config({ path: '.env.local' });

async function testOpenAIConfig() {
  console.log('Testing OpenAI Configuration...\n');
  
  // Check if API key exists
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY is not set in environment variables');
    console.log('\n🔧 To fix this:');
    console.log('1. Create or update your .env.local file');
    console.log('2. Add: OPENAI_API_KEY=your_actual_api_key_here');
    console.log('3. Get your API key from: https://platform.openai.com/api-keys');
    return;
  }
  
  if (apiKey === 'your_openai_api_key_here') {
    console.error('❌ OPENAI_API_KEY is still set to the placeholder value');
    console.log('\n🔧 To fix this:');
    console.log('1. Update your .env.local file');
    console.log('2. Replace the placeholder with your actual OpenAI API key');
    console.log('3. Get your API key from: https://platform.openai.com/api-keys');
    return;
  }
  
  console.log('✅ OPENAI_API_KEY is set');
  console.log(`   Key starts with: ${apiKey.substring(0, 7)}...`);
  console.log(`   Key length: ${apiKey.length} characters`);
  
  // Test the API connection
  console.log('\n🔄 Testing API connection...');
  
  try {
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey });
    
    // Make a simple test request
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-2024-08-06',
      messages: [{ role: 'user', content: 'Say "Hello, OpenAI is working!"' }],
      max_tokens: 20
    });
    
    console.log('✅ OpenAI API connection successful!');
    console.log(`   Response: ${response.choices[0].message.content}`);
    console.log(`   Model used: ${response.model}`);
    
  } catch (error) {
    console.error('❌ Failed to connect to OpenAI API');
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('401')) {
      console.log('\n🔧 This usually means your API key is invalid or expired');
      console.log('   Please check your API key at: https://platform.openai.com/api-keys');
    } else if (error.message.includes('429')) {
      console.log('\n🔧 Rate limit exceeded or quota reached');
      console.log('   Check your usage at: https://platform.openai.com/usage');
    }
  }
  
  console.log('\n📋 Environment Check Complete');
}

testOpenAIConfig().catch(console.error); 