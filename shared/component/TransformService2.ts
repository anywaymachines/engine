import { TransformRunner } from "engine/shared/component/Transform2";
import type { RunningTransform, TransformProps } from "engine/shared/component/Transform";
import type { Transform } from "engine/shared/component/Transform2";

export type TransformSetup<T extends object> = (transform: ITransformBuilder, instance: T) => void;
export namespace TransformService2 {
	export const commonProps = {
		quadOut02: { style: "Quad", direction: "Out", duration: 0.2 },
	} as const satisfies Record<string, TransformProps>;

	const transforms = new Map<object, TransformRunner>();

	export function run(key: object, transform: ITransformBuilder | Transform): RunningTransform {
		if (!("finish" in transform)) {
			transform = transform.buildSequence();
		}

		transforms.get(key)?.finish();

		const tr = new TransformRunner(transform);
		transforms.set(key, tr);
		tr.onDestroy(() => transforms.delete(key));

		tr.enable();

		return tr;
	}
}
