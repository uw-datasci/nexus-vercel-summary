# Nexus Vercel Summary

A GitHub Action that posts Vercel deployment status comments on pull requests. Supports multiple apps in a single comment with automatic updates.

## Usage

Add this to your workflow after your deployment steps:

```yaml
- uses: uw-datasci/nexus-vercel-summary@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    deployments: |
      [
        {
          "name": "Frontend",
          "status": "successful",
          "url": "https://frontend.vercel.app"
        },
        {
          "name": "Backend",
          "status": "successful",
          "url": "https://backend.vercel.app"
        }
      ]
```

**Required Permissions:**

```yaml
permissions:
  pull-requests: write
```

## Configuration

### Inputs

| Input          | Required | Default   | Description                      |
| -------------- | -------- | --------- | -------------------------------- |
| `github-token` | Yes      | -         | GitHub token                     |
| `deployments`  | Yes      | -         | JSON array of deployment objects |
| `environment`  | No       | `preview` | `production` or `preview`        |
| `commit-sha`   | No       | Auto      | Override commit SHA display      |

### Deployment Object

Each deployment in the array needs:

- `name` (required): Display name
- `status` (required): `building`, `failed`, or `successful`
- `url` (optional): Deployment URL

## Examples

### Different Statuses

```yaml
deployments: |
  [
    {
      "name": "Frontend",
      "status": "successful",
      "url": "https://frontend.vercel.app"
    },
    {
      "name": "Backend",
      "status": "building"
    },
    {
      "name": "API",
      "status": "failed"
    }
  ]
```

### Production Environment

```yaml
- uses: uw-datasci/nexus-vercel-summary@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    environment: production
    deployments: |
      [{"name": "App", "status": "successful", "url": "https://app.com"}]
```

### With Deployment Outputs

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    outputs:
      url: ${{ steps.deploy.outputs.url }}
      status: ${{ steps.deploy.outcome }}
    steps:
      - id: deploy
        run: |
          # Your deployment logic
          echo "url=https://app.vercel.app" >> $GITHUB_OUTPUT

  comment:
    needs: deploy
    if: always()
    runs-on: ubuntu-latest
    steps:
      - uses: uw-datasci/nexus-vercel-summary@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deployments: |
            [{
              "name": "App",
              "status": "${{ needs.deploy.outputs.status == 'success' && 'successful' || 'failed' }}",
              "url": "${{ needs.deploy.outputs.url }}"
            }]
```

## Output

Creates a comment like this on your pull requests:

```
## 🔍 Vercel Preview Deployments

main • a1b2c3d

### ✅ Frontend
🔗 **[Visit Deployment](https://frontend.vercel.app)**

### ✅ Backend
🔗 **[Visit Deployment](https://backend.vercel.app)**

---

Deployed with Vercel
```

The comment automatically updates in-place when you run the action again (one comment per environment).

## License

MIT
