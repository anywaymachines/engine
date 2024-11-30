import { ComponentEvents } from "engine/shared/component/ComponentEvents";
import { SlimSignal } from "engine/shared/event/SlimSignal";
import { Objects } from "engine/shared/fixes/Objects";
import { Reflection } from "engine/shared/fixes/Reflection";

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

	private parentedMap?: Map<ConstructorOf<Component>, Component>;
	getComponent<T extends new (parent: this, ...rest: unknown[]) => Component>(
		clazz: T,
		...args: T extends new (...args: [unknown, ...infer rest extends unknown[]]) => unknown ? rest : []
	): InstanceOf<T> {
		if (!this.parentedMap?.get(clazz)) {
			return this.parent(new clazz(this, ...args)) as InstanceOf<T>;
		}

		return this.parentedMap.get(clazz) as InstanceOf<T>;
	}

	private parented?: Component[];
	getParented(): readonly Component[] {
		return this.parented ?? Objects.empty;
	}

	/** Parents the component to the given component. */
	parent<T extends Component>(child: T, config?: ComponentParentConfig): T {
		this.parented ??= [];
		this.parented.push(child);

		const clazz = Reflection.getClass(child);
		if (clazz) {
			print("adding class of clazz flasdlas0");

			this.parentedMap ??= new Map();
			this.parentedMap.set(clazz as unknown as ConstructorOf<Component>, child);
		}

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
