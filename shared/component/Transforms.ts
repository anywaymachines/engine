import { TransformBuilder } from "engine/shared/component/Transform";
import { ParallelTransformSequence, TransformSequence } from "engine/shared/component/Transform";
import type { TransformProps } from "engine/shared/component/Transform";

export namespace Transforms {
	export const commonProps = {
		quadOut02: { style: "Quad", direction: "Out", duration: 0.2 },
	} as const satisfies Record<string, TransformProps>;

	export function create(): ITransformBuilder {
		return new TransformBuilder() as unknown as ITransformBuilder;
	}

	export function parallel(...transforms: readonly ITransformBuilder[]): ITransformBuilder {
		return create().push(new ParallelTransformSequence(transforms.map((t) => t.buildSequence())));
	}
	export function sequence(...transforms: readonly ITransformBuilder[]): ITransformBuilder {
		return create().push(new TransformSequence(transforms.map((t) => t.buildSequence())));
	}

	export function func(func: () => void | ITransformBuilder): ITransformBuilder {
		return create().func(func);
	}
}
