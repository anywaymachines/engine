import { DIContainerBuilder } from "engine/shared/di/DIContainer";
import { pathOf } from "engine/shared/di/DIPathFunctions";
import { ArgsSignal } from "engine/shared/event/Signal";
import { GameHost } from "engine/shared/GameHost";
import { Logger } from "engine/shared/Logger";
import { Switches } from "engine/shared/Switches";
import type { HostedService } from "engine/shared/di/HostedService";

class GameHostDIContainerBuilder extends DIContainerBuilder {
	/** @deprecated Internal use only */
	readonly hostedServices: ConstructorOf<HostedService>[] = [];

	registerService<T extends object & HostedService, TCtor extends ConstructorOf<T>>(
		clazz: TCtor,
		@pathOf("T") name?: string,
	) {
		this.assertNameNotNull(clazz, name);

		this.hostedServices.push(clazz);
		const registration = this.registerSingletonClass<T, TCtor>(clazz, name);
		return registration;
	}
}

export class GameHostBuilder {
	readonly services = new GameHostDIContainerBuilder();
	private readonly _enabled = new ArgsSignal<[di: DIContainer]>();
	readonly enabled = this._enabled.asReadonly();

	constructor(gameInfo: GameInfo) {
		Logger.printInfo(gameInfo);

		this.services.registerSingletonValue(gameInfo);
		this.services.registerSingletonClass(Switches).autoInit().onInit(Logger.initSwitches);
	}

	build(): GameHost {
		Logger.beginScope("GameHostBuilder");
		$log(`Building`);

		this.services.registerTransientFunc(() => host);

		const services = this.services.build();
		const host = services.resolveForeignClass(GameHost, [services]);

		for (const ctor of this.services.hostedServices) {
			$log(`Resolving service ${ctor}`);

			const service = services.resolveByClassInstance(ctor);
			host.parent(service);
		}

		this._enabled.Fire(services);
		this._enabled.destroy();

		$log(`Completed`);
		Logger.endScope();
		return host;
	}
}
