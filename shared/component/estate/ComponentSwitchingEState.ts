import { BasicComponentEState } from "engine/shared/component/estate/BasicComponentEState";
import { ObservableSwitchAnd } from "engine/shared/event/ObservableSwitch";

interface Config {
	readonly state?: ComponentEState;
}

const mainEnabledKey = "$$_main";

export interface ComponentSwitchingEState2 extends ComponentEState {}
export class ComponentSwitchingEState2 implements ComponentEStateTypes.ComponentEStateBase {
	private readonly state: ComponentEState;
	private readonly selfEnabled = new ObservableSwitchAnd(false);

	constructor(config?: Config) {
		this.state = config?.state ?? new BasicComponentEState();
		this.selfEnabled.subscribe((enabled) => this.state.setEnabled(enabled));
	}

	isEnabled(): boolean {
		return this.state.isEnabled();
	}
	isDestroyed(): boolean {
		return this.state.isDestroyed();
	}

	enable(key?: string | object): void {
		this.selfEnabled.set(key ?? mainEnabledKey, true);
	}
	disable(key?: string | object): void {
		this.selfEnabled.set(key ?? mainEnabledKey, false);
	}
	destroy(): void {
		return this.state.destroy();
	}

	onEnable(func: () => void): void {
		return this.state.onEnable(func);
	}
	onDisable(func: () => void): void {
		return this.state.onDisable(func);
	}
	onDestroy(func: () => void): void {
		return this.state.onDestroy(func);
	}
}
