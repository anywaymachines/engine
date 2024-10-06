import { HttpService, RunService } from "@rbxts/services";

export namespace Secrets {
	const developmentSecrets: Map<string, string> = new Map();

	class FakeSecret {
		constructor(private value: string) {}

		AddPrefix(prefix: string) {
			this.value = prefix + this.value;
			return this.value;
		}

		AddSuffix(suffix: string) {
			this.value = this.value + suffix;
			return this.value;
		}
	}

	export function addDevelopmentSecret(name: string, value: string) {
		developmentSecrets.set(name, value);
	}

	/** Not printable in non-studio server runs */
	export function getSecret(name: string): Secret | FakeSecret {
		if (RunService.IsStudio()) {
			const data = developmentSecrets.get(name);

			assert(data, `development secret "${name}" is not set`);

			$debug(`⚠️ Providing "${name}" development secret`);

			return new FakeSecret(data);
		}

		return HttpService.GetSecret(name);
	}
}
