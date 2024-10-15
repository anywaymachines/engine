import { TransformRunner } from "engine/shared/component/Transform";
import { Transforms } from "engine/shared/component/Transforms";
import type { RunningTransform, Transform, TransformProps } from "engine/shared/component/Transform";

export type TransformSetup<T extends object> = (transform: ITransformBuilder, instance: T) => void;
export namespace TransformService {
	export const commonProps = {
		quadOut02: { style: "Quad", direction: "Out", duration: 0.2 },
	} as const satisfies Record<string, TransformProps>;

	const transforms = new Map<object, TransformRunner>();

	export function run(
		key: object,
		transform: ITransformBuilder | Transform | ((transform: ITransformBuilder) => void),
	): RunningTransform {
		if (typeIs(transform, "function") || !("finish" in transform)) {
			if (typeIs(transform, "function")) {
				const empty = Transforms.create();
				transform(empty);
				transform = empty.buildSequence();
			} else {
				transform = transform.buildSequence();
			}
		}

		transforms.get(key)?.finish();

		const tr = new TransformRunner(transform);
		transforms.set(key, tr);
		tr.onDestroy(() => transforms.delete(key));

		tr.enable();

		return tr;
	}

	export function finish(key: object) {
		transforms.get(key)?.finish();
	}
	export function cancel(key: object) {
		transforms.get(key)?.cancel();
	}
}
