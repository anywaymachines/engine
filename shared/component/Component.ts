import { ComponentChild } from "engine/shared/component/ComponentChild";
import { ComponentEvents } from "engine/shared/component/ComponentEvents";
import { SlimSignal } from "engine/shared/event/SlimSignal";
import type { Control } from "engine/client/gui/Control";

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

	interface IComponent extends IReadonlyComponent, IWriteonlyComponent {}

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
export class Component extends ComponentBase implements IComponent, IDebuggableComponent {
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

	with(func: (tis: this) => void): this {
		func(this);
		return this;
	}
	readonly setEnabled = (enable: boolean) => (enable ? this.enable() : this.disable());

	private parented?: IDebuggableComponent[];

	/** Subscribe a child to this component state. Return the child. */
	protected parent<T extends IComponent | IDebuggableComponent>(child: T): T {
		if ("getDebugChildren" in child) {
			this.parented ??= [];
			this.parented.push(child);
		}

		if ("isDestroyed" in child || child instanceof ComponentBase) {
			ComponentChild.init(this, child);
		}

		return child;
	}

	/** Equivalent of {@link parent} but shows/hides the provided {@link Control} */
	protected parentGui<T extends Control>(gui: T): T {
		this.onEnable(() => gui.show());
		this.onDisable(() => gui.hide());
		this.onDestroy(() => gui.destroy());

		if (this.isEnabled()) gui.show();
		return gui;
	}

	getDebugChildren(): readonly IDebuggableComponent[] {
		return this.parented ?? [];
	}
}
