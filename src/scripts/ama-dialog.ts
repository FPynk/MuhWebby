export function initAmaDialogs(): void {
	const sections = document.querySelectorAll<HTMLElement>("[data-ama-section]");
	if (sections.length === 0) {
		return;
	}

	const setDialogVideosPlayback = (
		dialog: HTMLDialogElement,
		shouldPlay: boolean,
	): void => {
		const videos = dialog.querySelectorAll<HTMLVideoElement>("video.ama-dialog-media-video");
		videos.forEach((video) => {
			video.muted = true;
			if (shouldPlay) {
				video.currentTime = 0;
				const playPromise = video.play();
				playPromise?.catch(() => {
					/* Ignore autoplay rejections from browser policy edge cases. */
				});
				return;
			}
			video.pause();
			video.currentTime = 0;
		});
	};

	sections.forEach((section) => {
		if (section.dataset.amaDialogsBound === "true") {
			return;
		}
		section.dataset.amaDialogsBound = "true";

		const triggers = section.querySelectorAll<HTMLButtonElement>("[data-dialog-id]");
		triggers.forEach((trigger) => {
			const dialogId = trigger.dataset.dialogId;
			if (!dialogId) {
				return;
			}

			const dialog = document.getElementById(dialogId);
			if (!(dialog instanceof HTMLDialogElement)) {
				return;
			}

			trigger.addEventListener("click", () => {
				if (!dialog.open) {
					dialog.showModal();
					setDialogVideosPlayback(dialog, true);
				}
			});

			const closeButton = dialog.querySelector<HTMLButtonElement>("[data-dialog-close]");
			closeButton?.addEventListener("click", () => {
				dialog.close();
			});

			dialog.addEventListener("click", (event) => {
				const mouseEvent = event as MouseEvent;
				const rect = dialog.getBoundingClientRect();
				const clickedInside =
					mouseEvent.clientX >= rect.left &&
					mouseEvent.clientX <= rect.right &&
					mouseEvent.clientY >= rect.top &&
					mouseEvent.clientY <= rect.bottom;
				if (!clickedInside) {
					dialog.close();
				}
			});

			dialog.addEventListener("close", () => {
				setDialogVideosPlayback(dialog, false);
			});
		});
	});
}
