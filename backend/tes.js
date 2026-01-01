import { minitoolAgent } from './services/minitoolAgent.js';

(async () => {
  try {
    console.log('Testing Minitool Agent...');
    
    const result = await minitoolAgent.chat({
      question: 'Say hello in one sentence',
      model: 'gpt-5-mini',
      temperature: 0.5
    });
    
    console.log('✅ Success!');
    console.log('Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();