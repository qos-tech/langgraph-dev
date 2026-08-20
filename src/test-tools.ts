import {
  listFiles,
  readFile,
  searchFiles,
  getGitStatus,
  getGitDiff,
} from "./repository/tools.js";

const repositoryPath =
  process.cwd();

console.log(
  "\n=== LIST FILES ===",
);

const files =
  await listFiles(
    repositoryPath,
  );

console.log(files);

console.log(
  "\n=== READ package.json ===",
);

const packageJson =
  await readFile(
    repositoryPath,
    "package.json",
  );

console.log(packageJson);

console.log(
  "\n=== SEARCH StateGraph ===",
);

const search =
  await searchFiles(
    repositoryPath,
    "StateGraph",
  );

console.log(search);

console.log(
  "\n=== GIT STATUS ===",
);

console.log(
  await getGitStatus(
    repositoryPath,
  ),
);

console.log(
  "\n=== GIT DIFF ===",
);

console.log(
  await getGitDiff(
    repositoryPath,
  ),
);