import { TransformBuilder } from "engine/shared/component/Transform2";
import { ParallelTransformSequence, TransformSequence } from "engine/shared/component/Transform2";

export namespace Transforms {
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
