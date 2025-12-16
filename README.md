# Nexus Vercel Summary

A GitHub Action that posts Vercel deployment status comments on pull requests. Supports multiple apps, real-time updates, and Vercel-style formatting.

## Features

- 🔄 **Real-time Updates** - Comments update in-place, no spam
- 🎨 **Vercel-style UI** - Clean formatting with emojis
- 🚀 **Multi-app Support** - Track multiple apps in a single workflow
- 🔗 **Direct Links** - Clickable deployment URLs

## Quick Start

### Single App Deployment

```yaml
name: Deploy

on:
  pull_request:

permissions:
  contents: read
  pull-requests: write

jobs:
  comment-building:
    runs-on: ubuntu-latest
    steps:
      - uses: nexus/nexus-vercel-summary@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          status: building

  deploy:
    needs: comment-building
    # Your deployment workflow here
    outputs:
      deployment-url: ${{ steps.deploy.outputs.url }}

  comment-result:
    runs-on: ubuntu-latest
    needs: deploy
    if: always()
    steps:
      - uses: nexus/nexus-vercel-summary@v1
        if: needs.deploy.result == 'success'
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          status: successful
          deployment-url: ${{ needs.deploy.outputs.deployment-url }}

      - uses: nexus/nexus-vercel-summary@v1
        if: needs.deploy.result == 'failure'
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          status: failed
```

### Multiple Apps Deployment

To track multiple apps, use the `app-name` input:

```yaml
jobs:
  # Frontend deployment
  frontend-building:
    runs-on: ubuntu-latest
    steps:
      - uses: nexus/nexus-vercel-summary@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          status: building
          app-name: Frontend

  deploy-frontend:
    needs: frontend-building
    # Deploy frontend
    outputs:
      url: ${{ steps.deploy.outputs.url }}

  frontend-result:
    needs: deploy-frontend
    if: always()
    runs-on: ubuntu-latest
    steps:
      - uses: nexus/nexus-vercel-summary@v1
        if: needs.deploy-frontend.result == 'success'
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          status: successful
          deployment-url: ${{ needs.deploy-frontend.outputs.url }}
          app-name: Frontend

  # Backend deployment (parallel)
  backend-building:
    runs-on: ubuntu-latest
    steps:
      - uses: nexus/nexus-vercel-summary@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          status: building
          app-name: Backend

  deploy-backend:
    needs: backend-building
    # Deploy backend
    outputs:
      url: ${{ steps.deploy.outputs.url }}

  backend-result:
    needs: deploy-backend
    if: always()
    runs-on: ubuntu-latest
    steps:
      - uses: nexus/nexus-vercel-summary@v1
        if: needs.deploy-backend.result == 'success'
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          status: successful
          deployment-url: ${{ needs.deploy-backend.outputs.url }}
          app-name: Backend
```

This creates separate comments for each app:
- `## 🔍 Vercel Preview Deployment - Frontend`
- `## 🔍 Vercel Preview Deployment - Backend`

## Inputs

| Input            | Description                                    | Required                     | Default         |
| ---------------- | ---------------------------------------------- | ---------------------------- | --------------- |
| `github-token`   | GitHub token (use `${{ secrets.GITHUB_TOKEN }}`) | Yes                          | -               |
| `status`         | `building`, `failed`, or `successful`          | Yes                          | -               |
| `deployment-url` | URL of deployed app                            | Only for `successful`        | -               |
| `environment`    | `production` or `preview`                      | No                           | `preview`       |
| `app-name`       | App name (for multi-app workflows)             | No                           | Repository name |
| `commit-sha`     | Commit SHA                                     | No                           | Current SHA     |

## Comment Examples

### Building
```
## 🔍 Vercel Preview Deployment - Frontend

**Frontend** • feature-branch • a1b2c3d

⏳ **Building...**

Your deployment is being built. This comment will be updated when the deployment is ready.
```

### Successful
```
## 🔍 Vercel Preview Deployment - Frontend

**Frontend** • feature-branch • a1b2c3d

✅ **Deployment Successful!**

🔗 **[Visit Deployment](https://frontend-preview.vercel.app)**

---

Deployed with Vercel
```

### Failed
```
## 🔍 Vercel Preview Deployment - Frontend

**Frontend** • feature-branch • a1b2c3d

❌ **Deployment Failed**

The deployment has failed. Please check the build logs for more information.
```

## Advanced Usage

### Production Deployments

```yaml
- uses: nexus/nexus-vercel-summary@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    status: successful
    deployment-url: https://app.com
    environment: production
```

### Dynamic Environment

```yaml
environment: ${{ github.ref == 'refs/heads/main' && 'production' || 'preview' }}
```

### Custom Commit SHA

```yaml
commit-sha: ${{ github.event.pull_request.head.sha }}
```

## How It Works

1. **Building phase** - Posts initial comment with "Building..." status
2. **Deployment runs** - Your Vercel deployment executes
3. **Result phase** - Updates same comment with success/failure

Each app gets its own comment tracked by `app-name` + `environment`, so multiple apps can deploy simultaneously without conflicts.

## Permissions

Required in your workflow:

```yaml
permissions:
  contents: read
  pull-requests: write
```

## Troubleshooting

**Comment not appearing?**
- Verify `pull-requests: write` permission is set
- Ensure running on a `pull_request` event
- Check `GITHUB_TOKEN` is passed correctly

**Multiple comments created?**
- Keep `app-name` and `environment` consistent across building/result steps
- Each unique `app-name` + `environment` combo creates a separate comment

**Deployment URL missing?**
- Verify your deploy job outputs `deployment-url`
- Check the output reference matches your workflow

## License

MIT
