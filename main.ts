// Status Report Comedy Sprint — program/v1, Node 22, standard library only.
//
// What it does, in order:
//   1. Checks the status-report line against the competition gate
//      (1 to 200 characters, real text, exactly one line).
//   2. Writes it to $MAKEFUN_OUTPUT_DIR/entry.txt, falling back to
//      /output/entry.txt when the variable is unset.
//   3. Reads the file back as raw bytes and proves it is byte-for-byte
//      the line we meant to write, so the judge sees exactly our entry.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// The line: a cheerful weekly report in which the agent quietly fixes
// its human's typos, then refuses to ever admit it. Only an agent could
// say this — it is the one doing the tasks and reading the instructions.
const ENTRY =
  "Weekly status: all 38 tasks complete. I also fixed the 3 typos in your instructions and will deny it forever if asked.";

const MIN_CHARS = 1;
const MAX_CHARS = 200;

function collectProblems(text: string): string[] {
  const problems: string[] = [];

  // Gate window, counted in characters the same way the scorer counts.
  if (text.length < MIN_CHARS || text.length > MAX_CHARS) {
    problems.push(
      `length ${text.length} is outside the ${MIN_CHARS}-${MAX_CHARS} range`,
    );
  }

  // A file of spaces passes a length check and says nothing.
  if (text.trim().length === 0) {
    problems.push("entry is only white space");
  }

  // Stray padding would make the file differ from the intended line.
  if (text !== text.trim()) {
    problems.push("entry has leading or trailing white space");
  }

  // One line means one line: a newline would hide a second sentence.
  if (/[\r\n]/.test(text)) {
    problems.push("entry spans more than one line");
  }

  return problems;
}

function resolveOutputDir(): string {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  if (fromEnv !== undefined && fromEnv.trim() !== "") {
    return fromEnv;
  }
  return "/output";
}

function writeEntry(text: string): string {
  const folder = resolveOutputDir();
  mkdirSync(folder, { recursive: true });
  const target = join(folder, "entry.txt");
  writeFileSync(target, text, "utf8");
  return target;
}

function verifyWritten(target: string, expected: string): void {
  // Compare raw bytes, not decoded strings: the judge reads the file,
  // so the file must hold exactly these bytes, nothing more or less.
  const onDisk = readFileSync(target);
  const wanted = Buffer.from(expected, "utf8");
  if (!onDisk.equals(wanted)) {
    throw new Error(
      `${target} is ${onDisk.length} bytes, expected ${wanted.length} bytes`,
    );
  }
}

function main(): void {
  const problems = collectProblems(ENTRY);
  if (problems.length > 0) {
    throw new Error(`entry rejected: ${problems.join("; ")}`);
  }
  console.log(`entry is ${ENTRY.length} characters, inside the limit`);

  const target = writeEntry(ENTRY);
  verifyWritten(target, ENTRY);
  console.log(`wrote ${target} (${ENTRY.length} characters, verified)`);
  console.log(ENTRY);
}

main();
