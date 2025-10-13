import { createEffect, createSignal, For } from "solid-js";

export type LogEntry = {
	id: string;
	type: "info" | "success" | "error" | "stdout";
	content: string;
	timestamp: Date;
};

type Props = {
	logs: LogEntry[];
	onClear?: () => void;
};

export function AppLogsPane(props: Props) {
	let contentRef: HTMLDivElement | undefined;
	const [isVisible, setIsVisible] = createSignal(true);

	// Auto-scroll to bottom when new logs are added
	createEffect(() => {
		if (props.logs.length > 0 && contentRef && isVisible()) {
			contentRef.scrollTop = contentRef.scrollHeight;
		}
	});

	const formatTime = (date: Date) => {
		return date.toLocaleTimeString();
	};

	const getLogTypeClass = (type: LogEntry["type"]) => {
		switch (type) {
			case "error":
				return "text-red-300";
			case "success":
				return "text-green-300";
			case "stdout":
				return "text-emerald-300";
			default:
				return "text-slate-200";
		}
	};

	return (
		<div class="bg-slate-900 border border-slate-600 rounded-lg margin-4 max-h-96 flex flex-col">
			{/* Header */}
			<div class="flex items-center gap-2 p-3 bg-slate-800 border-b border-slate-600 rounded-t-lg">
				<span class="text-slate-200 font-medium flex-1">Dev Mode Logs</span>
				<button
					type="button"
					onClick={() => setIsVisible(!isVisible())}
					class="bg-slate-600 text-slate-200 border-none px-2 py-1 rounded text-xs cursor-pointer hover:bg-slate-500 transition-colors"
				>
					{isVisible() ? "Hide" : "Show"}
				</button>
				<button
					type="button"
					onClick={() => props.onClear?.()}
					class="bg-slate-600 text-slate-200 border-none px-2 py-1 rounded text-xs cursor-pointer hover:bg-slate-500 transition-colors"
				>
					Clear
				</button>
			</div>

			{/* Content */}
			{isVisible() && (
				<div
					ref={contentRef}
					class="flex-1 p-2 overflow-y-auto max-h-72 font-mono text-xs leading-relaxed"
				>
					<For each={props.logs}>
						{(log) => (
							<div class="flex gap-2 mb-1 py-0.5">
								<span class="text-slate-500 text-xs min-w-fit flex-shrink-0">
									{formatTime(log.timestamp)}
								</span>
								<span class={`flex-1 ${getLogTypeClass(log.type)}`}>
									{log.content}
								</span>
							</div>
						)}
					</For>
					{props.logs.length === 0 && (
						<div class="text-slate-500 text-center py-4">No logs yet...</div>
					)}
				</div>
			)}
		</div>
	);
}
