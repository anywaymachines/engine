import { RunService } from "@rbxts/services";
import { Component } from "engine/shared/component/Component";
import type { Easable, EasingDirection, EasingStyle } from "engine/shared/component/Easing";

export interface Transform {
	/** @returns True if completed */
	runFrame(time: number): boolean | ITransformBuilder;

	/** Immediately finish a transform */
	finish(): void;
}

export type TweenableProperties<T> = string & ExtractKeys<Required<T>, Easable>;
export interface TransformProps {
	readonly duration?: number;
	readonly style?: EasingStyle;
	readonly direction?: EasingDirection;
}

export class ParallelTransformSequence implements Transform {
	private readonly sequence: Transform[];

	constructor(sequence: readonly Transform[]) {
		this.sequence = [...sequence];
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

export class TransformSequence implements Transform {
	private readonly sequence: Transform[];
	private timeOffset = 0;

	constructor(sequence: readonly Transform[]) {
		this.sequence = [...sequence];
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
		}

		if (this.runFrame(time)) {
			return true;
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

declare global {
	interface ITransformBuilder extends TransformBuilderBase {}
}

interface TransformBuilderBase {
	buildSequence(): TransformSequence;

	/** Add a transform into the current parallel sequence */
	push(transform: Transform | ITransformBuilder): this;

	/** End the current parallel sequence and start another */
	then(): this;

	/** Create another empty builder */
	create(): ITransformBuilder;
}

/** @deprecated Internal use only */
export class TransformBuilder implements TransformBuilderBase {
	private readonly transforms: Transform[][] = [[]];

	buildSequence(): TransformSequence {
		return new TransformSequence(this.transforms.map((seq) => new ParallelTransformSequence(seq)));
	}

	then(): this {
		this.transforms.push([]);
		return this;
	}
	push(transform: Transform | ITransformBuilder): this {
		if (!("finish" in transform)) {
			transform = transform.buildSequence();
		}

		this.transforms[this.transforms.size() - 1].push(transform);
		return this;
	}

	create(): ITransformBuilder {
		return new TransformBuilder() as unknown as ITransformBuilder;
	}
}

//

export interface RunningTransform {
	isCompleted(): boolean;
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

	isCompleted() {
		return this.isDestroyed();
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
