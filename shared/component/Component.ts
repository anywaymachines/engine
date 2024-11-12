import { ComponentEvents } from "engine/shared/component/ComponentEvents";
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
		enable(): void;
	}
	interface IDisableableComponent {
		disable(): void;
	}
	interface IDestroyableComponent {
		destroy(): void;
	}
	interface IWriteonlyComponent extends IEnableableComponent, IDisableableComponent, IDestroyableComponent {}

	interface Component extends IReadonlyComponent, IWriteonlyComponent, IDebuggableComponent {
		/** Subscribe a child to this component's enabled state and return it. */
		parent<T extends Component | IDebuggableComponent>(child: T): T;
	}

	interface IDebuggableComponent {
		getDebugChildren(): readonly object[];
	}
}

class ComponentBase {
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

	enable(): void {
		if (this.selfDestroyed || this.selfEnabled) return;

		this.selfEnabled = true;
		this.onEnabled.Fire();
	}
	disable(): void {
		if (this.selfDestroyed || !this.selfEnabled) return;

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

/** Base of any component. Handles events and signals which can be enabled or disabled. */
class _Component extends ComponentBase implements IReadonlyComponent, IWriteonlyComponent, IDebuggableComponent {
	readonly event = new ComponentEvents(this);
	protected readonly eventHandler = this.event.eventHandler;

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
	protected getParented(): readonly IDebuggableComponent[] {
		return this.parented ?? Objects.empty;
	}

	parent<T extends Component | IDebuggableComponent>(child: T): T {
		if ("getDebugChildren" in child) {
			this.parented ??= [];
			this.parented.push(child);
		}

		if ("isDestroyed" in child || child instanceof ComponentBase) {
			this.onEnable(() => child.enable());
			this.onDisable(() => child.disable());
			this.onDestroy(() => child.destroy());

			if (this.isEnabled()) child.enable();
		}

		return child;
	}

	getDebugChildren(): readonly IDebuggableComponent[] {
		return this.parented ?? [];
	}
}

interface StaticComponent {
	/**
	 * Return a function that returns a copy of the provided Instance. Destroys the Instance if specified.
	 * Leaks the memory, use only in static context.
	 */
	asTemplateWithMemoryLeak<T extends Instance>(object: T, destroyOriginal?: boolean): () => T;

	new (): _Component & Component;
}
export const Component = _Component as unknown as StaticComponent;
