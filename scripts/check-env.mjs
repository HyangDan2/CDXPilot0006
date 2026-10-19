const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 13))
  throw new Error("Node 22.13+ required");
console.log("Environment:", process.version);
