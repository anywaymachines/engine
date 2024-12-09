import { Logger } from "engine/shared/Logger";
import type { DIContainer } from "engine/shared/di/DIContainer";
import type { HostedService } from "engine/shared/di/HostedService";

export class GameHost {
	private readonly hostedServices: HostedService[] = [];

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

	parent<T extends HostedService>(service: T): T {
		this.hostedServices.push(service);
		return service;
	}
}
