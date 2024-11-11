import { TransformBuilder, TransformRunner } from "engine/shared/component/Transform";
import type { RunningTransform, Transform, TransformProps } from "engine/shared/component/Transform";

export type TransformSetup<T extends object> = (transform: ITransformBuilder, instance: T) => void;
export namespace TransformService {
	export const commonProps = {
		quadOut02: { style: "Quad", direction: "Out", duration: 0.2 },
	} as const satisfies Record<string, TransformProps>;

	const transforms = new Map<object, TransformRunner>();

	export function run<T extends object>(
		key: T,
		transform: ITransformBuilder | Transform | ((transform: ITransformBuilder, instance: T) => void),
	): RunningTransform {
		if (typeIs(transform, "function") || !("finish" in transform)) {
			if (typeIs(transform, "function")) {
				const empty = new TransformBuilder() as unknown as ITransformBuilder;

				transform(empty, key);
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
