# Nexus Vercel Summary

A GitHub Action that comments on pull requests with Vercel deployment status updates, similar to the official Vercel bot. Supports building, failed, and successful deployment states.

## Features

- 🔄 **Real-time Updates**: Comments are updated in-place rather than creating multiple comments
- 🎨 **Vercel-style Formatting**: Clean, professional comments that match Vercel's UI
- 🚀 **Production & Preview**: Supports both production and preview deployments
- 🔗 **Direct Links**: Includes clickable deployment URLs when successful
- ✅ **Status Indicators**: Clear visual indicators for building, failed, and successful states

## Usage

### Basic Example

```yaml
name: Deploy and Comment

on:
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Comment - Building
        uses: your-org/nexus-vercel-summary@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          status: building
          environment: preview

      - name: Deploy to Vercel
        id: deploy
        run: |
          # Your deployment logic here
          DEPLOYMENT_URL=$(vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }})
          echo "url=$DEPLOYMENT_URL" >> $GITHUB_OUTPUT

      - name: Comment - Successful
        if: success()
        uses: your-org/nexus-vercel-summary@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          status: successful
          deployment-url: ${{ steps.deploy.outputs.url }}
          environment: preview

      - name: Comment - Failed
        if: failure()
        uses: your-org/nexus-vercel-summary@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          status: failed
          environment: preview
```

### Integration with Reusable Workflow

Here's how to integrate with your existing Vercel deployment workflow:

```yaml
name: Deploy with Status Comments

on:
  pull_request:
    branches: [main]

jobs:
  comment-building:
    name: Comment - Building
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - name: Post building status
        uses: your-org/nexus-vercel-summary@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          status: building
          environment: preview
          project-name: My Awesome App

  deploy:
    name: Deploy to Vercel
    needs: comment-building
    uses: ./.github/workflows/vercel-deploy.yml
    with:
      node-version: 20
      pnpm-version: "9.0.0"
      is-prod: false
      infisical-project-slug: my-project
      infisical-secret-path: /app
    secrets:
      INFISICAL_CLIENT_ID: ${{ secrets.INFISICAL_CLIENT_ID }}
      INFISICAL_CLIENT_SECRET: ${{ secrets.INFISICAL_CLIENT_SECRET }}
      VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
      VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
      VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

  comment-result:
    name: Comment - Result
    runs-on: ubuntu-latest
    needs: deploy
    if: always() && github.event_name == 'pull_request'
    steps:
      - name: Post successful status
        if: needs.deploy.result == 'success'
        uses: your-org/nexus-vercel-summary@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          status: successful
          deployment-url: ${{ needs.deploy.outputs.deployment-url }}
          environment: preview
          project-name: My Awesome App

      - name: Post failed status
        if: needs.deploy.result == 'failure'
        uses: your-org/nexus-vercel-summary@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          status: failed
          environment: preview
          project-name: My Awesome App
```

### Production Deployment Example

```yaml
name: Production Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-production:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      # ... your deployment steps ...

      - name: Comment on merged PR
        uses: your-org/nexus-vercel-summary@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          status: successful
          deployment-url: https://your-app.com
          environment: production
          project-name: My Production App
```

## Inputs

| Input            | Description                                                            | Required                     | Default            |
| ---------------- | ---------------------------------------------------------------------- | ---------------------------- | ------------------ |
| `github-token`   | GitHub token for commenting on PRs (use `${{ secrets.GITHUB_TOKEN }}`) | Yes                          | -                  |
| `status`         | Deployment status: `building`, `failed`, or `successful`               | Yes                          | -                  |
| `deployment-url` | The URL of the deployed application                                    | Only for `successful` status | -                  |
| `environment`    | Deployment environment: `production` or `preview`                      | No                           | `preview`          |
| `project-name`   | Name of the project being deployed                                     | No                           | Repository name    |
| `commit-sha`     | Commit SHA for the deployment                                          | No                           | Current commit SHA |

## Comment Examples

### Building

```
## 🔍 Vercel Preview Deployment

**My Awesome App** • feature/new-ui • a1b2c3d

⏳ **Building...**

Your deployment is being built. This comment will be updated when the deployment is ready.
```

### Successful

```
## 🔍 Vercel Preview Deployment

**My Awesome App** • feature/new-ui • a1b2c3d

✅ **Deployment Successful!**

🔗 **[Visit Deployment](https://my-app-preview.vercel.app)**

---

Deployed with Vercel
```

### Failed

```
## 🔍 Vercel Preview Deployment

**My Awesome App** • feature/new-ui • a1b2c3d

❌ **Deployment Failed**

The deployment has failed. Please check the build logs for more information.
```

## Permissions

Make sure your workflow has the necessary permissions to comment on pull requests:

```yaml
permissions:
  contents: read
  pull-requests: write
```

## Development

### Building

```bash
npm install
npm run build
```

The action must be built before it can be used. The build process bundles all dependencies into `dist/index.js`.

### Testing

```bash
npm test
```

## Tips

1. **Use Job Dependencies**: Structure your workflow so the "building" comment posts before deployment, and the result comment posts after.

2. **Update in Place**: The action automatically finds and updates existing comments, avoiding comment spam.

3. **Handle Both Success and Failure**: Always include both success and failure comment steps using `if: success()` and `if: failure()`.

4. **Commit SHA**: The action automatically extracts the commit SHA, but you can override it if needed.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
