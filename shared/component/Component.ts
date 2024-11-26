import { ComponentEvents } from "engine/shared/component/ComponentEvents";
import { getDIClassSymbol, pathOf } from "engine/shared/di/DIPathFunctions";
import { ObservableSwitchAnd } from "engine/shared/event/ObservableSwitch";
import { SlimSignal } from "engine/shared/event/SlimSignal";
import { Objects } from "engine/shared/fixes/Objects";

declare global {
	interface IReadonlyEnableableComponent {
		isEnabled(): boolean;
		onEnable(func: () => void): void;
	}
	interface IReadonlyDisableableComponent {
		onDisable(func: () => void): void;
	}
	interface IReadonlyDestroyableComponent {
		isDestroyed(): boolean;
		onDestroy(func: () => void): void;
	}
	interface IReadonlyComponent
		extends IReadonlyEnableableComponent,
			IReadonlyDisableableComponent,
			IReadonlyDestroyableComponent {}

	interface IEnableableComponent {
		enable(key?: string | object): void;
	}
	interface IDisableableComponent {
		disable(key?: string | object): void;
	}
	interface IDestroyableComponent {
		destroy(): void;
	}
	interface IWriteonlyComponent extends IEnableableComponent, IDisableableComponent, IDestroyableComponent {}

	interface Component extends _Component {}

	interface IDebuggableComponent {
		getDebugChildren(): readonly object[];
	}
}

const mainEnabledKey = "$$_main";

class ComponentBase implements IReadonlyComponent, IWriteonlyComponent {
	private readonly onEnabled = new SlimSignal();
	private readonly onDisabled = new SlimSignal();
	private readonly onDestroyed = new SlimSignal();

	private readonly selfEnabled = new ObservableSwitchAnd(false);
	private selfDestroyed = false;

	constructor() {
		this.selfEnabled.subscribe((enabled) => {
			if (enabled) {
				this.onEnabled.Fire();
			} else {
				this.onDisabled.Fire();
			}
		});
	}

	isEnabled(key?: string | object): boolean {
		if (!key) {
			return this.selfEnabled.get();
		}

		return this.selfEnabled.getKeyed(key);
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
	onEnabledStateChange(func: (enabled: boolean) => void, executeImmediately = false): void {
		this.onEnable(() => func(true));
		this.onDisable(() => func(false));

		if (executeImmediately) {
			func(this.isEnabled());
		}
	}
	onDestroy(func: () => void): void {
		this.onDestroyed.Connect(func);
	}

	enable(key?: string | object): void {
		if (this.selfDestroyed) return;
		this.selfEnabled.set(key ?? mainEnabledKey, true);
	}
	disable(key?: string | object): void {
		if (this.selfDestroyed) return;
		this.selfEnabled.set(key ?? mainEnabledKey, false);
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

/** Base of any component. Handles events and signals which can be enabled or disabled. */
class _Component extends ComponentBase implements IReadonlyComponent, IWriteonlyComponent, IDebuggableComponent {
	readonly event = new ComponentEvents(this);
	protected readonly eventHandler = this.event.eventHandler;

	/**
	 * Return a function that returns a copy of the provided Instance. Destroys the Instance if specified.
	 * Leaks the memory, use only in static context.
	 */
	static asTemplateWithMemoryLeak<T extends Instance>(object: T, destroyOriginal = true) {
		const template = object.Clone();
		if (destroyOriginal) object.Destroy();

		return () => template.Clone();
	}
	/** Return a function that returns a copy of the provided Instance; Destroys the original if specified */
	protected asTemplate<T extends Instance>(object: T, destroyOriginal = true) {
		const template = object.Clone();
		if (destroyOriginal) object.Destroy();
		this.onDestroy(() => template.Destroy());

		return () => template.Clone();
	}

	private parented?: IDebuggableComponent[];
	getParented(): readonly IDebuggableComponent[] {
		return this.parented ?? Objects.empty;
	}

	private parentedMap?: Map<string, object>;
	getComponent<T extends object>(@pathOf("T") path?: string): T {
		if (!path) {
			throw "Path is null when getting component";
		}

		const component = this.parentedMap?.get(path);
		if (!component) throw `${this} does not contain a component ${path}`;

		return component as T;
	}
	getOrAddComponent<T extends IDestroyableComponent>(ctor: () => T, @pathOf("T") path?: string): T {
		if (!path) {
			throw "Path is null when getting component";
		}

		if (!this.parentedMap?.get(path)) {
			return this.parent(ctor());
		}

		return this.parentedMap.get(path) as T;
	}

	parent<T extends Component | IDestroyableComponent>(
		child: T,
		config?: { enable?: boolean; disable?: boolean; destroy?: boolean; immediateEnable?: boolean },
	): T {
		if ("getDebugChildren" in child) {
			this.parented ??= [];
			this.parented.push(child);
		}

		this.parentedMap ??= new Map();
		const symbol = getDIClassSymbol(child);
		this.parentedMap.set(symbol, child);

		if ("destroy" in child) {
			if ("enable" in child) {
				if (config?.enable ?? true) {
					this.onEnable(() => child.enable());
				}
				if (config?.disable ?? true) {
					this.onDisable(() => child.disable());
				}

				if (config?.immediateEnable ?? true) {
					if (this.isEnabled()) {
						child.enable();
					}
				}
			}

			if (config?.destroy ?? true) {
				this.onDestroy(() => child.destroy());
			}
		}

		return child;
	}

	getDebugChildren(): readonly IDebuggableComponent[] {
		return this.parented ?? [];
	}
}

interface StaticComponent extends Pick<typeof _Component, keyof typeof _Component> {
	new (): Component;
}
export const Component = _Component as unknown as StaticComponent;
