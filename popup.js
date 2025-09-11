// LeetBud Popup Script
document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKey');
  const providerSelect = document.getElementById('provider');
  const modelSelect = document.getElementById('model');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const statusDiv = document.getElementById('status');
  const providerInstructions = document.getElementById('providerInstructions');

  // Provider instructions and models
  const providerInfo = {
    openrouter: {
      instructions: [
        '1. Visit <a href="https://openrouter.ai/" target="_blank">OpenRouter.ai</a>',
        '2. Sign up for an account',
        '3. Go to your API keys section',
        '4. Create a new API key and paste it here'
      ],
      models: [
        { value: 'openai/gpt-4o', label: 'GPT-4o (Latest Available)' },
        { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini (Fast)' },
        { value: 'openai/gpt-4-turbo', label: 'GPT-4 Turbo' },
        { value: 'openai/gpt-4', label: 'GPT-4' },
        { value: 'openai/gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
        { value: 'anthropic/claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Latest Available)' },
        { value: 'anthropic/claude-3-opus-20240229', label: 'Claude 3 Opus (Most Powerful)' },
        { value: 'anthropic/claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
        { value: 'anthropic/claude-3-haiku-20240307', label: 'Claude 3 Haiku (Fastest)' },
        { value: 'google/gemini-1.5-pro', label: 'Gemini 1.5 Pro (Latest Available)' },
        { value: 'google/gemini-1.5-flash', label: 'Gemini 1.5 Flash (Fast)' },
        { value: 'google/gemini-1.0-pro', label: 'Gemini 1.0 Pro' },
        { value: 'deepseek/deepseek-r1', label: 'DeepSeek R1 (671B - Reasoning)' },
        { value: 'deepseek/deepseek-v3.1', label: 'DeepSeek V3.1 (Latest - Aug 2025)' },
        { value: 'x-ai/grok-4', label: 'Grok 4 (256k Context)' },
        { value: 'mistralai/mistral-devstral-small-2507', label: 'Mistral Devstral Small (24B - Coding)' },
        { value: 'mistralai/mistral-devstral-medium-2507', label: 'Mistral Devstral Medium (Coding)' },
        { value: 'qwen/qwen3-max-preview', label: 'Qwen3 Max Preview (Latest - Sep 2025)' },
        { value: 'meta-llama/llama-3.1-405b-instruct', label: 'Llama 3.1 405B Instruct' },
        { value: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B Instruct' },
        { value: 'meta-llama/llama-3.1-8b-instruct', label: 'Llama 3.1 8B Instruct' },
        { value: 'openchat/openchat-3.5-0106', label: 'OpenChat 3.5 (Fast & Helpful)' },
        { value: 'nousresearch/nous-capybara-7b', label: 'Nous Capybara 7B (Conversational)' },
        { value: 'gryphe/mythomax-l2-13b', label: 'Gryphe Mythomax L2 13B (Creative)' },
        { value: 'mistralai/mixtral-8x7b-instruct', label: 'Mixtral 8x7B (Free & Smart)' },
        { value: 'openrouter/auto', label: 'OpenRouter Auto (Best Free Model)' }
      ]
    },
    openai: {
      instructions: [
        '1. Visit <a href="https://platform.openai.com/api-keys" target="_blank">OpenAI Platform</a>',
        '2. Sign up or log in to your account',
        '3. Go to API keys section',
        '4. Create a new API key and paste it here'
      ],
      models: [
        { value: 'gpt-5', label: 'GPT-5 (Latest - Aug 2025)' },
        { value: 'o4-mini', label: 'o4-mini (Fast & Efficient)' },
        { value: 'gpt-4o', label: 'GPT-4o (Multimodal)' },
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast)' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
        { value: 'gpt-4', label: 'GPT-4' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
      ]
    },
    claude: {
      instructions: [
        '1. Visit <a href="https://console.anthropic.com/" target="_blank">Anthropic Console</a>',
        '2. Sign up or log in to your account',
        '3. Go to API keys section',
        '4. Create a new API key and paste it here'
      ],
      models: [
        { value: 'claude-3-opus-20250805', label: 'Claude Opus 4.1 (Latest - Aug 2025)' },
        { value: 'claude-3-5-sonnet-20250522', label: 'Claude Sonnet 4 (May 2025)' },
        { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Oct 2024)' },
        { value: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet (Jun 2024)' },
        { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus (Feb 2024)' },
        { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet (Feb 2024)' },
        { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Mar 2024)' }
      ]
    },
    gemini: {
      instructions: [
        '1. Visit <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a>',
        '2. Sign up or log in to your Google account',
        '3. Create a new API key',
        '4. Copy and paste it here'
      ],
      models: [
        { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Latest - Jun 2025)' },
        { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Fast - Jun 2025)' },
        { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite (Ultra Fast - Jul 2025)' },
        { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Stable)' },
        { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Fast)' },
        { value: 'gemini-1.0-pro', label: 'Gemini 1.0 Pro (Legacy)' }
      ]
    }
  };

  // Load saved settings
  chrome.storage.sync.get(['aiProvider', 'aiModel', 'apiKey'], function(result) {
    if (result.aiProvider) {
      providerSelect.value = result.aiProvider;
    }
    if (result.aiModel) {
      modelSelect.value = result.aiModel;
    }
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }
    updateProviderInstructions();
    updateModelOptions();
  });

  // Update provider instructions
  function updateProviderInstructions() {
    const selectedProvider = providerSelect.value;
    const instructions = providerInfo[selectedProvider].instructions;
    providerInstructions.innerHTML = instructions.map(instruction => `<p>${instruction}</p>`).join('');
  }

  // Update model options based on selected provider
  function updateModelOptions() {
    const selectedProvider = providerSelect.value;
    const models = providerInfo[selectedProvider].models;
    
    // Clear existing options
    modelSelect.innerHTML = '';
    
    // Add new options
    models.forEach(model => {
      const option = document.createElement('option');
      option.value = model.value;
      option.textContent = model.label;
      modelSelect.appendChild(option);
    });
  }

  // Handle provider change
  providerSelect.addEventListener('change', function() {
    updateProviderInstructions();
    updateModelOptions();
  });

  // Save settings
  saveBtn.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    const provider = providerSelect.value;
    const model = modelSelect.value;
    
    if (!apiKey) {
      showStatus('Please enter an API key', 'error');
      return;
    }

    // Validate API key format based on provider
    let isValid = false;
    switch (provider) {
      case 'openrouter':
        isValid = apiKey.startsWith('sk-or-') && apiKey.length >= 20;
        break;
      case 'openai':
        isValid = apiKey.startsWith('sk-') && apiKey.length >= 20;
        break;
      case 'claude':
        isValid = apiKey.startsWith('sk-ant-') && apiKey.length >= 20;
        break;
      case 'gemini':
        isValid = apiKey.length >= 20; // Gemini keys don't have a specific prefix
        break;
    }

    if (!isValid) {
      showStatus(`Please enter a valid ${provider.charAt(0).toUpperCase() + provider.slice(1)} API key`, 'error');
      return;
    }

    // Save to storage
    chrome.storage.sync.set({ 
      aiProvider: provider,
      aiModel: model,
      apiKey: apiKey 
    }, function() {
      showStatus('Settings saved successfully!', 'success');
      
      // Clear the input for security
      apiKeyInput.value = '';
      
      // Show masked version
      setTimeout(() => {
        apiKeyInput.value = '•'.repeat(apiKey.length);
        apiKeyInput.type = 'password';
      }, 1000);
    });
  });

  // Test API connection
  testBtn.addEventListener('click', async function() {
    const apiKey = apiKeyInput.value.trim();
    const provider = providerSelect.value;
    const model = modelSelect.value;
    
    if (!apiKey) {
      showStatus('Please enter an API key first', 'error');
      return;
    }

    testBtn.disabled = true;
    testBtn.textContent = 'Testing...';
    showStatus('Testing API connection...', 'info');

    try {
      const testResult = await testAPIConnection(provider, model, apiKey);
      if (testResult.success) {
        showStatus('✅ API connection successful!', 'success');
      } else {
        showStatus(`❌ API test failed: ${testResult.error}`, 'error');
      }
    } catch (error) {
      showStatus(`❌ API test failed: ${error.message}`, 'error');
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = 'Test API Connection';
    }
  });

  // Handle Enter key
  apiKeyInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      saveBtn.click();
    }
  });

  // Test API connection function
  async function testAPIConnection(provider, model, apiKey) {
    const testPrompt = "Hello, this is a test message. Please respond with 'API connection successful!'";
    
    try {
      let response;
      
      switch (provider) {
        case 'openrouter':
          response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': window.location.origin,
              'X-Title': 'LeetBud Extension'
            },
            body: JSON.stringify({
              model: model,
              messages: [{ role: 'user', content: testPrompt }],
            })
          });
          break;
        case 'openai':
          response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: model,
              messages: [{ role: 'user', content: testPrompt }],
            })
          });
          break;
        case 'claude':
          response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': apiKey,
              'Content-Type': 'application/json',
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: model,
              messages: [{ role: 'user', content: testPrompt }],
            })
          });
          break;
        case 'gemini':
          response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: testPrompt }] }],
            })
          });
          break;
        default:
          throw new Error('Invalid provider');
      }

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const data = await response.json();
      
      // Check response format based on provider
      let responseText = '';
      if (provider === 'gemini') {
        responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else if (provider === 'claude') {
        responseText = data.content?.[0]?.text || '';
      } else {
        responseText = data.choices?.[0]?.message?.content || '';
      }

      if (!responseText.trim()) {
        return { success: false, error: 'Empty response from API' };
      }

      return { success: true, response: responseText };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Show status message
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    // Hide after 5 seconds for info messages, 3 seconds for others
    const hideDelay = type === 'info' ? 5000 : 3000;
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, hideDelay);
  }

});
