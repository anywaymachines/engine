import { TransformRunner } from "engine/shared/component/Transform";
import { Transforms } from "engine/shared/component/Transforms";
import type { Component, ComponentTypes } from "engine/shared/component/Component";
import type { RunningTransform, Transform } from "engine/shared/component/Transform";
import type { ObservableSwitchKey } from "engine/shared/event/ObservableSwitch";

const mainKey: ObservableSwitchKey = "main_$";

// TODO: is it even needed?
export class AnimationComponent implements ComponentTypes.DestroyableComponent {
	private readonly transforms = new Map<ObservableSwitchKey, TransformRunner>();

	constructor(component: Component) {
		//
	}

	run<T extends ObservableSwitchKey>(
		key: T | undefined,
		transform: ITransformBuilder | Transform | ((transform: ITransformBuilder, key: T) => void),
		cancelExisting: boolean = false,
	): RunningTransform {
		key ??= mainKey as T;

		if (typeIs(transform, "function") || !("finish" in transform)) {
			if (typeIs(transform, "function")) {
				const empty = Transforms.create();
				transform(empty, key);
				transform = empty.buildSequence();
			} else {
				transform = transform.buildSequence();
			}
		}

		if (cancelExisting) {
			this.transforms.get(key)?.cancel();
		} else {
			this.transforms.get(key)?.finish();
		}

		const tr = new TransformRunner(transform);
		this.transforms.set(key, tr);
		tr.onDestroy(() => this.transforms.delete(key));

		tr.enable();

		return tr;
	}

	finish(key: object): void {
		this.transforms.get(key)?.finish();
	}
	cancel(key: object): void {
		this.transforms.get(key)?.cancel();
	}

	getRunning(key: object): TransformRunner | undefined {
		return this.transforms.get(key);
	}

	destroy(): void {
		for (const [, transform] of this.transforms) {
			transform.cancel();
		}
	}
}
