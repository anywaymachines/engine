import { Easing } from "engine/shared/component/Easing";
import { ParallelTransformSequence } from "engine/shared/component/Transform";
import type { Easable, EasingDirection, EasingStyle } from "engine/shared/component/Easing";
import type {
	RunningTransform,
	Transform,
	TransformProps,
	TweenableProperties,
} from "engine/shared/component/Transform";

// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove and should ALWAYS be before any other code
const _ = () => [TransformBuilderMacros];

type B = ITransformBuilder;

class FuncTransform implements Transform {
	private readonly func: () => unknown | ITransformBuilder;
	private finished = false;

	constructor(func: () => unknown | ITransformBuilder) {
		this.func = func;
	}

	runFrame(): boolean | ITransformBuilder {
		if (this.finished) return true;

		this.finished = true;
		const result = this.func();
		if (!result) return true;

		if (result === true) {
			return result;
		}
		if (typeIs(result, "table") && "then" in result) {
			return result as ITransformBuilder;
		}

		return true;
	}
	finish() {
		if (this.finished) return;

		this.finished = true;
		this.func();
	}
}
class DelayTransform implements Transform {
	private readonly delay: number;

	constructor(delay: number) {
		this.delay = delay;
	}

	runFrame(time: number): boolean {
		return time >= this.delay;
	}
	finish() {}
}
class TweenTransform<T extends object, TKey extends TweenableProperties<T>> implements Transform {
	constructor(
		private readonly instance: T,
		private readonly key: TKey,
		private readonly value: T[TKey] | (() => T[TKey]),
		private readonly duration: number,
		private readonly style: EasingStyle,
		private readonly direction: EasingDirection,
	) {
		this.instance = instance;
		this.key = key;
		this.value = value;
	}

	private startValue?: T[TKey];
	private actualValue?: T[TKey];

	runFrame(time: number): boolean {
		if (time >= this.duration) {
			this.finish();
			return true;
		}

		this.startValue ??= this.instance[this.key];
		this.actualValue ??= typeIs(this.value, "function") ? this.value() : this.value;

		this.instance[this.key] = Easing.easeValue(
			time / this.duration,
			this.startValue as Easable,
			this.actualValue as Easable,
			this.style,
			this.direction,
		) as T[TKey];

		return false;
	}

	finish() {
		this.instance[this.key] = this.actualValue ?? (typeIs(this.value, "function") ? this.value() : this.value);
	}
}
class WaitForOtherTransform implements Transform {
	constructor(private readonly transform: RunningTransform) {}

	runFrame(): boolean {
		if (!this.transform.isCompleted()) {
			return false;
		}

		return true;
	}
	finish(): void {}
}

//

declare global {
	interface ITransformBuilder {
		func(func: () => void): this;
		wait(delay: number): this;
		parallel(...transforms: readonly ITransformBuilder[]): this;
		repeat(amount: number, func: (transform: ITransformBuilder) => void): this;

		/** Wait for a transform to finish */
		waitForTransform(transform: RunningTransform): this;

		transformMulti<T extends object, TKey extends TweenableProperties<T>>(
			object: T,
			value: { readonly [k in TKey]?: T[TKey] & defined },
			params?: TransformProps,
		): this;
		transform<T extends object, TKey extends TweenableProperties<T>>(
			object: T,
			key: TKey,
			value: (T[TKey] & defined) | (() => T[TKey] & defined),
			params?: TransformProps,
		): this;

		setup(setup: ((transform: ITransformBuilder) => void) | undefined): this;
	}
}
export const TransformBuilderMacros: PropertyMacros<ITransformBuilder> = {
	func: (selv: B, func: () => void) => selv.push(new FuncTransform(func)),
	wait: (selv: B, delay: number) => selv.push(new DelayTransform(delay)).then(),
	parallel: (selv: B, ...transforms: readonly ITransformBuilder[]) =>
		selv.push(new ParallelTransformSequence(transforms.map((t) => t.buildSequence()))),

	repeat: (selv: B, amount: number, func: (transform: ITransformBuilder) => void) => {
		const transform = selv.create();
		for (let i = 0; i < amount; i++) {
			func(transform);
			transform.then();
		}

		return selv.push(transform.buildSequence());
	},

	waitForTransform: (selv: B, transform: RunningTransform) => selv.push(new WaitForOtherTransform(transform)),

	transformMulti: <T extends object, TKey extends TweenableProperties<T>>(
		selv: B,
		object: T,
		value: { readonly [k in TKey]?: T[TKey] & defined },
		params?: TransformProps,
	) => {
		for (const [key, val] of pairs(value)) {
			selv.transform(object, key, val, params);
		}

		return selv;
	},

	transform: <T extends object, TKey extends TweenableProperties<T>>(
		selv: B,
		object: T,
		key: TKey,
		value: (T[TKey] & defined) | (() => T[TKey] & defined),
		params?: TransformProps,
	) => {
		return selv.push(
			new TweenTransform(
				object,
				key,
				value,
				params?.duration ?? 0,
				params?.style ?? "Quad",
				params?.direction ?? "Out",
			),
		);
	},

	setup: (selv: B, setup: ((transform: ITransformBuilder) => void) | undefined) => {
		setup?.(selv);
		return selv;
	},
};
