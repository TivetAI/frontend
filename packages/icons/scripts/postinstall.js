const fs = require("node:fs");
const dedent = require("dedent");
const { spawnSync } = require("node:child_process");
const { join, resolve } = require("node:path");
const manifest = require("./../manifest.json");
const esbuild = require("esbuild");

let hasFaToken = !!process.env.FONTAWESOME_PACKAGE_TOKEN;

const sourceDir = join(__dirname, "..", "src");

if (!fs.existsSync(sourceDir)){
    fs.mkdirSync(sourceDir, { recursive: true });
}

if (process.env.FONTAWESOME_PACKAGE_TOKEN) {
	fs.writeFileSync(
		join(sourceDir, ".yarnrc.yml"),
		dedent`
		nodeLinker: node-modules

		enableImmutableInstalls: false

		npmScopes:
		  fortawesome:
		    npmAlwaysAuth: true
		    npmRegistryServer: 'https://npm.fontawesome.com/'
		    npmAuthToken: \${FONTAWESOME_PACKAGE_TOKEN}
		  awesome.me:
		    npmAlwaysAuth: true
		    npmRegistryServer: "https://npm.fontawesome.com/"
		    npmAuthToken: \${FONTAWESOME_PACKAGE_TOKEN}
		`,
	);

	fs.writeFileSync(join(sourceDir, "./package.json"), JSON.stringify({
		"name": "@tivet-gg/internal-icons",
		"private": true,
		"sideEffects": false,
		"dependencies": {
			"@awesome.me/kit-63db24046b": "^1.0.11",
			"@fortawesome/pro-regular-svg-icons": "6.6.0",
			"@fortawesome/pro-solid-svg-icons": "6.6.0"
		}
	}));

	fs.writeFileSync(join(sourceDir, "yarn.lock"), "");

	spawnSync(
		"yarn",
		["config", "set", "-H", "enableImmutableInstalls", "false"],
		{
			stdio: "inherit",
			cwd: sourceDir,
		},
	);

	spawnSync("yarn", [], {
		stdio: "inherit",
		cwd: sourceDir,
		env: {
			...process.env,
			CI: 0,
		},
	});
}

const banner = dedent`
  // This file is generated by scripts/postinstall.js
  // Do not modify this file directly
  // ${hasFaToken ? "This file includes pro icons" : "This file does not include pro icons, all pro icons are replaced with square icon. To use pro icons, please add FONTAWESOME_PACKAGE_TOKEN to your environment and rebuild this package."} \n


`;

let indexJsSource = dedent`
  ${banner}
  import {FontAwesomeIcon } from "@fortawesome/react-fontawesome";
  import { createElement } from "react";
  export function Icon(props) { return createElement(FontAwesomeIcon, props)}
`;



for (const [pkg, { icons }] of Object.entries(manifest)) {
	const isCustom = pkg.startsWith("@awesome.me/kit-");
	const isPro = pkg.startsWith("@fortawesome/pro-");

	if (isCustom) {
		if (hasFaToken) {
			indexJsSource += `export * from "${pkg}";\n`;
		} else {
			const iconNames = icons.map(({ icon }) => icon);
			const exp = iconNames
				.map((icon) => `definition as ${icon}`)
				.join(", ");
			indexJsSource += `export { ${exp} } from "@fortawesome/free-solid-svg-icons/faSquare";\n`;
		}
	} else {
		for (const { icon, aliases } of icons) {
			if (!indexJsSource.includes(`export { definition as ${icon} }`)) {
				if (hasFaToken || !isPro) {
					indexJsSource += `export { definition as ${icon} } from "${pkg}/${icon}";\n`;
				} else {
					indexJsSource += `export { definition as ${icon} } from "@fortawesome/free-solid-svg-icons/faSquare";\n`;
				}
			}
			for (const alias of aliases) {
				if (
					alias === icon ||
					indexJsSource.includes(`export { definition as ${icon} }`)
				) {
					continue;
				}
				indexJsSource += `export { definition as ${alias} } from "${pkg}/${icon}";\n`;
			}
		}
	}
}
fs.writeFileSync(join(sourceDir, "index.gen.js"), `${indexJsSource}`);

let indexTsSource = dedent`
  ${indexJsSource}
  export type IconProp = string | { prefix: string; iconName: string } | [string, string];
`;
fs.writeFileSync(join(sourceDir, "index.gen.ts"), `${indexTsSource}`);

async function build() {
	await esbuild.build({
		entryPoints: [resolve(sourceDir, "index.gen.js")],
		outfile: resolve(__dirname, "..", "dist", "index.js"),
		external: ["react", "react-dom","@fortawesome/react-fontawesome", "@fortawesome/free-solid-svg-icons","@fortawesome/fontawesome-svg-core", "@fortawesome/free-brands-svg-icons"],
		bundle: true,
		platform: "browser",
		format: "esm",
		treeShaking: true,
	});
}

build();
