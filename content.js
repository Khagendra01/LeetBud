// LeetBud Content Script

class LeetBud {
  constructor() {
    this.typingTimer = null;
    this.isTyping = false;
    this.bulbElement = null;
    this.hintPopup = null;
    this.apiKey = null;
    this.provider = null;
    this.model = null;
    this.problemData = null;
    
    this.init();
  }

  async init() {
    // Get API key from storage
    await this.loadApiKey();
    
    // Listen for storage changes to reload settings
    this.setupStorageListener();
    
    // Wait for LeetCode page to load
    this.waitForLeetCodePage();
  }

  async loadApiKey() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['aiProvider', 'aiModel', 'apiKey'], (result) => {
        this.provider = result.aiProvider || 'openai';
        this.model = result.aiModel || this.getDefaultModel(this.provider);
        this.apiKey = result.apiKey;
        resolve();
      });
    });
  }

  getDefaultModel(provider) {
    switch (provider) {
      case 'openrouter':
        return 'openai/gpt-4o';
      case 'openai':
        return 'gpt-5';
      case 'claude':
        return 'claude-3-opus-20250805';
      case 'gemini':
        return 'gemini-2.5-pro';
      default:
        return 'openai/gpt-4o';
    }
  }

  setupStorageListener() {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        let settingsChanged = false;
        
        if (changes.aiProvider) {
          this.provider = changes.aiProvider.newValue || 'openrouter';
          settingsChanged = true;
        }
        
        if (changes.aiModel) {
          this.model = changes.aiModel.newValue || this.getDefaultModel(this.provider);
          settingsChanged = true;
        }
        
        if (changes.apiKey) {
          this.apiKey = changes.apiKey.newValue;
          settingsChanged = true;
        }
        
        if (settingsChanged) {
          console.log('LeetBud: Settings updated', {
            provider: this.provider,
            model: this.model,
            hasApiKey: !!this.apiKey
          });
          
          // Show a brief notification that settings were updated
          this.showSettingsUpdatedNotification();
        }
      }
    });
  }

  showSettingsUpdatedNotification() {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      z-index: 10002;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = '✅ LeetBud settings updated!';
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
        if (style.parentNode) {
          style.parentNode.removeChild(style);
        }
      }, 300);
    }, 3000);
  }

  async refreshSettings() {
    // Show loading notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #007bff;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      z-index: 10002;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = '🔄 Refreshing LeetBud settings...';
    document.body.appendChild(notification);
    
    try {
      // Reload settings from storage
      await this.loadApiKey();
      
      // Update notification to success
      notification.style.background = '#28a745';
      notification.textContent = '✅ Settings refreshed!';
      
      console.log('LeetBud: Settings refreshed', {
        provider: this.provider,
        model: this.model,
        hasApiKey: !!this.apiKey
      });
      
    } catch (error) {
      console.error('LeetBud: Error refreshing settings:', error);
      notification.style.background = '#dc3545';
      notification.textContent = '❌ Failed to refresh settings';
    }
    
    // Remove notification after 2 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 2000);
  }

  waitForLeetCodePage() {
    // More flexible URL checking for LeetCode
    if (window.location.hostname.includes('leetcode.com') && 
        (window.location.pathname.includes('/problems/') || 
         window.location.pathname.includes('/problem/') ||
         window.location.pathname.includes('/explore/') ||
         window.location.pathname.includes('/contest/'))) {
      this.setupTypingDetection();
      this.extractProblemData();
    } else {
      // Try to set up anyway in case we're on a different LeetCode page
      this.setupTypingDetection();
      this.extractProblemData();
    }
  }

  setupTypingDetection() {
    // Use MutationObserver to detect changes in Monaco editor (more reliable)
    this.setupMutationObserver();
    
    // Also try keyboard events on the document
    this.setupKeyboardDetection();
    
    // Fallback: try traditional event listeners
    this.setupTraditionalListeners();
  }

  setupMutationObserver() {
    const monacoEditors = document.querySelectorAll('.monaco-editor');
    
    monacoEditors.forEach((editor, index) => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' || mutation.type === 'characterData') {
            this.handleTyping();
          }
        });
      });
      
      observer.observe(editor, {
        childList: true,
        subtree: true,
        characterData: true
      });
    });
  }

  setupKeyboardDetection() {
    document.addEventListener('keydown', (e) => {
      // Check if we're in a Monaco editor
      const activeElement = document.activeElement;
      if (activeElement && (
        activeElement.classList.contains('monaco-mouse-cursor-text') ||
        activeElement.closest('.monaco-editor')
      )) {
        this.handleTyping();
      }
    });
  }

  setupTraditionalListeners() {
    // Find the code editor (LeetCode uses Monaco editor)
    const codeEditor = document.querySelector('.monaco-editor textarea') || 
                      document.querySelector('[data-testid="code-editor"] textarea') ||
                      document.querySelector('.CodeMirror textarea') ||
                      document.querySelector('textarea[placeholder*="code"]') ||
                      document.querySelector('.monaco-editor .view-lines') ||
                      document.querySelector('[data-testid="code-editor"] .view-lines') ||
                      document.querySelector('.monaco-editor') ||
                      document.querySelector('[data-testid="code-editor"]');

    if (codeEditor) {
      // Try different event types for Monaco editor
      const events = ['input', 'keydown', 'keyup', 'change'];
      events.forEach(eventType => {
        codeEditor.addEventListener(eventType, () => {
          this.handleTyping();
        });
      });

      // Also listen for changes in Monaco editor content
      if (codeEditor.closest('.monaco-editor')) {
        const editorContainer = codeEditor.closest('.monaco-editor');
        events.forEach(eventType => {
          editorContainer.addEventListener(eventType, () => {
            this.handleTyping();
          });
        });
      }
    } else {
      // Fallback: monitor any textarea or contenteditable
      const textAreas = document.querySelectorAll('textarea, [contenteditable="true"]');
      textAreas.forEach((textarea, index) => {
        textarea.addEventListener('input', () => {
          this.handleTyping();
        });
        textarea.addEventListener('keydown', () => {
          this.handleTyping();
        });
      });
    }
  }

  handleTyping() {
    this.isTyping = true;
    
    // Clear existing timer
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }

    // Hide bulb if visible
    this.hideBulb();

    // Set new timer for 4 seconds
    this.typingTimer = setTimeout(() => {
      if (this.isTyping) {
        this.showBulb();
        this.isTyping = false;
      }
    }, 4000);
  }

  showBulb() {
    if (this.bulbElement) {
      this.bulbElement.style.display = 'block';
      this.updateBulbPosition();
      return;
    }
    // Create bulb element
    this.bulbElement = document.createElement('div');
    this.bulbElement.id = 'leetbud-bulb';
    this.bulbElement.innerHTML = '💡';
    this.bulbElement.title = 'Click for AI hint • Right-click to refresh settings';
    
    // Position the bulb near the code editor
    this.bulbElement.style.cssText = `
      position: absolute;
      width: 40px;
      height: 40px;
      background: linear-gradient(45deg, #ffd700, #ffed4e);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      cursor: pointer;
      z-index: 10000;
      box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
      animation: glow 2s ease-in-out infinite alternate;
      transition: transform 0.2s ease;
    `;

    // Add click event - get AI hint directly
    this.bulbElement.addEventListener('click', (e) => {
      e.stopPropagation();
      this.getAIHint();
    });

    // Add right-click event - refresh settings
    this.bulbElement.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Show visual feedback
      const originalContent = this.bulbElement.innerHTML;
      this.bulbElement.innerHTML = '🔄';
      this.bulbElement.style.background = 'linear-gradient(45deg, #007bff, #0056b3)';
      
      this.refreshSettings().finally(() => {
        // Restore original appearance
        setTimeout(() => {
          this.bulbElement.innerHTML = originalContent;
          this.bulbElement.style.background = 'linear-gradient(45deg, #ffd700, #ffed4e)';
        }, 1000);
      });
    });

    // Add hover effect
    this.bulbElement.addEventListener('mouseenter', () => {
      this.bulbElement.style.transform = 'scale(1.1)';
    });

    this.bulbElement.addEventListener('mouseleave', () => {
      this.bulbElement.style.transform = 'scale(1)';
    });

    // Find the code editor container and append bulb to it
    this.appendBulbToEditor();
  }

  appendBulbToEditor() {
    // Try to find the code editor container
    const editorContainer = document.querySelector('.monaco-editor') ||
                           document.querySelector('[data-testid="code-editor"]') ||
                           document.querySelector('.CodeMirror') ||
                           document.querySelector('.editor') ||
                           document.querySelector('[class*="editor"]') ||
                           document.querySelector('.code-editor') ||
                           document.querySelector('[class*="code-editor"]') ||
                           document.querySelector('textarea')?.parentElement;

    if (editorContainer) {
      // Make sure the container has relative positioning
      const containerStyle = window.getComputedStyle(editorContainer);
      if (containerStyle.position === 'static') {
        editorContainer.style.position = 'relative';
      }
      
      editorContainer.appendChild(this.bulbElement);
      this.updateBulbPosition();
    } else {
      // Fallback: append to body with fixed positioning
      this.bulbElement.classList.add('fallback');
      document.body.appendChild(this.bulbElement);
    }
  }

  updateBulbPosition() {
    if (!this.bulbElement) return;

    // Position the bulb in the top-right corner of the editor
    this.bulbElement.style.top = '10px';
    this.bulbElement.style.right = '10px';
  }

  hideBulb() {
    if (this.bulbElement) {
      this.bulbElement.style.display = 'none';
    }
  }


  extractProblemData() {
    try {
      // Extract problem title - try multiple selectors
      const titleSelectors = [
        '[data-cy="question-title"]',
        'h3',
        '.css-v3d350',
        '[data-testid="question-title"]',
        '.question-title',
        'h1',
        '.text-title-large',
        '[class*="title"]'
      ];
      
      let title = 'Unknown Problem';
      for (const selector of titleSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          title = element.textContent.trim();
          break;
        }
      }

      // Extract problem description - try multiple selectors with better filtering
      const descriptionSelectors = [
        '[data-cy="question-detail-main-tabs"]',
        '.content__u3I1',
        '.question-content',
        '[data-testid="question-detail-main-tabs"]',
        '.question-detail',
        '.problem-description',
        '[class*="description"]',
        '[class*="content"]'
      ];
      
      let description = '';
      let bestDescription = '';
      let bestLength = 0;
      
      for (const selector of descriptionSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          const text = element.textContent.trim();
          // Filter out short or meaningless descriptions
          if (text && text.length > 50 && 
              !text.toLowerCase().includes('description') && 
              !text.toLowerCase().includes('example') &&
              !text.toLowerCase().includes('constraints') &&
              !text.toLowerCase().includes('follow-up')) {
            
            // Look for actual problem content
            if (text.includes('Given') || text.includes('Write') || text.includes('Implement') || 
                text.includes('Return') || text.includes('Find') || text.includes('Determine')) {
              if (text.length > bestLength) {
                bestDescription = text;
                bestLength = text.length;
              }
            }
          }
        }
      }
      
      if (bestDescription) {
        description = bestDescription;
      }

      // Get body text for pattern matching (used for both description and examples/constraints)
      const bodyText = document.body.textContent;
      
      // If still no good description found, try to get it from the page content
      if (!description || description.length < 50) {
        // Look for common problem description patterns with better boundaries
        const patterns = [
          /Given.*?(?=Example|Constraints|Follow-up|Seen this question|Acceptance Rate|Topics|Companies|Similar Questions|Discussion|Copyright|$)/gs,
          /You are given.*?(?=Example|Constraints|Follow-up|Seen this question|Acceptance Rate|Topics|Companies|Similar Questions|Discussion|Copyright|$)/gs,
          /Write.*?(?=Example|Constraints|Follow-up|Seen this question|Acceptance Rate|Topics|Companies|Similar Questions|Discussion|Copyright|$)/gs,
          /Implement.*?(?=Example|Constraints|Follow-up|Seen this question|Acceptance Rate|Topics|Companies|Similar Questions|Discussion|Copyright|$)/gs
        ];
        
        for (const pattern of patterns) {
          const matches = bodyText.match(pattern);
          if (matches && matches.length > 0) {
            const candidate = matches[0].trim();
            if (candidate.length > 50 && candidate.length < 2000) { // Reasonable length check
              description = candidate;
              break;
            }
          }
        }
      }

      // Now try to extract Examples and Constraints to append to description
      let examplesAndConstraints = '';
      
      // Try to find Examples section with better boundaries
      const examplePatterns = [
        /Example\s*\d*:.*?(?=Constraints|Follow-up|Seen this question|Acceptance Rate|Topics|Companies|Similar Questions|Discussion|Copyright|$)/gs,
        /Examples?:.*?(?=Constraints|Follow-up|Seen this question|Acceptance Rate|Topics|Companies|Similar Questions|Discussion|Copyright|$)/gs
      ];
      
      for (const pattern of examplePatterns) {
        const matches = bodyText.match(pattern);
        if (matches && matches.length > 0) {
          const examples = matches[0].trim();
          if (examples.length > 20 && examples.length < 1000) { // Reasonable length check
            examplesAndConstraints += '\n\n' + examples;
            break;
          }
        }
      }
      
      // Try to find Constraints section with better boundaries
      const constraintPatterns = [
        /Constraints?:.*?(?=Follow-up|Seen this question|Acceptance Rate|Topics|Companies|Similar Questions|Discussion|Copyright|$)/gs,
        /Note:.*?(?=Follow-up|Seen this question|Acceptance Rate|Topics|Companies|Similar Questions|Discussion|Copyright|$)/gs
      ];
      
      for (const pattern of constraintPatterns) {
        const matches = bodyText.match(pattern);
        if (matches && matches.length > 0) {
          const constraints = matches[0].trim();
          if (constraints.length > 20 && constraints.length < 1000) { // Reasonable length check
            examplesAndConstraints += '\n\n' + constraints;
            break;
          }
        }
      }
      
      // Append examples and constraints to description if found
      if (examplesAndConstraints) {
        description += examplesAndConstraints;
      }

      // Extract current code - try multiple approaches
      let currentCode = '';
      
      // Try Monaco editor textarea (most reliable for Monaco editor)
      const monacoTextareas = document.querySelectorAll('textarea.inputarea.monaco-mouse-cursor-text');
      
      if (monacoTextareas.length > 0) {
        for (let i = 0; i < monacoTextareas.length; i++) {
          const textarea = monacoTextareas[i];
          if (textarea.value && textarea.value.trim()) {
            currentCode = textarea.value;
            break;
          }
        }
      }
      
      // If Monaco textareas didn't work, try all textareas (fallback)
      if (!currentCode) {
        const allTextareas = document.querySelectorAll('textarea');
        
        for (let i = 0; i < allTextareas.length; i++) {
          const textarea = allTextareas[i];
          if (textarea.value && textarea.value.trim()) {
            currentCode = textarea.value;
            break;
          }
        }
      }
      
      // Try other code editor selectors
      if (!currentCode) {
        const codeSelectors = [
          '.monaco-editor textarea',
          '[data-testid="code-editor"] textarea',
          '.CodeMirror textarea',
          'textarea[placeholder*="code"]',
          'textarea[placeholder*="Code"]'
        ];
        
        for (const selector of codeSelectors) {
          const element = document.querySelector(selector);
          if (element && element.value && element.value.trim()) {
            currentCode = element.value;
            break;
          }
        }
      }

      // If still no code, try to get it from Monaco editor content
      if (!currentCode) {
        const monacoEditor = document.querySelector('.monaco-editor');
        if (monacoEditor) {
          // Try to get text content from Monaco editor
          const textContent = monacoEditor.textContent || monacoEditor.innerText;
          if (textContent && textContent.trim()) {
            currentCode = textContent.trim();
          }
        }
      }
      
      // If still no code, try to get it from the view-lines (Monaco editor's display)
      if (!currentCode) {
        const viewLines = document.querySelector('.view-lines');
        if (viewLines) {
          const textContent = viewLines.textContent || viewLines.innerText;
          if (textContent && textContent.trim()) {
            currentCode = textContent.trim();
          }
        }
      }
      
      // Last resort: try to get code from any element that might contain it
      if (!currentCode) {
        const possibleCodeElements = document.querySelectorAll('.monaco-editor, [class*="editor"], [class*="code"]');
        for (const element of possibleCodeElements) {
          const textContent = element.textContent || element.innerText;
          if (textContent && textContent.trim() && textContent.includes('class Solution') || textContent.includes('def ') || textContent.includes('function ')) {
            currentCode = textContent.trim();
            break;
          }
        }
      }
      
      this.problemData = {
        title,
        description: description.substring(0, 2000), // Increased limit to include examples and constraints
        currentCode,
        url: window.location.href
      };
    } catch (error) {
      console.error('Error extracting problem data:', error);
    }
  }


  async getAIHint() {
    if (!this.apiKey) {
      this.showError('Please set your API key in the extension popup.');
      return;
    }

    // Always re-extract problem data to get the latest code
    this.extractProblemData();

    this.showLoading();

    // Prepare the data being sent to AI
    const systemPrompt = 'You are a helpful coding mentor that provides guidance for LeetCode problems. Your role is to guide students in the right direction, NOT to provide complete solutions. Analyze the problem and the user\'s current code, then provide helpful hints about what they should think about or what approach they should consider. Point out potential issues or suggest the next logical step. Keep your response concise and educational. Never provide complete code solutions - only guidance and hints.';
    const userPrompt = `LeetCode Problem: ${this.problemData.title}\n\nProblem Description: ${this.problemData.description}\n\nCurrent Code:\n${this.problemData.currentCode}\n\nPlease provide guidance on what I should think about or what approach to consider next. Do not provide complete solutions.`;
    
    console.log('LeetBud: Making API call with:', {
      provider: this.provider,
      model: this.model,
      hasApiKey: !!this.apiKey,
      problemTitle: this.problemData.title,
      codeLength: this.problemData.currentCode.length
    });
    
    try {
      let response;
      
      switch (this.provider) {
        case 'openrouter':
          response = await this.callOpenRouter(systemPrompt, userPrompt);
          break;
        case 'openai':
          response = await this.callOpenAI(systemPrompt, userPrompt);
          break;
        case 'claude':
          response = await this.callClaude(systemPrompt, userPrompt);
          break;
        case 'gemini':
          response = await this.callGemini(systemPrompt, userPrompt);
          break;
        default:
          throw new Error('Invalid provider selected');
      }

      console.log('LeetBud: Received response:', response);
      
      if (!response || response.trim() === '') {
        throw new Error('Empty response received from AI');
      }

      this.showHint(response);
    } catch (error) {
      console.error('LeetBud: Error getting AI hint:', error);
      this.showError(`Failed to get AI hint from ${this.provider}. Error: ${error.message}`);
    }
  }

  async callOpenRouter(systemPrompt, userPrompt) {
    const requestData = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ]
    };

    console.log('LeetBud: OpenRouter request data:', requestData);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'LeetBud Extension'
      },
      body: JSON.stringify(requestData)
    });

    console.log('LeetBud: OpenRouter response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LeetBud: OpenRouter error response:', errorText);
      throw new Error(`OpenRouter API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('LeetBud: OpenRouter response data:', data);
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenRouter');
    }
    
    return data.choices[0].message.content;
  }

  async callOpenAI(systemPrompt, userPrompt) {
    const requestData = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ]
    };

    console.log('LeetBud: OpenAI request data:', requestData);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    console.log('LeetBud: OpenAI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LeetBud: OpenAI error response:', errorText);
      throw new Error(`OpenAI API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('LeetBud: OpenAI response data:', data);
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenAI');
    }
    
    return data.choices[0].message.content;
  }

  async callClaude(systemPrompt, userPrompt) {
    const requestData = {
      model: this.model,
      messages: [
        {
          role: 'user',
          content: `${systemPrompt}\n\n${userPrompt}`
        }
      ]
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`Claude API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  async callGemini(systemPrompt, userPrompt) {
    const requestData = {
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}\n\n${userPrompt}`
            }
          ]
        }
      ]
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`Gemini API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  showLoading(customMessage = 'Getting AI Hint...') {
    this.hideBulb();
    
    if (this.hintPopup) {
      this.hintPopup.remove();
    }

    this.hintPopup = document.createElement('div');
    this.hintPopup.id = 'leetbud-hint-popup';
    this.hintPopup.innerHTML = `
      <div class="leetbud-popup-content">
        <div class="leetbud-popup-header">
          <h3>🤖 ${customMessage}</h3>
          <button class="leetbud-close-btn">&times;</button>
        </div>
        <div class="leetbud-popup-body">
          <div class="leetbud-loading">
            <div class="leetbud-spinner"></div>
            <p>Analyzing your code...</p>
          </div>
        </div>
      </div>
    `;

    this.setupPopupStyles();
    document.body.appendChild(this.hintPopup);
    this.setupPopupEvents();
  }


  showHint(hint) {
    if (this.hintPopup) {
      this.hintPopup.remove();
    }

    this.hintPopup = document.createElement('div');
    this.hintPopup.id = 'leetbud-hint-popup';
    this.hintPopup.innerHTML = `
      <div class="leetbud-popup-content">
        <div class="leetbud-popup-header">
          <h3>💡 AI Hint</h3>
          <div class="leetbud-header-buttons">
            <button class="leetbud-print-btn" title="Print Hint">🖨️</button>
            <button class="leetbud-copy-btn" title="Copy Hint">📋</button>
            <button class="leetbud-debug-btn" title="Print AI Request Data">🔍</button>
            <button class="leetbud-close-btn">&times;</button>
          </div>
        </div>
        <div class="leetbud-popup-body">
          <div class="leetbud-hint-content">
            ${hint.replace(/\n/g, '<br>')}
          </div>
        </div>
      </div>
    `;

    this.setupPopupStyles();
    document.body.appendChild(this.hintPopup);
    this.setupPopupEvents();
  }

  showError(message) {
    if (this.hintPopup) {
      this.hintPopup.remove();
    }

    this.hintPopup = document.createElement('div');
    this.hintPopup.id = 'leetbud-hint-popup';
    this.hintPopup.innerHTML = `
      <div class="leetbud-popup-content">
        <div class="leetbud-popup-header">
          <h3>❌ Error</h3>
          <button class="leetbud-close-btn">&times;</button>
        </div>
        <div class="leetbud-popup-body">
          <div class="leetbud-error-content">
            ${message}
          </div>
        </div>
      </div>
    `;

    this.setupPopupStyles();
    document.body.appendChild(this.hintPopup);
    this.setupPopupEvents();
  }

  setupPopupStyles() {
    this.hintPopup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 400px;
      max-width: 90vw;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      z-index: 10001;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
  }

  setupPopupEvents() {
    const closeBtn = this.hintPopup.querySelector('.leetbud-close-btn');
    const printBtn = this.hintPopup.querySelector('.leetbud-print-btn');
    const copyBtn = this.hintPopup.querySelector('.leetbud-copy-btn');
    const debugBtn = this.hintPopup.querySelector('.leetbud-debug-btn');
    
    closeBtn.addEventListener('click', () => {
      this.hintPopup.remove();
    });

    // Print functionality
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        this.printHint();
      });
    }

    // Copy functionality
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        this.copyHint();
      });
    }

    // Debug functionality
    if (debugBtn) {
      debugBtn.addEventListener('click', () => {
        this.printAIRequestData();
      });
    }

    // Close on outside click
    this.hintPopup.addEventListener('click', (e) => {
      if (e.target === this.hintPopup) {
        this.hintPopup.remove();
      }
    });

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        this.hintPopup.remove();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  printHint() {
    const hintContent = this.hintPopup.querySelector('.leetbud-hint-content').textContent;
    const problemTitle = this.problemData ? this.problemData.title : 'LeetCode Problem';
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>LeetBud AI Hint - ${problemTitle}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
          }
          .header {
            border-bottom: 2px solid #007bff;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .title {
            color: #007bff;
            margin: 0;
            font-size: 24px;
          }
          .hint-content {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #ffd700;
            white-space: pre-wrap;
            font-size: 16px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 14px;
          }
          @media print {
            body { margin: 0; }
            .header { page-break-after: avoid; }
            .hint-content { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">💡 LeetBud AI Hint</h1>
          <p><strong>Problem:</strong> ${problemTitle}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <div class="hint-content">${hintContent}</div>
        <div class="footer">
          <p>Generated by LeetBud Extension - AI-powered coding hints for LeetCode</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  }

  copyHint() {
    const hintContent = this.hintPopup.querySelector('.leetbud-hint-content').textContent;
    const problemTitle = this.problemData ? this.problemData.title : 'LeetCode Problem';
    
    const textToCopy = `LeetBud AI Hint - ${problemTitle}
Generated: ${new Date().toLocaleString()}

${hintContent}

---
Generated by LeetBud Extension`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      // Show feedback
      const copyBtn = this.hintPopup.querySelector('.leetbud-copy-btn');
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '✅';
      copyBtn.style.background = '#28a745';
      
      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.background = '';
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy hint to clipboard');
    });
  }

  printAIRequestData() {
    if (!this.problemData) {
      alert('No AI request data available. Please get an AI hint first.');
      return;
    }

    const systemPrompt = 'You are a helpful coding mentor that provides guidance for LeetCode problems. Your role is to guide students in the right direction, NOT to provide complete solutions. Analyze the problem and the user\'s current code, then provide helpful hints about what they should think about or what approach they should consider. Point out potential issues or suggest the next logical step. Keep your response concise and educational. Never provide complete code solutions - only guidance and hints.';
    const userPrompt = `LeetCode Problem: ${this.problemData.title}\n\nProblem Description: ${this.problemData.description}\n\nCurrent Code:\n${this.problemData.currentCode}\n\nPlease provide guidance on what I should think about or what approach to consider next. Do not provide complete solutions.`;
    
    let requestData, apiEndpoint;
    
    switch (this.provider) {
      case 'openrouter':
        requestData = {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ]
        };
        apiEndpoint = 'POST https://openrouter.ai/api/v1/chat/completions';
        break;
      case 'openai':
        requestData = {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ]
        };
        apiEndpoint = 'POST https://api.openai.com/v1/chat/completions';
        break;
      case 'claude':
        requestData = {
          model: this.model,
          messages: [
            {
              role: 'user',
              content: `${systemPrompt}\n\n${userPrompt}`
            }
          ]
        };
        apiEndpoint = 'POST https://api.anthropic.com/v1/messages';
        break;
      case 'gemini':
        requestData = {
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\n${userPrompt}`
                }
              ]
            }
          ]
        };
        apiEndpoint = `POST https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey ? '[API_KEY]' : '[NO_API_KEY]'}`;
        break;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>LeetBud AI Request Data - ${this.problemData.title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
          }
          .header {
            border-bottom: 2px solid #007bff;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .title {
            color: #007bff;
            margin: 0;
            font-size: 24px;
          }
          .section {
            margin-bottom: 30px;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #007bff;
            background: #f8f9fa;
          }
          .section h3 {
            margin-top: 0;
            color: #007bff;
            font-size: 18px;
          }
          .code-block {
            background: #2d3748;
            color: #e2e8f0;
            padding: 15px;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            white-space: pre-wrap;
            overflow-x: auto;
            margin: 10px 0;
          }
          .json-block {
            background: #1a202c;
            color: #e2e8f0;
            padding: 15px;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            white-space: pre-wrap;
            overflow-x: auto;
            margin: 10px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 14px;
          }
          @media print {
            body { margin: 0; }
            .header { page-break-after: avoid; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">🔍 LeetBud AI Request Data</h1>
          <p><strong>Problem:</strong> ${this.problemData.title}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="section">
          <h3>📊 Extracted Problem Data</h3>
          <div class="json-block">${JSON.stringify(this.problemData, null, 2)}</div>
        </div>
        
        <div class="section">
          <h3>🤖 System Prompt</h3>
          <div class="code-block">${systemPrompt}</div>
        </div>
        
        <div class="section">
          <h3>👤 User Prompt</h3>
          <div class="code-block">${userPrompt}</div>
        </div>
        
        <div class="section">
          <h3>📤 Full API Request Data</h3>
          <div class="json-block">${JSON.stringify(requestData, null, 2)}</div>
        </div>
        
        <div class="section">
          <h3>🌐 API Endpoint</h3>
          <div class="code-block">${apiEndpoint}</div>
        </div>
        
        <div class="section">
          <h3>🔧 Provider Settings</h3>
          <div class="json-block">${JSON.stringify({provider: this.provider, model: this.model, hasApiKey: !!this.apiKey}, null, 2)}</div>
        </div>
        
        <div class="footer">
          <p>Generated by LeetBud Extension - AI-powered coding hints for LeetCode</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  }
}

// Initialize LeetBud when the page loads
let leetBudInstance;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    leetBudInstance = new LeetBud();
  });
} else {
  leetBudInstance = new LeetBud();
}
