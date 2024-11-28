import { Component2Children } from "engine/shared/component/Component2Children";
import { BasicComponentEState } from "engine/shared/component/estate/BasicComponentEState";
import { ComponentSwitchingEState2 } from "engine/shared/component/estate/ComponentSwitchingEState";
import { Objects } from "engine/shared/fixes/Objects";

export interface ComponentConfig {
	readonly state?: ComponentEState;
}

// eslint-disable-next-line roblox-ts/no-global-this
export interface Component2 extends globalThis.Component2PropMacros {}
export class Component2 implements DebuggableComponent, BaseComponentTypes.ComponentBase {
	readonly enabledState: ComponentEState;
	private readonly c: Component2Children;

	constructor(config?: ComponentConfig) {
		this.enabledState = config?.state ?? new BasicComponentEState();
		this.c = new Component2Children(this.enabledState);
	}

	private parented?: DebuggableComponent[] = [];

	/** Parents the component to the given component. */
	parent<T extends Component2>(child: T, config?: { enable?: boolean; disable?: boolean; destroy?: boolean }): T {
		const z = this.c.add(child);

		if ("getDebugChildren" in child) {
			this.parented ??= [];
			this.parented.push(child);
		}

		if (child instanceof Component2) {
			if (config?.enable ?? true) {
				this.onEnable(() => child.enable());

				if (this.isEnabled()) {
					child.enable();
				}
			}
			if (config?.disable ?? true) {
				this.onDisable(() => child.disable());
			}
			if (config?.destroy ?? true) {
				this.onDestroy(() => child.destroy());
			}
		}

		return child;
	}

	getDebugChildren(): readonly DebuggableComponent[] {
		return this.parented ?? Objects.empty;
	}
}

//

interface Control {
	readonly enabledState: ComponentSwitchingEState2;
}
class Control extends Component2 {
	constructor() {
		super({ state: new ComponentSwitchingEState2() });
	}
}
