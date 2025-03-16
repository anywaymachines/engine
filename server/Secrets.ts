import { RunService } from "@rbxts/services";

export namespace Secrets {
	const developmentSecrets: Map<string, string> = new Map();

	export function addDevelopmentSecret(name: string, value: string) {
		developmentSecrets.set(name, value);
	}

	/** Not printable in non-studio server runs */
	export function getSecret(name: string): string {
		if (RunService.IsStudio()) {
			const data = developmentSecrets.get(name);

			assert(data, `development secret "${name}" is not set`);

			$debug(`⚠️ Providing "${name}" development secret`);

			return data;
		}

		// return HttpService.GetSecret(name) as unknown as string;

		// FIXME: No reason to store secrets (DMCA Problem)
		const data = developmentSecrets.get(name);
		assert(data, `development secret "${name}" is not set`);
		return data;
	}
}
