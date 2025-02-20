import { Component } from "engine/shared/component/Component";
import { Logger } from "engine/shared/Logger";
import type { DIContainer } from "engine/shared/di/DIContainer";
import type { HostedService } from "engine/shared/di/HostedService";

class GameHostComponent extends Component {
	_customInject(di: DIContainer): void {
		this.startInject(di);
	}
}

export class GameHost {
	// Component for providing DIContainer for the services
	private readonly container: Component;

	constructor(readonly services: DIContainer) {
		this.container = services.resolveForeignClass(GameHostComponent);
	}

	run(): void {
		Logger.beginScope("GameHost");
		$log("Starting");

		this.container.enable();

		$log("Started");
		Logger.endScope();
	}

	parent<T extends HostedService>(service: T): T {
		service.onEnable(() => $log(`Enabling service ${getmetatable(service) ?? service}`));
		service.onDisable(() => $log(`Disabling service ${getmetatable(service) ?? service}`));

		this.container.parent(service);
		return service;
	}
}
