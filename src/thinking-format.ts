import type { OpenAICompletionsCompat } from "@earendil-works/pi-ai";

type ThinkingFormat = NonNullable<OpenAICompletionsCompat["thinkingFormat"]>;

const FREELLMAPI_CHAT_TEMPLATE_FORMAT: ThinkingFormat = "qwen-chat-template";
const NO_THINKING_FORMAT: ThinkingFormat = "openai";

const REASONING_PARSER_FORMATS: Record<string, ThinkingFormat> = {
	qwen: FREELLMAPI_CHAT_TEMPLATE_FORMAT,
	qwen_3_coder: FREELLMAPI_CHAT_TEMPLATE_FORMAT,
	llama: FREELLMAPI_CHAT_TEMPLATE_FORMAT,
	harmony: FREELLMAPI_CHAT_TEMPLATE_FORMAT,
	deepseek_v4: FREELLMAPI_CHAT_TEMPLATE_FORMAT,
};

export function thinkingFormatFor(
	reasoningParser: string | undefined,
): ThinkingFormat {
	if (!reasoningParser) return NO_THINKING_FORMAT;
	return (
		REASONING_PARSER_FORMATS[reasoningParser.toLowerCase()] ??
		NO_THINKING_FORMAT
	);
}
