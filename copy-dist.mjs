import { readdirSync, copyFileSync } from "fs";

const files = readdirSync("./dist");
for (const file of files) {
  const match = file.match(/^.*\.(discord-rpc\.(?:mjs|json))$/);
  if (match) {
    const dest = `luna.${match[1]}`;
    if (file !== dest) {
      copyFileSync(`./dist/${file}`, `./dist/${dest}`);
      console.log(`Copied ${file} -> ${dest}`);
    }
  }
}
