# Sample GitHub Action

A template repository for creating GitHub Actions using Node.js.

## Quick Start

1. **Clone this template** or use it to create a new repository
2. **Customize `action.yml`** with your action's metadata, inputs, and outputs
3. **Implement your logic** in `src/index.js`
4. **Build the action** to bundle it into `dist/`
5. **Test and publish** your action

## Project Structure

```
.
├── action.yml           # Action metadata and interface definition
├── src/
│   ├── index.js         # Main entry point for your action
│   └── report.test.js   # Test files
├── dist/                # Bundled code (generated, do not edit directly)
├── package.json         # Dependencies and scripts
└── README.md            # This file
```

## Implementation Guide

### 1. Define Your Action (`action.yml`)

The `action.yml` file defines your action's interface:

```yaml
name: 'Your Action Name'
description: 'What your action does'
inputs:
  input-name:
    description: 'Description of the input'
    required: true
    default: 'default value'
outputs:
  output-name:
    description: 'Description of the output'
runs:
  using: 'node20'
  main: 'dist/index.js'
```

### 2. Implement Your Logic (`src/index.js`)

Use the `@actions/core` and `@actions/github` packages:

```javascript
import { getInput, setOutput, setFailed } from "@actions/core";
import { context } from "@actions/github";

async function run() {
  try {
    // Get inputs
    const myInput = getInput("input-name", { required: true });
    
    // Your logic here
    const result = processInput(myInput);
    
    // Set outputs
    setOutput("output-name", result);
  } catch (error) {
    setFailed(`Action failed: ${error.message}`);
  }
}

await run();
```

### 3. Install Dependencies

```bash
npm install
```

Key dependencies:
- `@actions/core` - Core GitHub Actions functionality (inputs, outputs, logging)
- `@actions/github` - GitHub API client and context
- `@vercel/ncc` - Bundles your code into a single file for distribution

### 4. Build Your Action

Before using your action, bundle it:

```bash
npm run build
```

This creates `dist/index.js` which contains all your code and dependencies in a single file.

### 5. Test Your Action

Add tests in `src/*.test.js`:

```bash
npm test
```

### 6. Use Your Action in a Workflow

```yaml
steps:
  - name: Run My Action
    uses: your-username/your-action@v1
    with:
      input-name: 'some value'
```

## Key Concepts

### Inputs
- Defined in `action.yml`
- Retrieved using `getInput()` in your code
- Can be required or optional with defaults

### Outputs
- Defined in `action.yml`
- Set using `setOutput()` in your code
- Available to subsequent workflow steps

### Context
- Access workflow context via `@actions/github`
- Includes repo info, event data, actor, etc.

### Error Handling
- Use `setFailed()` to mark action as failed
- Always wrap your code in try-catch blocks

## Distribution

GitHub Actions run from the `dist/` folder, not directly from `src/`. Always:
1. Run `npm run build` after making changes
2. Commit both `src/` and `dist/` to your repository
3. Tag releases for version management

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Creating a JavaScript Action](https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action)
- [@actions/toolkit](https://github.com/actions/toolkit)

## License

MIT
