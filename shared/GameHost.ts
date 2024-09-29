import { Logger } from "engine/shared/Logger";
import type { DIContainer } from "engine/shared/di/DIContainer";

export class GameHost {
	private readonly hostedServices: IHostedService[] = [];

	constructor(readonly services: DIContainer) {}

	run(): void {
		Logger.beginScope("GameHost");
		$log("Starting");

		for (const service of this.hostedServices) {
			$log(`Enabling service ${getmetatable(service) ?? service}`);
			service.enable();
		}

		$log("Started");
		Logger.endScope();
	}

	parent<T extends IHostedService>(service: T): T {
		this.hostedServices.push(service);
		return service;
	}
}
