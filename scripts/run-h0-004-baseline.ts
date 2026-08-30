import { runDefaultH0BaselineCapture } from "../src/benchmarks/real-suite.js";

try {
  const result = await runDefaultH0BaselineCapture();

  console.log("H0-004 baseline captured.");
  console.log(`JSON: ${result.artifacts.jsonPath}`);
  console.log(`Markdown: ${result.artifacts.markdownPath}`);
  console.log(
    `SFCR: ${
      result.capture.report.suite.sfcr === null
        ? "n/a"
        : `${(result.capture.report.suite.sfcr * 100).toFixed(2)}%`
    }`,
  );
} catch (error) {
  console.error(
    error instanceof Error ? error.stack ?? error.message : String(error),
  );
  process.exitCode = 1;
}
