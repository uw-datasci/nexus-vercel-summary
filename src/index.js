import { info, getInput, setOutput, setFailed } from "@actions/core";

async function run() {
  try {
    // Get inputs defined in action.yml
    const exampleInput = getInput("example-input", { required: true });

    info(`Running action with input: ${exampleInput}`);

    // TODO: Implement your action logic here
    // Example: Process the input and generate output
    const result = `Processed: ${exampleInput}`;

    // Set outputs that can be used by other steps
    setOutput("example-output", result);

    info("Action completed successfully!");
  } catch (error) {
    setFailed(`Action failed: ${error.message}`);
  }
}

await run();
