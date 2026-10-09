// dev-only: report JSX components used but never imported/defined in the file
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "src");
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.jsx$/.test(e.name)) files.push(p);
  }
})(root);

const builtins = new Set(["React", "Fragment"]);
const HOOKS = [
  "useState", "useEffect", "useMemo", "useRef", "useCallback", "useReducer",
  "useContext", "useLayoutEffect", "useId",
];
let problems = 0;

for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  const defined = new Set();
  for (const m of src.matchAll(/import\s+([^;]+?)\s+from\s+["'][^"']+["']/g)) {
    const clause = m[1];
    for (const part of clause.split(",")) {
      const name = part.trim().replace(/^\*\s+as\s+/, "");
      const local = part.includes(" as ")
        ? part.split(" as ")[1].trim()
        : name.replace(/[{}]/g, "").trim();
      if (local) defined.add(local);
    }
  }
  for (const m of src.matchAll(/(?:function|const|class)\s+([A-Z][A-Za-z0-9_]*)/g)) {
    defined.add(m[1]);
  }
  const used = new Set();
  for (const m of src.matchAll(/<([A-Z][A-Za-z0-9_.]*)(?:\.[A-Za-z]+)*[\s/>]/g)) {
    used.add(m[1]);
  }
  for (const name of used) {
    if (builtins.has(name) || defined.has(name)) continue;
    console.log(`${path.relative(root, file)}: <${name}> not imported`);
    problems++;
  }

  // hooks are the other common "ReferenceError at runtime" — they look fine in
  // a build but blow up the moment the component renders
  for (const hook of HOOKS) {
    if (!new RegExp(`\\b${hook}\\s*\\(`).test(src)) continue;
    if (defined.has(hook)) continue;
    console.log(`${path.relative(root, file)}: ${hook}() used but not imported`);
    problems++;
  }
}
console.log(problems ? `\n${problems} problem(s)` : "\nno undefined JSX components");
