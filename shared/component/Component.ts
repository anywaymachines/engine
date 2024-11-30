import { ComponentEvents } from "engine/shared/component/ComponentEvents";
import { BasicComponentEState } from "engine/shared/component/estate/BasicComponentEState";
import { getDIClassSymbol } from "engine/shared/di/DIPathFunctions";
import { pathOf } from "engine/shared/di/DIPathFunctions";
import { Objects } from "engine/shared/fixes/Objects";

export interface DebuggableComponent {
	getDebugChildren(): readonly DebuggableComponent[];
}

export interface ComponentConfig {
	readonly state?: ComponentEState;
}
export interface ComponentParentConfig {
	readonly enable?: boolean;
	readonly disable?: boolean;
	readonly destroy?: boolean;
}

export type { _Component };
/** @deprecated Internal use only */
class _Component implements DebuggableComponent {
	readonly state: ComponentEState;
	readonly event: ComponentEvents;

	constructor(config?: ComponentConfig) {
		this.state = config?.state ?? new BasicComponentEState();
		this.event = new ComponentEvents(this as unknown as Component);
	}

	private parentedMap?: Map<string, object>;
	getComponent<T extends Component>(@pathOf("T") path?: string): T {
		if (!path) {
			throw "Path is null when getting component";
		}

		const component = this.parentedMap?.get(path);
		if (!component) throw `${this} does not contain a component ${path}`;

		return component as T;
	}
	getOrAddComponent<T extends Component>(this: Component, ctor: () => T, @pathOf("T") path?: string): T {
		if (!path) {
			throw "Path is null when getting component";
		}

		if (!this.parentedMap?.get(path)) {
			return this.parent(ctor());
		}

		return this.parentedMap.get(path) as T;
	}

	private parented?: Component[];
	getParented(): readonly Component[] {
		return this.parented ?? Objects.empty;
	}

	/** Parents the component to the given component. */
	parent<T extends Component>(this: Component, child: T, config?: ComponentParentConfig): T {
		this.parented ??= [];
		this.parented.push(child);

		this.parentedMap ??= new Map();
		const symbol = getDIClassSymbol(child);
		this.parentedMap.set(symbol, child);

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

		return child;
	}

	getDebugChildren(): readonly DebuggableComponent[] {
		return this.parented ?? Objects.empty;
	}
}

export interface Component extends ComponentPropMacros, ComponentEState {}
export class Component extends _Component {}
