# MediaInfo Parser for Release

A userscript that parses MediaInfo and generates a table on torrent creation pages.

## Development Setup

1. Install Node.js (if not already installed)
2. Install dependencies:
   ```bash
   npm install
   ```

## Building

To build the userscript:

```bash
npm run build
```

This will:
1. Combine all modules into a single file
2. Generate the final userscript file in the root directory: `unit3d-info-generator.user.js`

## Project Structure

```
unit3d-info-generator/
├── src/
│   ├── modules/
│   │   ├── Config.js
│   │   ├── DataValidator.js
│   │   ├── MediaInfoParser.js
│   │   ├── UIHandler.js
│   │   └── Utils.js
│   └── unit3d-info-generator.user.js
├── unit3d-info-generator.user.js
├── build.js
├── package.json
└── README.md
```

## Modules

- `Config`: Configuration constants and settings
- `Utils`: Utility functions and helper methods
- `DataValidator`: Data validation logic
- `MediaInfoParser`: MediaInfo parsing functionality
- `UIHandler`: User interface management

## Development

1. Make changes to the module files in `src/modules/`
2. Run `npm run build` to generate the new userscript
3. Test the generated file in your userscript manager

## License

[MIT License](LICENSE) 