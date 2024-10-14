import { RunService } from "@rbxts/services";
import { Component } from "engine/shared/component/Component";
import { Easing } from "engine/shared/component/Easing";
import { Objects } from "engine/shared/fixes/Objects";
import type { Easable, EasingDirection, EasingStyle } from "engine/shared/component/Easing";

interface AffectedObject {
	readonly object: object;
	readonly keys: readonly string[];
}

interface Transform {
	readonly affected: readonly AffectedObject[];

	/** @returns True if completed */
	runFrame(time: number): boolean | TransformBuilder2;

	/** Immediately finish a transform */
	finish(): void;
}

class FuncTransform implements Transform {
	readonly affected: readonly AffectedObject[];
	private readonly func: () => void | TransformBuilder2;
	private finished = false;

	constructor(func: () => void | TransformBuilder2, affected: readonly AffectedObject[]) {
		this.func = func;
		this.affected = affected ?? Objects.empty;
	}

	runFrame(): boolean | TransformBuilder2 {
		if (this.finished) return true;

		this.finished = true;
		const result = this.func();
		if (result) return result;

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
	readonly affected = Objects.empty;

	constructor(delay: number) {
		this.delay = delay;
	}

	runFrame(time: number): boolean {
		return time >= this.delay;
	}
	finish() {}
}

export type TweenableProperties<T> = string & ExtractKeys<Required<T>, Easable>;
export interface TransformProps {
	readonly duration?: number;
	readonly style?: EasingStyle;
	readonly direction?: EasingDirection;
}
class TweenTransform<T extends object, TKey extends TweenableProperties<T>> implements Transform {
	readonly affected: readonly AffectedObject[];

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

		this.affected = [{ object: instance, keys: [key] }];
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

class ParallelTransformSequence implements Transform {
	readonly affected: readonly AffectedObject[];
	private readonly sequence: Transform[];

	constructor(sequence: readonly Transform[]) {
		this.sequence = [...sequence];
		this.affected = [...new Set(sequence.flatmap((t) => t.affected))];
	}

	runFrame(time: number): boolean {
		if (this.sequence.size() === 0) {
			return true;
		}

		const run = (transform: Transform) => {
			const result = transform.runFrame(time);
			if (!result) return;

			this.sequence.remove(this.sequence.indexOf(transform));
			if (result !== true) {
				const seq = result.buildSequence();
				this.sequence.push(seq);

				if (run(seq)) return true;
			}

			if (this.sequence.size() === 0) {
				return true;
			}
		};

		for (const transform of [...this.sequence]) {
			if (run(transform)) {
				return true;
			}
		}

		return false;
	}

	finish() {
		for (const transform of this.sequence) {
			transform.finish();
		}

		this.sequence.clear();
	}
}

class TransformSequence implements Transform {
	readonly affected: readonly AffectedObject[];
	private readonly sequence: Transform[];
	private timeOffset = 0;

	constructor(sequence: readonly Transform[]) {
		this.sequence = [...sequence];
		this.affected = [...new Set(sequence.flatmap((t) => t.affected))];
	}

	runFrame(time: number): boolean {
		if (this.sequence.size() === 0) {
			return true;
		}

		const result = this.sequence[0].runFrame(time - this.timeOffset);
		if (!result) return false;

		this.sequence.remove(0);
		this.timeOffset = time;

		if (result !== true) {
			const seq = result.buildSequence();
			this.sequence.push(seq);
			if (this.runFrame(time)) return true;
		}

		if (this.sequence.size() === 0) {
			return true;
		}

		return false;
	}

	finish() {
		for (const transform of this.sequence) {
			transform.finish();
		}

		this.sequence.clear();
	}
}

//

type Direction = "top" | "bottom" | "left" | "right";
const directionToOffset = (direction: Direction, power: number) => {
	const offsets: Record<Direction, UDim2> = {
		top: new UDim2(0, 0, 0, power),
		bottom: new UDim2(0, 0, 0, -power),
		left: new UDim2(0, power, 0, 0),
		right: new UDim2(0, -power, 0, 0),
	};

	return offsets[direction];
};

declare global {
	export interface TransformBuilderBase {
		build(): TransformRunner;

		/** Add a transform into the current parallel sequence */
		push(transform: Transform): this;

		/** End the current parallel sequence and start another */
		then(): this;
	}
	export interface ITransformBuilder2 extends TransformBuilderBase {
		//
	}
}

export type TransformSetup2 = (transform: TransformBuilder2) => void;
export class TransformBuilder2 implements TransformBuilderBase {
	private readonly transforms: Transform[][] = [[]];

	static newSequence(...builders: readonly TransformBuilder2[]): TransformBuilder2 {
		return new TransformBuilder2().push(new TransformSequence(builders.map((b) => b.buildSequence())));
	}
	static newParallel(...builders: readonly TransformBuilder2[]): TransformBuilder2 {
		return new TransformBuilder2().push(new ParallelTransformSequence(builders.map((b) => b.buildSequence())));
	}

	build(): TransformRunner {
		return new TransformRunner(this.buildSequence());
	}
	buildSequence(): TransformSequence {
		return new TransformSequence(this.transforms.map((seq) => new ParallelTransformSequence(seq)));
	}

	then(): this {
		this.transforms.push([]);
		return this;
	}
	push(transform: Transform): this {
		this.transforms[this.transforms.size() - 1].push(transform);
		return this;
	}

	func(func: () => void, affected: readonly AffectedObject[]): this {
		return this.push(new FuncTransform(func, affected));
	}
	wait(delay: number): this {
		return this.push(new DelayTransform(delay)).then();
	}

	parallel(...funcs: ((transform: TransformBuilder2) => void)[]): this {
		const seq = funcs.map((func) => {
			const transform = new TransformBuilder2();
			func(transform);

			return transform.buildSequence();
		});

		return this.push(new ParallelTransformSequence(seq));
	}

	repeat(amount: number, func: (transform: TransformBuilder2) => void): this {
		const transform = new TransformBuilder2();
		for (let i = 0; i < amount; i++) {
			func(transform);
			transform.then();
		}

		return this.push(transform.buildSequence());
	}

	nest<T extends object>(instance: T, setup: TransformSetup2) {
		const transform = new TransformBuilder2();
		setup(transform);

		return this.push(transform.buildSequence());
	}

	transformMulti<T extends object, TKey extends TweenableProperties<T>>(
		object: T,
		value: { readonly [k in TKey]?: T[TKey] & defined },
		params?: TransformProps,
	) {
		for (const [key, val] of pairs(value)) {
			this.transform(object, key, val, params);
		}
	}
	transform<T extends object, TKey extends TweenableProperties<T>>(
		object: T,
		key: TKey,
		value: (T[TKey] & defined) | (() => T[TKey] & defined),
		params?: TransformProps,
	) {
		return this.push(
			new TweenTransform(
				object,
				key,
				value,
				params?.duration ?? 0,
				params?.style ?? "Quad",
				params?.direction ?? "Out",
			),
		);
	}

	setup(setup: TransformSetup2 | undefined): this {
		setup?.(this);
		return this;
	}
}

//

export interface RunningTransform {
	cancel(): void;
	finish(): void;
}
export class TransformRunner extends Component implements RunningTransform {
	private transform: Transform;
	private time = 0;

	constructor(transform: Transform) {
		super();
		this.transform = transform;

		const run = () => {
			const result = transform.runFrame(this.time);
			if (!result) return;

			if (result === true) {
				this.destroy();
			} else {
				transform = result.buildSequence();
				run();
			}
		};

		this.event.subscribe(RunService.Heartbeat, (dt) => {
			this.time += dt;
			run();
		});

		let firstRan = false;
		this.onEnable(() => {
			if (firstRan) return;

			run();
			firstRan = true;
		});
	}

	/** Immediately finish the transform */
	finish() {
		this.transform.finish();
		this.destroy();
	}

	/** Stop and disable the transform */
	cancel() {
		this.destroy();
	}
}
