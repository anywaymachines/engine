import { SlimSignal } from "engine/shared/event/SlimSignal";

export interface BasicComponentEState extends ComponentEState {}
export class BasicComponentEState implements ComponentEStateTypes.ComponentEStateBase {
	private readonly onEnabled = new SlimSignal();
	private readonly onDisabled = new SlimSignal();
	private readonly onDestroyed = new SlimSignal();

	private selfEnabled = false;
	private selfDestroyed = false;

	isEnabled(): boolean {
		return this.selfEnabled;
	}
	isDestroyed(): boolean {
		return this.selfDestroyed;
	}

	onEnable(func: () => void): void {
		this.onEnabled.Connect(func);
	}
	onDisable(func: () => void): void {
		this.onDisabled.Connect(func);
	}
	onDestroy(func: () => void): void {
		this.onDestroyed.Connect(func);
	}

	enable(): void {
		if (this.selfDestroyed || this.isEnabled()) return;
		this.selfEnabled = true;
		this.onEnabled.Fire();
	}
	disable(): void {
		if (this.selfDestroyed || !this.isEnabled()) return;
		this.selfEnabled = false;
		this.onDisabled.Fire();
	}
	destroy(): void {
		if (this.selfDestroyed) return;

		this.disable();

		this.selfDestroyed = true;
		this.onDestroyed.Fire();

		this.onEnabled.destroy();
		this.onDisabled.destroy();
		this.onDestroyed.destroy();
	}
}
