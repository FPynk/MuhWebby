type PongOptions = {
	winningScore?: number;
	serveDelayMs?: number;
	startOverlay?: HTMLElement | null;
	startButton?: HTMLButtonElement | null;
};

type Winner = "left" | "right" | null;

const clamp = (value: number, min: number, max: number): number =>
	Math.min(max, Math.max(min, value));

export function initPong(
	canvas: HTMLCanvasElement,
	options: PongOptions = {},
): () => void {
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		return () => {};
	}

	const width = canvas.width || 800;
	const height = canvas.height || 480;
	canvas.width = width;
	canvas.height = height;

	const rootStyles = getComputedStyle(document.documentElement);
	const colors = {
		background: rootStyles.getPropertyValue("--surface").trim() || "#12161f",
		foreground: rootStyles.getPropertyValue("--foreground").trim() || "#ededed",
		accent: rootStyles.getPropertyValue("--link").trim() || "#7ab7ff",
		line: rootStyles.getPropertyValue("--surface-border").trim() || "#2a3444",
	};

	const winningScore = Math.max(1, Math.floor(options.winningScore ?? 7));
	const serveDelaySeconds = Math.max(0, (options.serveDelayMs ?? 900) / 1000);
	const startOverlay = options.startOverlay ?? null;
	const startButton = options.startButton ?? null;

	const paddleWidth = 14;
	const paddleHeight = 92;
	const paddleMargin = 26;
	const paddleSpeed = 460;
	const aiSpeed = 350;
	const ballRadius = 8;
	const baseBallSpeed = 360;
	const maxBallSpeed = 900;
	const maxBounceAngle = Math.PI / 3;

	const leftX = paddleMargin;
	const rightX = width - paddleMargin - paddleWidth;

	// Core state for score, paddles, ball, and round flow.
	const state = {
		leftY: height / 2 - paddleHeight / 2,
		rightY: height / 2 - paddleHeight / 2,
		ballX: width / 2,
		ballY: height / 2,
		ballVx: 0,
		ballVy: 0,
		leftScore: 0,
		rightScore: 0,
		serveTimer: 0,
		serveDirection: Math.random() > 0.5 ? 1 : -1,
		winner: null as Winner,
	};

	// Input is tracked as simple booleans for W/S.
	const input = {
		up: false,
		down: false,
	};

	let started = false;

	const startGame = (): void => {
		if (started) {
			return;
		}
		started = true;
		startOverlay?.classList.add("is-hidden");
		startButton?.blur();
	};

	const resetBall = (direction: 1 | -1): void => {
		state.ballX = width / 2;
		state.ballY = height / 2;
		state.ballVx = 0;
		state.ballVy = 0;
		state.serveDirection = direction;
		state.serveTimer = serveDelaySeconds;
	};

	const launchBall = (): void => {
		const serveAngle = (Math.random() * 2 - 1) * (Math.PI / 8);
		state.ballVx = state.serveDirection * baseBallSpeed * Math.cos(serveAngle);
		state.ballVy = baseBallSpeed * Math.sin(serveAngle);
	};

	const resetMatch = (): void => {
		state.leftScore = 0;
		state.rightScore = 0;
		state.winner = null;
		state.leftY = height / 2 - paddleHeight / 2;
		state.rightY = height / 2 - paddleHeight / 2;
		resetBall(Math.random() > 0.5 ? 1 : -1);
	};

	const scorePoint = (serveDirection: 1 | -1): void => {
		if (serveDirection === 1) {
			state.leftScore += 1;
		} else {
			state.rightScore += 1;
		}

		if (state.leftScore >= winningScore) {
			state.winner = "left";
		} else if (state.rightScore >= winningScore) {
			state.winner = "right";
		}

		if (state.winner) {
			state.ballX = width / 2;
			state.ballY = height / 2;
			state.ballVx = 0;
			state.ballVy = 0;
			state.serveTimer = 0;
			return;
		}

		// Serve toward the player who conceded the previous point.
		resetBall(serveDirection);
	};

	const collideWithPaddle = (paddleY: number, nextDirection: 1 | -1): void => {
		const paddleCenter = paddleY + paddleHeight / 2;
		const relativeIntersect = clamp(
			(state.ballY - paddleCenter) / (paddleHeight / 2),
			-1,
			1,
		);
		const bounceAngle = relativeIntersect * maxBounceAngle;
		const nextSpeed = Math.min(
			Math.hypot(state.ballVx, state.ballVy) * 1.05,
			maxBallSpeed,
		);

		state.ballVx = nextDirection * nextSpeed * Math.cos(bounceAngle);
		state.ballVy = nextSpeed * Math.sin(bounceAngle);

		if (nextDirection > 0) {
			state.ballX = leftX + paddleWidth + ballRadius;
		} else {
			state.ballX = rightX - ballRadius;
		}
	};

	// Update advances movement, AI, collisions, and scoring.
	const update = (dt: number): void => {
		if (input.up) {
			state.leftY -= paddleSpeed * dt;
		}
		if (input.down) {
			state.leftY += paddleSpeed * dt;
		}
		state.leftY = clamp(state.leftY, 0, height - paddleHeight);

		if (!started) {
			return;
		}

		const aiTargetY =
			state.ballVx > 0 ? state.ballY - paddleHeight / 2 : height / 2 - paddleHeight / 2;
		const aiDelta = aiTargetY - state.rightY;
		if (Math.abs(aiDelta) > 5) {
			const maxAiMove = aiSpeed * dt;
			state.rightY += Math.sign(aiDelta) * Math.min(Math.abs(aiDelta), maxAiMove);
		}
		state.rightY = clamp(state.rightY, 0, height - paddleHeight);

		if (state.winner) {
			return;
		}

		if (state.serveTimer > 0) {
			state.serveTimer -= dt;
			if (state.serveTimer <= 0) {
				launchBall();
			}
			return;
		}

		state.ballX += state.ballVx * dt;
		state.ballY += state.ballVy * dt;

		if (state.ballY - ballRadius <= 0) {
			state.ballY = ballRadius;
			state.ballVy = Math.abs(state.ballVy);
		} else if (state.ballY + ballRadius >= height) {
			state.ballY = height - ballRadius;
			state.ballVy = -Math.abs(state.ballVy);
		}

		if (
			state.ballVx < 0 &&
			state.ballX - ballRadius <= leftX + paddleWidth &&
			state.ballX + ballRadius >= leftX &&
			state.ballY + ballRadius >= state.leftY &&
			state.ballY - ballRadius <= state.leftY + paddleHeight
		) {
			collideWithPaddle(state.leftY, 1);
		} else if (
			state.ballVx > 0 &&
			state.ballX + ballRadius >= rightX &&
			state.ballX - ballRadius <= rightX + paddleWidth &&
			state.ballY + ballRadius >= state.rightY &&
			state.ballY - ballRadius <= state.rightY + paddleHeight
		) {
			collideWithPaddle(state.rightY, -1);
		}

		if (state.ballX + ballRadius < 0) {
			scorePoint(-1);
		} else if (state.ballX - ballRadius > width) {
			scorePoint(1);
		}
	};

	// Render draws the full frame each tick.
	const render = (): void => {
		ctx.fillStyle = colors.background;
		ctx.fillRect(0, 0, width, height);

		ctx.fillStyle = colors.line;
		for (let y = 14; y < height; y += 24) {
			ctx.fillRect(width / 2 - 2, y, 4, 12);
		}

		ctx.fillStyle = colors.foreground;
		ctx.fillRect(leftX, state.leftY, paddleWidth, paddleHeight);
		ctx.fillRect(rightX, state.rightY, paddleWidth, paddleHeight);

		ctx.beginPath();
		ctx.arc(state.ballX, state.ballY, ballRadius, 0, Math.PI * 2);
		ctx.fillStyle = colors.accent;
		ctx.fill();

		ctx.fillStyle = colors.foreground;
		ctx.font = '700 46px "Geist Mono Local", "Geist Mono", ui-monospace';
		ctx.textAlign = "center";
		ctx.textBaseline = "top";
		ctx.fillText(`${state.leftScore}   ${state.rightScore}`, width / 2, 18);

		ctx.font = '500 18px "Geist Mono Local", "Geist Mono", ui-monospace';
		ctx.textBaseline = "bottom";
		if (!started) {
			ctx.fillText("Press W/S or \u2191/\u2193 to start", width / 2, height - 18);
		} else if (state.winner) {
			const winnerLabel = state.winner === "left" ? "You win!" : "CPU wins!";
			ctx.fillText(`${winnerLabel} Press R to restart`, width / 2, height - 18);
		} else if (state.serveTimer > 0) {
			ctx.fillText("Get ready...", width / 2, height - 18);
		}
	};

	const handleKeyDown = (event: KeyboardEvent): void => {
		const { key } = event;
		const isUpKey = key === "w" || key === "W" || key === "ArrowUp";
		const isDownKey = key === "s" || key === "S" || key === "ArrowDown";

		if (key === "ArrowUp") {
			event.preventDefault();
		}
		if (key === "ArrowDown") {
			event.preventDefault();
		}

		if (!started && (isUpKey || isDownKey)) {
			startGame();
		}

		if (isUpKey) {
			input.up = true;
		} else if (isDownKey) {
			input.down = true;
		} else if ((key === "r" || key === "R") && state.winner) {
			resetMatch();
		}
	};

	const handleKeyUp = (event: KeyboardEvent): void => {
		const { key } = event;
		if (key === "ArrowUp" || key === "ArrowDown") {
			event.preventDefault();
		}
		if (key === "w" || key === "W" || key === "ArrowUp") {
			input.up = false;
		} else if (key === "s" || key === "S" || key === "ArrowDown") {
			input.down = false;
		}
	};

	const clearInput = (): void => {
		input.up = false;
		input.down = false;
	};

	window.addEventListener("keydown", handleKeyDown);
	window.addEventListener("keyup", handleKeyUp);
	window.addEventListener("blur", clearInput);
	startButton?.addEventListener("click", startGame);

	resetMatch();
	render();

	let rafId = 0;
	let lastTime = 0;
	let running = true;

	const loop = (time: number): void => {
		if (!running) {
			return;
		}

		if (!lastTime) {
			lastTime = time;
		}

		const dt = Math.min((time - lastTime) / 1000, 0.033);
		lastTime = time;

		update(dt);
		render();
		rafId = window.requestAnimationFrame(loop);
	};

	rafId = window.requestAnimationFrame(loop);

	return () => {
		running = false;
		window.cancelAnimationFrame(rafId);
		window.removeEventListener("keydown", handleKeyDown);
		window.removeEventListener("keyup", handleKeyUp);
		window.removeEventListener("blur", clearInput);
		startButton?.removeEventListener("click", startGame);
	};
}
