/** Handles the destruction of the provided instance, along with the component. */
export namespace ComponentInstance {
	export function init<T extends Instance>(
		state: IReadonlyDestroyableComponent & IDestroyableComponent,
		instance: T | undefined,
		destroyComponentOnInstanceDestroy = true,
		destroyInstanceOnComponentDestroy = true,
	) {
		if (!instance) throw "The provided instance is nil";

		if (destroyComponentOnInstanceDestroy) {
			const destroyingSignal = instance.Destroying.Connect(() => {
				instance = undefined;
				state.destroy();
			});

			state.onDestroy(() => {
				if (!instance) return;

				try {
					destroyingSignal.Disconnect();
				} catch (error) {
					$err(`Could not destroy instance ${instance}: ${error}`);
				}
			});
		}

		if (destroyInstanceOnComponentDestroy) {
			state.onDestroy(() => {
				if (!instance) return;

				try {
					instance.Destroy();
				} catch (error) {
					$err(`Could not destroy instance ${instance}: ${error}`);
				}
			});
		}
	}
	export function setParentIfNeeded(instance: Instance, parent: Instance) {
		if (instance !== parent && instance.Parent === undefined) {
			instance.Parent = parent;
		}
	}
}
