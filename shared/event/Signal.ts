declare global {
	interface SignalConnection {
		Disconnect(): void;
	}

	interface ReadonlyArgsSignal<TArgs extends unknown[] = []> {
		Connect(callback: (...args: TArgs) => void): SignalConnection;
	}
	interface ReadonlySignal<T extends (...args: any[]) => void = () => void>
		extends ReadonlyArgsSignal<Parameters<T>> {}
}

export interface ReadonlyArgsSignal<TArgs extends unknown[]> {
	Connect(callback: (...args: TArgs) => void): SignalConnection;
}
export interface ReadonlySignal<T extends (...args: any[]) => void = () => void>
	extends ReadonlyArgsSignal<Parameters<T>> {}

/** A signal that you can subscribe to, unsibscribe from and fire */
export class ArgsSignal<TArgs extends unknown[] = []> implements ReadonlyArgsSignal<TArgs> {
	static connection(func: () => void): SignalConnection {
		return {
			Disconnect() {
				func();
			},
		};
	}
	static multiConnection(...connections: SignalConnection[]): SignalConnection {
		return {
			Disconnect() {
				for (const connection of connections) {
					connection.Disconnect();
				}
			},
		};
	}

	private destroyed = false;
	private subscribed?: defined[]; // defined instead of T to workaround the type system
	private inSelf = 0;

	Connect(callback: (...args: TArgs) => void): SignalConnection {
		if (this.destroyed) return { Disconnect() {} };

		this.subscribed ??= [];
		this.subscribed.push(callback);

		const arr = this.subscribed;
		return {
			Disconnect() {
				arr.remove(arr.indexOf(callback));
			},
		};
	}
	Fire(...args: TArgs): void {
		if (!this.subscribed) return;
		if (this.inSelf > 10) {
			warn(`Signal self-calling overflow: ${debug.traceback()}`);
			throw "Signal self-calling overflow.";
		}

		this.inSelf++;
		for (const sub of this.subscribed) {
			const [success, result] = xpcall(
				sub as (...args: TArgs) => void,
				(err) => {
					warn(
						`Exception in signal ${tostring(this).sub("table: ".size() + 1)} handling ${tostring(sub).sub("function: ".size() + 1)}:\n${err}`,
						`\nat`,
						debug.traceback(undefined, 2),
					);

					return err;
				},
				...args,
			);

			if (!success) {
				this.inSelf = 0;
				error(result, 2);
			}
		}

		this.inSelf = 0;
	}

	destroy() {
		this.destroyed = true;
		this.subscribed = undefined;
	}

	asReadonly(): ReadonlyArgsSignal<TArgs> {
		return this;
	}
}

/** A signal that you can subscribe to, unsibscribe from and fire */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class Signal<T extends (...args: any) => void = () => void> extends ArgsSignal<Parameters<T>> {}
