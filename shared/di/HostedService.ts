import { ComponentEvents } from "engine/shared/component/ComponentEvents";
import { SlimSignal } from "engine/shared/event/SlimSignal";

declare global {
	interface IHostedService extends IEnableableComponent, IDestroyableComponent {}
}

export class HostedService implements IHostedService {
	protected readonly event: ComponentEvents;

	private readonly onEnabled = new SlimSignal();
	private readonly onDestroyed = new SlimSignal();

	private selfEnabled = false;
	private selfDestroyed = false;

	constructor() {
		this.event = new ComponentEvents(this);
	}

	isEnabled(): boolean {
		return this.selfEnabled;
	}
	isDestroyed(): boolean {
		return this.selfDestroyed;
	}

	onEnable(func: () => void): void {
		this.onEnabled.Connect(func);
	}
	onDestroy(func: () => void): void {
		this.onDestroyed.Connect(func);
	}

	enable(): void {
		if (this.isDestroyed()) return;
		if (this.isEnabled()) return;

		this.selfEnabled = true;
		this.onEnabled.Fire();
		this.onEnabled.destroy();
	}
	destroy(): void {
		if (this.selfDestroyed) return;

		this.selfDestroyed = true;
		this.onDestroyed.Fire();

		this.onEnabled.destroy();
		this.onDestroyed.destroy();
	}

	parent<T extends IEnableableComponent & IDestroyableComponent>(component: T): T {
		this.onEnable(() => component.enable());
		this.onDestroy(() => component.destroy());
		if (this.isEnabled()) component.enable();

		return component;
	}
}
