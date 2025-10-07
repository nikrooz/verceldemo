import * as restate from "@restatedev/restate-sdk";
import { durableCalls } from "@restatedev/vercel-ai-middleware";
import { openai } from "@ai-sdk/openai";
import { generateText, tool, wrapLanguageModel, stepCountIs } from "ai";
import { z } from "zod";

export const InsuranceClaimSchema = z.object({
  date: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  amount: z.number().nullable().optional(),
  placeOfService: z.string().nullable().optional(),
});

export type InsuranceClaim = z.infer<typeof InsuranceClaimSchema>;

export const claimApprovalAgentWithHumanApproval = restate.service({
  name: "ClaimApprovalAgent",
  handlers: {
    run: async (ctx: restate.Context, { prompt }: { prompt: string }) => {
      const model = wrapLanguageModel({
        model: openai("gpt-4o"),
        middleware: durableCalls(ctx, { maxRetryAttempts: 3 }),
      });

      const { text } = await generateText({
        model,
        system:
          "You are an insurance claim evaluation agent. Use these rules: " +
          "* if the amount is more than 1000, ask for human approval, " +
          "* if the amount is less than 1000, decide by yourself",
        prompt,
        tools: {
          humanApproval: tool({
            description: "Ask for human approval for high-value claims.",
            inputSchema: InsuranceClaimSchema,
            execute: async (claim: InsuranceClaim): Promise<boolean> => {
              const approval = ctx.awakeable<boolean>();
              await ctx.run("request-review", () =>
                requestHumanReview(claim, approval.id),
              );
              return approval.promise;
            },
          }),
        },
        stopWhen: [stepCountIs(5)],
      });
      return text;
    },
  },
});

// UTILS

export function requestHumanReview(
  message: InsuranceClaim,
  responseId: string = "",
) {
  console.log(`>>> ${message} \n
  Submit your claim review via: \n
    curl localhost:8080/restate/awakeables/${responseId}/resolve --json 'true'
  `);
}
