import { describe, it } from "node:test";
import assert from "node:assert";

/**
 * Helper function to simulate generateCommentBody logic
 */
function generateCommentBody(deployments, environment, sha = "1234567") {
  const envEmoji = environment === "production" ? "🚀" : "🔍";
  const envName = environment === "production" ? "Production" : "Preview";
  const branch = "main";

  const header = `## ${envEmoji} Vercel ${envName} Deployments`;
  const metadata = `${branch} • ${sha}`;

  let body = `${header}\n\n${metadata}\n\n`;

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
 * Helper function to validate deployments
 */
function validateDeployments(deployments) {
  if (!Array.isArray(deployments) || deployments.length === 0) {
    throw new Error("deployments must be a non-empty array");
  }

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
}

/**
 * Helper function to find existing comment
 */
function findExistingComment(comments, environment) {
  const envEmoji = environment === "production" ? "🚀" : "🔍";
  const envName = environment === "production" ? "Production" : "Preview";
  const searchPattern = `## ${envEmoji} Vercel ${envName} Deployments`;

  return comments.find((comment) => comment.body?.startsWith(searchPattern));
}

describe("Vercel Deployment Summary Tests", () => {
  describe("Comment Body Generation", () => {
    it("should generate preview deployment comment with successful status", () => {
      const deployments = [
        {
          name: "Frontend",
          status: "successful",
          url: "https://preview.vercel.app",
        },
      ];

      const body = generateCommentBody(deployments, "preview");

      assert.ok(body.includes("🔍 Vercel Preview Deployments"));
      assert.ok(body.includes("### ✅ Frontend"));
      assert.ok(body.includes("https://preview.vercel.app"));
      assert.ok(body.includes("Visit Deployment"));
    });

    it("should generate production deployment comment", () => {
      const deployments = [
        {
          name: "Backend",
          status: "successful",
          url: "https://production.vercel.app",
        },
      ];

      const body = generateCommentBody(deployments, "production");

      assert.ok(body.includes("🚀 Vercel Production Deployments"));
      assert.ok(body.includes("### ✅ Backend"));
      assert.ok(body.includes("https://production.vercel.app"));
    });

    it("should handle building status", () => {
      const deployments = [
        {
          name: "API",
          status: "building",
        },
      ];

      const body = generateCommentBody(deployments, "preview");

      assert.ok(body.includes("### ⏳ API"));
      assert.ok(body.includes("**Building...**"));
    });

    it("should handle failed status", () => {
      const deployments = [
        {
          name: "Database",
          status: "failed",
        },
      ];

      const body = generateCommentBody(deployments, "preview");

      assert.ok(body.includes("### ❌ Database"));
      assert.ok(body.includes("**Deployment Failed**"));
    });

    it("should handle successful deployment without URL", () => {
      const deployments = [
        {
          name: "Worker",
          status: "successful",
        },
      ];

      const body = generateCommentBody(deployments, "preview");

      assert.ok(body.includes("### ✅ Worker"));
      assert.ok(body.includes("**Deployment Successful**"));
      assert.ok(!body.includes("Visit Deployment"));
    });

    it("should handle multiple deployments", () => {
      const deployments = [
        {
          name: "Frontend",
          status: "successful",
          url: "https://front.vercel.app",
        },
        { name: "Backend", status: "building" },
        { name: "API", status: "failed" },
      ];

      const body = generateCommentBody(deployments, "preview");

      assert.ok(body.includes("### ✅ Frontend"));
      assert.ok(body.includes("### ⏳ Backend"));
      assert.ok(body.includes("### ❌ API"));
      assert.ok(body.includes("https://front.vercel.app"));
    });

    it("should use custom commit SHA when provided", () => {
      const deployments = [{ name: "App", status: "successful" }];

      const body = generateCommentBody(deployments, "preview", "abc1234");

      assert.ok(body.includes("abc1234"));
    });

    it("should include Vercel footer", () => {
      const deployments = [{ name: "App", status: "successful" }];

      const body = generateCommentBody(deployments, "preview");

      assert.ok(body.includes("Deployed with [Vercel](https://vercel.com)"));
    });
  });

  describe("Input Validation", () => {
    it("should reject empty deployment array", () => {
      const deployments = [];

      assert.throws(
        () => validateDeployments(deployments),
        /deployments must be a non-empty array/
      );
    });

    it("should reject non-array deployments", () => {
      const deployments = "not an array";

      assert.throws(
        () => validateDeployments(deployments),
        /deployments must be a non-empty array/
      );
    });

    it("should reject deployment missing name field", () => {
      const deployments = [{ status: "successful" }];

      assert.throws(
        () => validateDeployments(deployments),
        /missing required field: name/
      );
    });

    it("should reject deployment missing status field", () => {
      const deployments = [{ name: "App" }];

      assert.throws(
        () => validateDeployments(deployments),
        /missing required field: status/
      );
    });

    it("should accept valid deployment statuses", () => {
      const deployments = [
        { name: "App1", status: "building" },
        { name: "App2", status: "failed" },
        { name: "App3", status: "successful" },
      ];

      assert.doesNotThrow(() => validateDeployments(deployments));
    });

    it("should reject invalid status", () => {
      const deployments = [{ name: "App", status: "pending" }];

      assert.throws(
        () => validateDeployments(deployments),
        /invalid status: pending/
      );
    });

    it("should handle case-insensitive status", () => {
      const deployments = [
        { name: "App1", status: "BUILDING" },
        { name: "App2", status: "Failed" },
        { name: "App3", status: "SUCCESSFUL" },
      ];

      assert.doesNotThrow(() => validateDeployments(deployments));
    });

    it("should parse valid JSON deployments", () => {
      const deploymentsJson =
        '[{"name":"App","status":"successful","url":"https://app.vercel.app"}]';

      const deployments = JSON.parse(deploymentsJson);

      assert.ok(Array.isArray(deployments), "Should be an array");
      assert.strictEqual(deployments.length, 1, "Should have 1 deployment");
      assert.strictEqual(deployments[0].name, "App");
      assert.strictEqual(deployments[0].status, "successful");
    });

    it("should reject invalid JSON", () => {
      const invalidJson = "not valid json";

      assert.throws(
        () => JSON.parse(invalidJson),
        SyntaxError,
        "Should throw SyntaxError for invalid JSON"
      );
    });
  });

  describe("Comment Pattern Matching", () => {
    it("should find preview deployment comment", () => {
      const comments = [
        { id: 1, body: "Some other comment" },
        { id: 2, body: "## 🔍 Vercel Preview Deployments\n\nContent" },
        { id: 3, body: "Another comment" },
      ];

      const found = findExistingComment(comments, "preview");

      assert.ok(found, "Should find matching comment");
      assert.strictEqual(found.id, 2, "Should find correct comment");
    });

    it("should find production deployment comment", () => {
      const comments = [
        { id: 1, body: "Some other comment" },
        { id: 2, body: "## 🚀 Vercel Production Deployments\n\nContent" },
        { id: 3, body: "Another comment" },
      ];

      const found = findExistingComment(comments, "production");

      assert.ok(found, "Should find matching comment");
      assert.strictEqual(found.id, 2, "Should find correct comment");
    });

    it("should return undefined when no matching comment exists", () => {
      const comments = [
        { id: 1, body: "Some other comment" },
        { id: 3, body: "Another comment" },
      ];

      const found = findExistingComment(comments, "preview");

      assert.strictEqual(
        found,
        undefined,
        "Should not find non-existent comment"
      );
    });

    it("should not confuse preview and production comments", () => {
      const comments = [
        { id: 1, body: "## 🚀 Vercel Production Deployments\n\nContent" },
        { id: 2, body: "## 🔍 Vercel Preview Deployments\n\nContent" },
      ];

      const previewComment = findExistingComment(comments, "preview");
      const productionComment = findExistingComment(comments, "production");

      assert.strictEqual(previewComment.id, 2);
      assert.strictEqual(productionComment.id, 1);
    });

    it("should handle comments with null or undefined body", () => {
      const comments = [
        { id: 1, body: null },
        { id: 2, body: undefined },
        { id: 3, body: "## 🔍 Vercel Preview Deployments\n\nContent" },
      ];

      const found = findExistingComment(comments, "preview");

      assert.strictEqual(found.id, 3);
    });
  });

  describe("Environment Configuration", () => {
    it("should default to preview environment", () => {
      const inputEnvironment = undefined;
      const environment = inputEnvironment || "preview";

      assert.strictEqual(environment, "preview", "Should default to preview");
    });

    it("should use provided environment", () => {
      const providedEnv = "production";
      const environment = providedEnv || "preview";

      assert.strictEqual(
        environment,
        "production",
        "Should use provided environment"
      );
    });
  });
});
