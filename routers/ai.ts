import { os, streamToEventIterator } from "@orpc/server";
import * as z from "zod/mini";
import {
	convertToModelMessages,
	generateText,
	modelMessageSchema,
	streamText,
	type UIMessage,
} from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const SYSTEM_PROMPT = "You are a helpful assistant.";

const model = createOpenAICompatible({
	baseURL: "https://openrouter.ai/api/v1",
	name: "openrouter",
	apiKey: process.env.AI_API_KEY,
}).chatModel("mistralai/mistral-medium-3.1");

const chat = os
	.input(z.object({ messages: z.array(modelMessageSchema) }))
	.handler(async ({ input, signal }) => {
		const stream = streamText({
			messages: convertToModelMessages(
				input.messages as unknown as UIMessage[],
			),
			model,
			system: SYSTEM_PROMPT,
			abortSignal: signal,
		});
		return streamToEventIterator(stream.toUIMessageStream());
	});

const generate = os
	.input(z.object({ prompt: z.string() }))
	.handler(async ({ input, signal }) => {
		const result = await generateText({
			prompt: input.prompt,
			model,
			system: SYSTEM_PROMPT,
			abortSignal: signal,
		});
		return result;
	});

export const ai = {
	chat,
	generate,
};
