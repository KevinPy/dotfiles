const fs = require("fs");
const path = require("path");
const https = require("https");

const extensionIds = [
  "GitHub.copilot",
  "formulahendry.auto-close-tag",
  "formulahendry.auto-rename-tag",
  "aaron-bond.better-comments",
  "biomejs.biome",
  "denoland.vscode-deno",
  "mikestead.dotenv",
  "dbaeumer.vscode-eslint",
  "ESPHome.esphome-vscode",
  "mhutchie.git-graph",
  "GitHub.copilot-chat",
  "ecmel.vscode-html-css",
  "chamboug.js-auto-backticks",
  "firsttris.vscode-jest-runner",
  "bierner.markdown-preview-github-styles",
  "PKief.material-icon-theme",
  "mintlify.document",
  "monokai.theme-monokai-pro-vscode",
  "christian-kohler.npm-intellisense",
  "christian-kohler.path-intellisense",
  "vunguyentuan.vscode-postcss",
  "csstools.postcss",
  "esbenp.prettier-vscode",
  "inferrinizzard.prettier-sql-vscode",
  "YoavBls.pretty-ts-errors",
  "Prisma.prisma",
  "KevinRose.vsc-python-indent",
  "WallabyJs.quokka-vscode",
  "mechatroner.rainbow-csv",
  "RapidAPI.vscode-rapidapi-client",
  "devonray.snippet",
  "bradlc.vscode-tailwindcss",
  "WallabyJs.wallaby-vscode",
  "redhat.vscode-yaml",
];

function fetchExtensionDetails(extensionId) {
  const apiUrl = `https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery`;
  const body = JSON.stringify({
    filters: [
      {
        criteria: [{ filterType: 7, value: extensionId }],
      },
    ],
    flags: 914,
  });
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json;api-version=3.0-preview.1",
      "Content-Length": Buffer.byteLength(body),
    },
  };
  return new Promise((resolve, reject) => {
    const req = https.request(apiUrl, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          const ext = json.results[0].extensions[0];
          if (!ext) return resolve(null);
          const asset = ext.versions[0].files.find(
            (f) =>
              f.assetType === "Microsoft.VisualStudio.Services.Icons.Default"
          );
          resolve({
            id: extensionId,
            name: ext.displayName,
            description: ext.shortDescription,
            icon: asset ? asset.source : "",
            url: `https://marketplace.visualstudio.com/items?itemName=${extensionId}`,
          });
        } catch (e) {
          resolve(null);
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const rows = await Promise.all(extensionIds.map(fetchExtensionDetails));
  const filtered = rows.filter(Boolean);
  const tableRows = filtered.map(
    (ext) =>
      `| <a href="${ext.url}" target="_blank"><img width="100" src="${ext.icon}" /></a> | <h3><a href="${ext.url}" target="_blank">${ext.name}</a></h3><p>${ext.description}</p> |`
  );
  const markdown = [
    "# VS Code Extensions",
    "",
    "| Image | Description |",
    "| --- | --- |",
    ...tableRows,
  ].join("\n");
  fs.writeFileSync(path.join(__dirname, "../vs-code-extensions.md"), markdown);
  console.log("Markdown file generated: vs-code-extensions.md");
}

main();
