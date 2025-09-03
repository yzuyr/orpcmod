#! /usr/bin/env bun
import { parseArgs } from "util";
import { match } from "ts-pattern";
import { z } from "zod";
import path from "path";
import { findUp } from "find-up-simple";

const REPO = "yzuyr/orpcmod";

const CommandSchema = z.tuple([z.literal("add"), z.string()]);

const { tokens } = parseArgs({
	args: Bun.argv,
	strict: true,
	allowPositionals: true,
	tokens: true,
});

const positionals = tokens
	.slice(-2)
	.filter((token) => token.kind === "positional")
	.map((token) => token.value);

const command = CommandSchema.safeParse(positionals);

if (!command.success) {
	console.error("Invalid command");
	process.exit(1);
}

const [commandName, commandValue] = command.data;

async function run() {
	return match(commandName)
		.with("add", async () => {
			const packageJsonPath = await findUp("package.json", {
				cwd: __dirname,
			});
			let cwd = process.cwd();
			if (packageJsonPath) {
				const packageContent = await Bun.file(packageJsonPath).text();
				const packageJson = JSON.parse(packageContent);
				if (packageJson?.orpcmod?.routers) {
					cwd = path.join(cwd, packageJson.orpcmod.routers);
				}
			}
			const target = `https://raw.githubusercontent.com/${REPO}/main/routers/${commandValue}.ts`;
			const request = await fetch(target);
			await Bun.write(
				path.join(cwd, `${commandValue}.ts`),
				await request.arrayBuffer(),
			);
			console.info(`Router ${commandValue} added successfully`);
			process.exit(0);
		})
		.exhaustive();
}

await run();
