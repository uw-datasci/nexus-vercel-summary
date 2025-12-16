import { info, getInput, setFailed } from "@actions/core";
import { context, getOctokit } from "@actions/github";

/**
 * Generate the comment body for deployments
 */
function generateCommentBody(deployments, environment, commitSha) {
  const envEmoji = environment === "production" ? "🚀" : "🔍";
  const envName = environment === "production" ? "Production" : "Preview";
  const sha = commitSha || context.sha.substring(0, 7);
  const branch = context.ref.replace("refs/heads/", "");

  const header = `## ${envEmoji} Vercel ${envName} Deployments`;
  const metadata = `${branch} • ${sha}`;

  let body = `${header}\n\n${metadata}\n\n`;

  // Build status for each app
  deployments.forEach((deployment) => {
    const name = deployment.name || "App";
    const status = deployment.status.toLowerCase();

    if (status === "building") {
      body += `### ⏳ ${name}\n**Building...**\n\n`;
    } else if (status === "failed") {
      body += `### ❌ ${name}\n**Deployment Failed**\n\n`;
    } else if (status === "successful") {
      if (deployment.url) {
        body += `### ✅ ${name}\n🔗 **[Visit Deployment](${deployment.url})**\n\n`;
      } else {
        body += `### ✅ ${name}\n**Deployment Successful**\n\n`;
      }
    }
  });

  body += `---\n\n<sub>Deployed with [Vercel](https://vercel.com)</sub>`;

  return body;
}

/**
 * Find existing deployment comment
 */
async function findExistingComment(
  octokit,
  owner,
  repo,
  prNumber,
  environment
) {
  try {
    const { data: comments } = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: prNumber,
    });

    const envEmoji = environment === "production" ? "🚀" : "🔍";
    const envName = environment === "production" ? "Production" : "Preview";
    const searchPattern = `## ${envEmoji} Vercel ${envName} Deployments`;

    // Find comment that matches the pattern
    return comments.find((comment) => comment.body?.startsWith(searchPattern));
  } catch (error) {
    info(`Could not fetch existing comments: ${error.message}`);
    return null;
  }
}

/**
 * Main action logic
 */
async function run() {
  try {
    // Get inputs
    const token = getInput("github-token", { required: true });
    const deploymentsJson = getInput("deployments", { required: true });
    const environment = getInput("environment") || "preview";
    const commitSha = getInput("commit-sha");

    info(`Running Nexus Vercel Summary action`);
    info(`Environment: ${environment}`);

    // Only run on pull requests
    if (!context.payload.pull_request) {
      info("Not a pull request event, skipping comment");
      return;
    }

    const prNumber = context.payload.pull_request.number;
    const { owner, repo } = context.repo;

    info(`PR Number: ${prNumber}`);
    info(`Repository: ${owner}/${repo}`);

    // Parse deployments JSON
    let deployments;
    try {
      deployments = JSON.parse(deploymentsJson);
    } catch (error) {
      throw new Error(`Invalid deployments JSON: ${error.message}`);
    }

    if (!Array.isArray(deployments) || deployments.length === 0) {
      throw new Error("deployments must be a non-empty array");
    }

    // Validate each deployment
    deployments.forEach((deployment, index) => {
      if (!deployment.name) {
        throw new Error(
          `Deployment at index ${index} missing required field: name`
        );
      }
      if (!deployment.status) {
        throw new Error(
          `Deployment at index ${index} missing required field: status`
        );
      }
      const validStatuses = ["building", "failed", "successful"];
      if (!validStatuses.includes(deployment.status.toLowerCase())) {
        throw new Error(
          `Deployment "${deployment.name}" has invalid status: ${
            deployment.status
          }. Must be one of: ${validStatuses.join(", ")}`
        );
      }
    });

    info(`Processing ${deployments.length} deployment(s)`);

    // Initialize GitHub client
    const octokit = getOctokit(token);

    // Generate comment body
    const commentBody = generateCommentBody(
      deployments,
      environment,
      commitSha
    );

    // Find existing comment
    const existingComment = await findExistingComment(
      octokit,
      owner,
      repo,
      prNumber,
      environment
    );

    if (existingComment) {
      // Update existing comment
      info(`Updating existing comment (ID: ${existingComment.id})`);
      await octokit.rest.issues.updateComment({
        owner,
        repo,
        comment_id: existingComment.id,
        body: commentBody,
      });
      info("Comment updated successfully!");
    } else {
      // Create new comment
      info("Creating new comment");
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: commentBody,
      });
      info("Comment created successfully!");
    }
  } catch (error) {
    setFailed(`Action failed: ${error.message}`);
  }
}

await run();
