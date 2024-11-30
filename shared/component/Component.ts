import { ComponentEvents } from "engine/shared/component/ComponentEvents";
import { getDIClassSymbol } from "engine/shared/di/DIPathFunctions";
import { pathOf } from "engine/shared/di/DIPathFunctions";
import { SlimSignal } from "engine/shared/event/SlimSignal";
import { Objects } from "engine/shared/fixes/Objects";

export interface DebuggableComponent {
	getDebugChildren(): readonly DebuggableComponent[];
}

export interface ComponentParentConfig {
	readonly enable?: boolean;
	readonly disable?: boolean;
	readonly destroy?: boolean;
}

class ComponentState {
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

export type { _Component };
/** @deprecated Internal use only */
class _Component extends ComponentState implements DebuggableComponent {
	readonly event: ComponentEvents;

	constructor() {
		super();
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

export interface Component extends ComponentPropMacros {}
export class Component extends _Component {}
