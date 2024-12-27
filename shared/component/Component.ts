import { ComponentEvents } from "engine/shared/component/ComponentEvents";
import { getDIClassSymbol } from "engine/shared/di/DIPathFunctions";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { SlimSignal } from "engine/shared/event/SlimSignal";
import { Objects } from "engine/shared/fixes/Objects";

export namespace ComponentTypes {
	export interface DestroyableComponent {
		destroy(): void;
	}
}

export interface DebuggableComponent {
	getDebugChildren(): readonly DebuggableComponent[];
}

export interface ComponentParentConfig {
	readonly enable?: boolean;
	readonly disable?: boolean;
	readonly destroy?: boolean;
}

class ComponentState {
	private readonly onDestroyed = new SlimSignal();

	readonly enabledState = new ObservableValue<boolean>(false);
	private selfDestroyed = false;

	isEnabled(): boolean {
		return this.enabledState.get();
	}
	isDestroyed(): boolean {
		return this.selfDestroyed;
	}

	onEnable(func: () => void): void {
		this.enabledState.subscribe((enabled) => {
			if (!enabled) return;
			func();
		});
	}
	onDisable(func: () => void): void {
		this.enabledState.subscribe((enabled) => {
			if (enabled) return;
			func();
		});
	}
	onDestroy(func: () => void): void {
		this.onDestroyed.Connect(func);
	}

	enable(): void {
		if (this.selfDestroyed || this.isEnabled()) return;
		this.enabledState.set(true);
	}
	disable(): void {
		if (this.selfDestroyed || !this.isEnabled()) return;
		this.enabledState.set(false);
	}
	destroy(): void {
		if (this.selfDestroyed) return;

		this.disable();

		this.selfDestroyed = true;
		this.onDestroyed.Fire();

		this.enabledState.destroy();
		this.onDestroyed.destroy();
	}
}

export interface Component extends ComponentState {}
export class Component extends ComponentState implements DebuggableComponent {
	readonly event: ComponentEvents;
	private _di?: DIContainer;

	constructor() {
		super();
		this.event = new ComponentEvents(this);
	}

	private injectFuncs?: Set<(di: DIContainer) => void>;
	/** Subscribes a function to run when a DI container is available (so when parented to another component or resolved by DI) */
	protected onInject(func: (di: DIContainer) => void) {
		if (this.injectFuncs?.size() === 0) {
			throw "Can't request injection after parenting";
		}

		this.injectFuncs ??= new Set();
		this.injectFuncs.add(func);
	}
	private _customInject(di: DIContainer) {
		this._di = di;

		if (this.injectFuncs) {
			for (const func of this.injectFuncs) {
				func(di);
			}
			this.injectFuncs.clear();
		}

		if (this.parented) {
			for (const child of this.parented) {
				this.tryProvideDIToChild(child);
			}
		}
	}

	private components?: Map<ConstructorOf<ComponentTypes.DestroyableComponent>, ComponentTypes.DestroyableComponent>;
	getComponent<T extends new (parent: this, ...rest: unknown[]) => Component | ComponentTypes.DestroyableComponent>(
		clazz: T,
		...args: T extends new (...args: [unknown, ...infer rest extends unknown[]]) => unknown ? rest : []
	): InstanceOf<T> {
		if (!this.components?.get(clazz)) {
			const instance = new clazz(this, ...args) as InstanceOf<T>;

			this.components ??= new Map();
			this.components.set(clazz as unknown as ConstructorOf<Component>, instance);

			if ("enable" in instance) {
				return this.parent(instance) as InstanceOf<T>;
			}

			this.onDestroy(() => instance.destroy());
			return instance;
		}

		return this.components.get(clazz) as InstanceOf<T>;
	}

	private parented?: Component[];
	getParented(): readonly Component[] {
		return this.parented ?? Objects.empty;
	}

	private tryProvideDIToChild(child: Component): void {
		if (child._di || !this._di) return;

		const scope = this._di.beginScope((builder) =>
			builder.registerSingletonValue(this, getDIClassSymbol(getmetatable(this) as object)),
		);

		child._customInject(scope);
	}

	/** Parents the component to the given component. */
	parent<T extends Component>(child: T, config?: ComponentParentConfig): T {
		this.parented ??= [];
		this.parented.push(child);

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

		this.tryProvideDIToChild(child);
		return child;
	}

	getDebugChildren(): readonly DebuggableComponent[] {
		return [
			...(this.parented ?? Objects.empty),
			...(Objects.values(this.components ?? Objects.empty).filter(
				(c) => "getDebugChildren" in c,
			) as DebuggableComponent[]),
		];
	}
}
