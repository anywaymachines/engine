import { getDIClassSymbol, pathOf } from "engine/shared/di/DIPathFunctions";

function assertRegisteringNameNotNull<T>(value: T, name: string | undefined): asserts name is string {
	if (!name) {
		throw `Name is null when registering ${value}`;
	}
}

const createCache = <T>(func: (di: DIContainer) => T): ((di: DIContainer) => T) => {
	let cache: T | undefined;
	let resolving = false;

	return (di) => {
		if (resolving) {
			throw "Circular resolving detected";
		}

		if (!cache) {
			resolving = true;
			cache ??= func(di);
			resolving = false;
			return cache;
		}

		return cache;
	};
};

const instantiateClass = <TCtor extends abstract new (...args: TArgs) => unknown, TArgs extends unknown[]>(
	clazz: TCtor,
	args: Readonly<Partial<TArgs>> | undefined,
	container: DIContainer,
): InstanceOf<TCtor> => {
	type DepsCreatable<TSelf, TArgs extends unknown[]> = {
		readonly prototype: unknown;
		_depsCreate(...args: [...Partial<TArgs>, deps: DIContainer]): TSelf;
	};

	const isDeps = (clazz: unknown): clazz is DepsCreatable<InstanceOf<TCtor>, TArgs> =>
		typeIs(clazz, "table") && "_depsCreate" in clazz;
	const isInject = (instance: InstanceOf<TCtor>): instance is typeof instance & { _inject(di: DIContainer): void } =>
		"_inject" in instance;

	const instance = isDeps(clazz)
		? clazz._depsCreate(...[...(args ?? ([] as unknown as TArgs)), container])
		: new (clazz as unknown as new (...args: Partial<TArgs>) => InstanceOf<TCtor>)(
				...(args ?? ([] as unknown as TArgs)),
			);

	if (isInject(instance)) {
		const scope = container.beginScope((builder) => {
			builder.registerSingletonValue(instance, getDIClassSymbol(clazz));
		});

		instance._inject(scope);
	}

	return instance;
};

class RegistrationBuilder<T = unknown> {
	private readonly registerAs: string[] = [];

	constructor(
		private readonly defaultPath: string,
		private func: (di: DIContainer) => T,
	) {}

	as<U>(this: this & RegistrationBuilder<U>, @pathOf("U") name?: string): this {
		assertRegisteringNameNotNull(this.func, name);
		this.registerAs.push(name);

		return this;
	}
	onInit(func: (value: T, di: DIContainer) => void): this {
		const prevThisFunc = this.func;
		this.func = (di) => {
			const value = prevThisFunc(di);
			func(value, di);

			return value;
		};

		return this;
	}

	/** @deprecated For internal use only */
	createRegistration(): LuaTuple<[paths: readonly string[], func: (di: DIContainer) => T]> {
		return $tuple(this.registerAs.size() === 0 ? [this.defaultPath] : this.registerAs, this.func);
	}
}
class SingletonFuncRegistrationBuilder<T> extends RegistrationBuilder<T> {
	constructor(defaultPath: string, func: (di: DIContainer) => T) {
		super(defaultPath, createCache(func));
	}
}
class SingletonRegistrationBuilder<T> extends RegistrationBuilder<T> {
	constructor(defaultPath: string, value: T) {
		super(defaultPath, () => value);
	}
}

class TransientClassRegistrationBuilder<T extends ConstructorOf> extends RegistrationBuilder<InstanceOf<T>> {
	private args?: readonly unknown[];

	constructor(defaultPath: string, value: T) {
		super(defaultPath, (di) => instantiateClass(value, (this.args ?? []) as never, di));
	}

	withArgs(...args: Partial<ArgsOf<T>>): this {
		this.args = args;
		return this;
	}
}
class SingletonClassRegistrationBuilder<T extends ConstructorOf> extends RegistrationBuilder<InstanceOf<T>> {
	autoInitialized = false;
	private args?: readonly unknown[] | ((di: DIContainer) => readonly unknown[]);

	constructor(defaultPath: string, value: T) {
		super(
			defaultPath,
			createCache((di) =>
				instantiateClass(
					value,
					(typeIs(this.args, "function") ? this.args(di) : (this.args ?? [])) as never,
					di,
				),
			),
		);
	}

	withArgs(args: Readonly<Partial<ArgsOf<T>>> | ((di: DIContainer) => Readonly<Partial<ArgsOf<T>>>)): this {
		this.args = args;
		return this;
	}

	autoInit(): this {
		this.autoInitialized = true;
		return this;
	}
}

//

export class DIContainerBuilder {
	private readonly registrations: RegistrationBuilder[] = [];

	registerTransientFunc<T extends object>(
		value: (di: DIContainer) => T,
		@pathOf("T") name?: string,
	): RegistrationBuilder<T> {
		assertRegisteringNameNotNull(value, name);

		const registration = new RegistrationBuilder<T>(name, value);
		this.registrations.push(registration);

		return registration;
	}
	registerSingletonValue<T extends object>(singleton: T, @pathOf("T") name?: string): RegistrationBuilder<T> {
		assertRegisteringNameNotNull(singleton, name);

		const registration = new SingletonRegistrationBuilder<T>(name, singleton);
		this.registrations.push(registration);

		return registration;
	}

	registerTransientClass<T extends object, TCtor extends ConstructorOf<T>>(
		clazz: TCtor,
		@pathOf("T") name?: string,
	): TransientClassRegistrationBuilder<TCtor> {
		assertRegisteringNameNotNull(clazz, name);

		const registration = new TransientClassRegistrationBuilder<TCtor>(name, clazz);
		this.registrations.push(registration);

		return registration;
	}
	registerSingletonClass<T extends object, TCtor extends ConstructorOf<T>>(
		clazz: TCtor,
		@pathOf("T") name?: string,
	): SingletonClassRegistrationBuilder<TCtor> {
		assertRegisteringNameNotNull(clazz, name);

		const registration = new SingletonClassRegistrationBuilder<TCtor>(name, clazz);
		this.registrations.push(registration);

		return registration;
	}

	registerSingletonFunc<T extends object>(
		func: (di: DIContainer) => T,
		@pathOf("T") name?: string,
	): SingletonFuncRegistrationBuilder<T> {
		assertRegisteringNameNotNull(func, name);

		const registration = new SingletonFuncRegistrationBuilder<T>(name, func);
		this.registrations.push(registration);

		return registration;
	}

	//

	protected assertNameNotNull<T>(value: T, name: string | undefined): asserts name is string {
		if (!name) {
			throw `Name is null when registering ${value}`;
		}
	}

	/** @deprecated Internal usage only */
	build(parent?: DIContainer): DIContainer {
		this.registerTransientFunc(() => container);

		const afterInit: ((di: DIContainer) => unknown)[] = [];
		const registrations: { [k in string]: DIRegistration } = {};
		for (const registration of this.registrations) {
			const [paths, func] = registration.createRegistration();
			const direg: DIRegistration = { get: func };

			if (registration instanceof SingletonClassRegistrationBuilder && registration.autoInitialized) {
				afterInit.push(func);
			}

			for (const path of paths) {
				registrations[path] = direg;
			}
		}

		const container = new DIContainer(registrations, parent);
		for (const func of afterInit) {
			func(container);
		}

		return container;
	}
}

//

export interface DIRegistration<T = unknown> {
	get: (di: DIContainer) => T;
}
type RegistrationList = {
	readonly [k in string]?: DIRegistration;
};

function assertResolvingNameNotNull(name: string | undefined): asserts name is string {
	if (!name) {
		throw `Name is null when resolving something from a container`;
	}
}
function throwNotRegistered(name: string): never {
	throw `Value '${name}' is not registered in the container`;
}

//

declare global {
	type DIContainer = DC;

	function injectable(...args: unknown[]): void;
	function inject(...args: unknown[]): void;
	function injectFunc(...args: unknown[]): void;
	function tryInject(...args: unknown[]): void;
}

type DC = DIContainer;
export class DIContainer {
	constructor(
		private readonly registrations: RegistrationList,
		private readonly parent?: DIContainer,
	) {}

	resolve<T>(@pathOf("T") name?: string): T {
		assertResolvingNameNotNull(name);

		const value = this.tryResolve<T>(name);
		if (value === undefined) throwNotRegistered(name);

		return value;
	}
	tryResolve<T>(@pathOf("T") name?: string): T | undefined {
		assertResolvingNameNotNull(name);

		const registration = this.registrations[name];
		if (registration) return registration.get(this) as T;

		const parentResolve = this.parent?.tryResolve<T>(name);
		if (parentResolve) return parentResolve;

		return undefined;
	}

	resolveByClassInstance<T extends object>(clazz: ConstructorOf<T>): T {
		return this.resolve(getDIClassSymbol(clazz));
	}

	resolveForeignClass<T extends object, TArgs extends unknown[]>(
		clazz: ConstructorOf<T, TArgs>,
		args?: Readonly<Partial<TArgs>>,
	): T {
		return instantiateClass(clazz, args, this);
	}

	beginScope(build?: (builder: DIContainerBuilder) => void): DIContainer {
		const builder = new DIContainerBuilder();
		build?.(builder);

		return builder.build(this);
	}
}
