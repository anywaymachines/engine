import { Component } from "engine/shared/component/Component";
import { Logger } from "engine/shared/Logger";
import type { DIContainer } from "engine/shared/di/DIContainer";
import type { HostedService } from "engine/shared/di/HostedService";

export class GameHost extends Component {
	constructor(readonly services: DIContainer) {
		super();
	}

	run(): void {
		Logger.beginScope("GameHost");
		$log("Starting");

		this.enable();

		$log("Started");
		Logger.endScope();
	}

	/** @deprecated @hidden */
	_customInject(di: DIContainer): void {
		this.startInject(di);
	}

	override parent<T extends HostedService>(service: T): T {
		service.onEnable(() => $log(`Enabling service ${getmetatable(service) ?? service}`));
		service.onDisable(() => $log(`Disabling service ${getmetatable(service) ?? service}`));

		return super.parent(service);
	}
}
