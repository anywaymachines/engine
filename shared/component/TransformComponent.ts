import { TransformRunner, TransformBuilder } from "engine/shared/component/Transform";
import type { ComponentTypes } from "engine/shared/component/Component";
import type { ValueOverlayKey } from "engine/shared/component/OverlayValueStorage";
import type { Transform, RunningTransform } from "engine/shared/component/Transform";

export class TransformComponent implements ComponentTypes.DestroyableComponent {
	private readonly transforms = new Map<ValueOverlayKey, TransformRunner>();

	run<T extends object>(
		key: T,
		transform: TransformBuilder | Transform | ((transform: TransformBuilder, instance: T) => void),
		cancelExisting: boolean = false,
	): RunningTransform {
		if (typeIs(transform, "function") || !("finish" in transform)) {
			if (typeIs(transform, "function")) {
				const empty = new TransformBuilder() as unknown as TransformBuilder;

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

	finish(key: ValueOverlayKey): void {
		this.transforms.get(key)?.finish();
	}
	cancel(key: ValueOverlayKey): void {
		this.transforms.get(key)?.cancel();
	}

	finishAll(): void {
		for (const [, transform] of this.transforms) {
			transform.finish();
		}
	}
	cancelAll(): void {
		for (const [, transform] of this.transforms) {
			transform.cancel();
		}
	}

	getRunning(key: ValueOverlayKey): TransformRunner | undefined {
		return this.transforms.get(key);
	}
	getAll(): ReadonlyMap<ValueOverlayKey, TransformRunner> {
		return this.transforms;
	}

	destroy(): void {
		this.finishAll();
	}
}
