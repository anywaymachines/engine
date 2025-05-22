export class Lock {
	private isInLock = false;

	execute<T>(func: () => T): T {
		while (this.isInLock) {
			task.wait();
		}

		this.isInLock = true;
		try {
			return func();
		} finally {
			this.isInLock = false;
		}
	}
}
