# LeetBud 💡

A Chrome extension that provides AI-powered hints for LeetCode problems. When you stop typing for 4 seconds, a glowing bulb appears that you can click to get intelligent hints about your solution.

## Installation

### Load as Unpacked Extension (Development)

1. Clone this Repository
2. **Open Chrome** and go to `chrome://extensions/`
3. **Enable Developer mode** (toggle in the top right)
4. **Click "Load unpacked"** and select the folder you cloned into, the entire main folder
5. **Pin the extension** to your toolbar for easy access


## How to Use

1. **Go to any LeetCode problem** (e.g., `leetcode.com/problems/two-sum`)
2. **Start typing your solution** in the code editor
3. **Stop typing for 4 seconds** - a glowing bulb 💡 will appear in the top-right corner
4. **Click the bulb** to get an AI-powered hint about what to do next
5. **Read the hint** in the popup that appears
6. **Close the popup** and continue coding with your new insight!

## How It Works

1. **Monitors Typing**: The extension watches for input in LeetCode's code editor
2. **Detects Pauses**: When you stop typing for 4 seconds, it triggers the hint system
3. **Extracts Context**: Gathers the problem title, description, and your current code
4. **Calls AI**: Sends this information to OpenRouter's API for analysis
5. **Shows Hint**: Displays a helpful suggestion about your next steps

## Privacy & Security

- **Local Storage**: Your API key is stored locally in Chrome's sync storage
- **No Data Collection**: The extension doesn't collect or store your code
- **Direct API Calls**: All AI requests go directly to OpenRouter
- **Secure Communication**: Uses HTTPS for all API communications

## Troubleshooting

### Bulb Not Appearing
- Make sure you're on a LeetCode problem page
- Check that you've stopped typing for at least 4 seconds
- Verify the extension is enabled in `chrome://extensions/`

### API Errors
- Verify your OpenRouter API key is correct
- Check your internet connection
- Ensure you have credits in your OpenRouter account
- Try the "Test API Key" button in the settings

### Extension Not Working
- Refresh the LeetCode page
- Check the browser console for errors (F12 → Console)
- Try disabling and re-enabling the extension
- Make sure you're using a supported browser (Chrome, Edge, etc.)

## Development

To modify or extend the extension:

1. **Edit the files** as needed
2. **Reload the extension** in `chrome://extensions/`
3. **Test on LeetCode** to see your changes

### Key Files to Modify

- `content.js`: Main functionality and AI integration
- `styles.css`: Visual appearance and animations
- `popup.js`: Settings page behavior
- `manifest.json`: Extension permissions and configuration

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve LeetBud!

## License

This project is open source and available under the MIT License.

## Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Open an issue on the project repository
3. Make sure you're using the latest version of the extension

---

**Happy coding with LeetBud! 🚀**
