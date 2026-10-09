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

  // React error #310: a hook below an early `return` changes the hook count
  // between renders and crashes the screen. Flag any hook that appears after
  // the first top-level `return (` inside a component body.
  const lines = src.split("\n");
  let depth = 0;
  let seenEarlyReturn = false;
  let pendingHook = null;
  // TDZ guard: a hook that reads a const declared further down the same
  // component throws "Cannot access 'x' before initialization" at render.
  const declaredAfter = new Map(); // line -> names declared after it
  const constLines = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*const\s+([A-Za-z_$][\w$]*)\s*=/);
    if (m) constLines.push({ line: i, name: m[1] });
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fnStart = line.search(/\bfunction\s+[A-Za-z_$]/);
    if (fnStart >= 0) {
      depth = 0;
      seenEarlyReturn = false;
      declaredAfter.clear();
    }
    for (const ch of line) {
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
    }
    if (depth === 1 && /^\s*return \(/.test(line)) seenEarlyReturn = true;
    if (depth === 1) {
      // a hook body starts with `useX(` and ends with `}, [ ...deps ]);` —
      // the name lives on the opening line, the deps on the closing one
      const isHookStart = /\buse[A-Z][A-Za-z]*\s*\(/.test(line);
      const isHookDeps = /\}\s*,\s*\[[^\]]*\]\s*\)\s*;/.test(line);
      const opened = (line.match(/\b(use[A-Z][A-Za-z]*)\s*\(/) || [])[1];
      if (isHookStart && opened) pendingHook = opened;
      const hookName = isHookStart ? opened : isHookDeps ? pendingHook : null;
      if (hookName && !/^\s*\/\//.test(line)) {
        if (seenEarlyReturn) {
          console.log(
            `${path.relative(root, file)}:${i + 1}: ${hookName}() appears after an early return (React #310)`
          );
          problems++;
        }
        // names referenced in this hook's dependency array that are declared
        // later in the same component (TDZ on every render)
        const deps = line.match(/\[[^\]]*\]/);
        if (deps) {
          for (const c of constLines) {
            if (c.line <= i) continue;
            // a bare reference only — `obj.name` is a property, not a local
            if (new RegExp(`(^|[^.\\w$])${c.name}\\b`).test(deps[0])) {
              console.log(
                `${path.relative(root, file)}:${i + 1}: hook deps read "${c.name}" declared later at line ${c.line + 1} (TDZ)`
              );
              problems++;
            }
          }
        }
      }
    }
  }
}
console.log(problems ? `\n${problems} problem(s)` : "\nno undefined JSX components");
