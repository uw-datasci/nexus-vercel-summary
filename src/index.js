import { info, getInput, setFailed } from "@actions/core";
import { context, getOctokit } from "@actions/github";

/**
 * Generate the comment body based on deployment status
 */
function generateCommentBody(
  status,
  deploymentUrl,
  environment,
  appName,
  commitSha
) {
  const envEmoji = environment === "production" ? "🚀" : "🔍";
  const envName = environment === "production" ? "Production" : "Preview";
  const appTitle = appName || context.repo.repo;
  const sha = commitSha || context.sha.substring(0, 7);
  const branch = context.ref.replace("refs/heads/", "");

  const header = `## ${envEmoji} Vercel ${envName} Deployment${
    appName ? ` - ${appName}` : ""
  }`;
  const metadata = `**${appTitle}** • ${branch} • ${sha}`;

  if (status === "building") {
    return `${header}\n\n${metadata}\n\n⏳ **Building...**\n\nYour deployment is being built. This comment will be updated when the deployment is ready.`;
  }

  if (status === "failed") {
    return `${header}\n\n${metadata}\n\n❌ **Deployment Failed**\n\nThe deployment has failed. Please check the build logs for more information.`;
  }

  if (status === "successful") {
    if (!deploymentUrl) {
      throw new Error("deployment-url is required when status is successful");
    }
    return `${header}\n\n${metadata}\n\n✅ **Deployment Successful!**\n\n🔗 **[Visit Deployment](${deploymentUrl})**\n\n---\n\n<sub>Deployed with [Vercel](https://vercel.com)</sub>`;
  }

  throw new Error(
    `Invalid status: ${status}. Must be one of: building, failed, successful`
  );
}

/**
 * Find existing deployment comment for a specific app and environment
 */
async function findExistingComment(
  octokit,
  owner,
  repo,
  prNumber,
  environment,
  appName
) {
  try {
    const { data: comments } = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: prNumber,
    });

    const envEmoji = environment === "production" ? "🚀" : "🔍";
    const envName = environment === "production" ? "Production" : "Preview";
    const searchPattern = `## ${envEmoji} Vercel ${envName} Deployment${
      appName ? ` - ${appName}` : ""
    }`;

    // Find comment that matches the specific app and environment
    return comments.find(
      (comment) => comment.body && comment.body.startsWith(searchPattern)
    );
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
    const status = getInput("status", { required: true }).toLowerCase();
    const deploymentUrl = getInput("deployment-url");
    const environment = getInput("environment") || "preview";
    const appName = getInput("app-name") || getInput("project-name"); // Support both, prefer app-name
    const commitSha = getInput("commit-sha");

    info(`Running Nexus Vercel Summary action`);
    info(`Status: ${status}`);
    info(`Environment: ${environment}`);
    if (appName) {
      info(`App: ${appName}`);
    }

    // Validate status
    const validStatuses = ["building", "failed", "successful"];
    if (!validStatuses.includes(status)) {
      throw new Error(
        `Invalid status: ${status}. Must be one of: ${validStatuses.join(", ")}`
      );
    }

    // Only run on pull requests
    if (!context.payload.pull_request) {
      info("Not a pull request event, skipping comment");
      return;
    }

    const prNumber = context.payload.pull_request.number;
    const { owner, repo } = context.repo;

    info(`PR Number: ${prNumber}`);
    info(`Repository: ${owner}/${repo}`);

    // Initialize GitHub client
    const octokit = getOctokit(token);

    // Generate comment body
    const commentBody = generateCommentBody(
      status,
      deploymentUrl,
      environment,
      appName,
      commitSha
    );

    // Find existing comment for this specific app and environment
    const existingComment = await findExistingComment(
      octokit,
      owner,
      repo,
      prNumber,
      environment,
      appName
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
