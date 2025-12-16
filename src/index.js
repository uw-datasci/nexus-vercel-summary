import { info, getInput, setFailed } from "@actions/core";
import { context, getOctokit } from "@actions/github";

/**
 * Generate the comment body based on deployment status
 */
function generateCommentBody(status, deploymentUrl, environment, projectName, commitSha) {
  const envEmoji = environment === 'production' ? '🚀' : '🔍';
  const envName = environment === 'production' ? 'Production' : 'Preview';
  const projectTitle = projectName || context.repo.repo;
  const sha = commitSha || context.sha.substring(0, 7);
  const branch = context.ref.replace('refs/heads/', '');

  const header = `## ${envEmoji} Vercel ${envName} Deployment`;
  const metadata = `**${projectTitle}** • ${branch} • ${sha}`;

  if (status === 'building') {
    return `${header}\n\n${metadata}\n\n⏳ **Building...**\n\nYour deployment is being built. This comment will be updated when the deployment is ready.`;
  }

  if (status === 'failed') {
    return `${header}\n\n${metadata}\n\n❌ **Deployment Failed**\n\nThe deployment has failed. Please check the build logs for more information.`;
  }

  if (status === 'successful') {
    if (!deploymentUrl) {
      throw new Error('deployment-url is required when status is successful');
    }
    return `${header}\n\n${metadata}\n\n✅ **Deployment Successful!**\n\n🔗 **[Visit Deployment](${deploymentUrl})**\n\n---\n\n<sub>Deployed with [Vercel](https://vercel.com)</sub>`;
  }

  throw new Error(`Invalid status: ${status}. Must be one of: building, failed, successful`);
}

/**
 * Find existing deployment comment
 */
async function findExistingComment(octokit, owner, repo, prNumber) {
  try {
    const { data: comments } = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: prNumber,
    });

    // Find comment that starts with the deployment header
    return comments.find(comment => 
      comment.body && (
        comment.body.includes('## 🚀 Vercel Production Deployment') ||
        comment.body.includes('## 🔍 Vercel Preview Deployment')
      )
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
    const environment = getInput("environment") || 'preview';
    const projectName = getInput("project-name");
    const commitSha = getInput("commit-sha");

    info(`Running Vercel deployment status action`);
    info(`Status: ${status}`);
    info(`Environment: ${environment}`);

    // Validate status
    const validStatuses = ['building', 'failed', 'successful'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Only run on pull requests
    if (!context.payload.pull_request) {
      info('Not a pull request event, skipping comment');
      return;
    }

    const prNumber = context.payload.pull_request.number;
    const { owner, repo } = context.repo;

    info(`PR Number: ${prNumber}`);
    info(`Repository: ${owner}/${repo}`);

    // Initialize GitHub client
    const octokit = getOctokit(token);

    // Generate comment body
    const commentBody = generateCommentBody(status, deploymentUrl, environment, projectName, commitSha);

    // Find existing comment
    const existingComment = await findExistingComment(octokit, owner, repo, prNumber);

    if (existingComment) {
      // Update existing comment
      info(`Updating existing comment (ID: ${existingComment.id})`);
      await octokit.rest.issues.updateComment({
        owner,
        repo,
        comment_id: existingComment.id,
        body: commentBody,
      });
      info('Comment updated successfully!');
    } else {
      // Create new comment
      info('Creating new comment');
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: commentBody,
      });
      info('Comment created successfully!');
    }

  } catch (error) {
    setFailed(`Action failed: ${error.message}`);
  }
}

await run();
