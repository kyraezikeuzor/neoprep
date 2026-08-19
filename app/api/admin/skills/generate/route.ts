import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/actions/bootcamp";
import { generateQuestionsForSkill } from "@/lib/question-generation/server";

type GenerateRouteBody = {
  domain?: unknown;
  skill?: unknown;
  tier?: unknown;
  count?: unknown;
  patternId?: unknown;
};

function badRequest(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    return badRequest(message === "Not signed in" ? message : "Forbidden", 403);
  }

  let body: GenerateRouteBody;
  try {
    body = (await request.json()) as GenerateRouteBody;
  } catch {
    return badRequest("Invalid JSON request body.");
  }

  const domain = typeof body.domain === "string" ? body.domain.trim() : "";
  const skill = typeof body.skill === "string" ? body.skill.trim() : "";
  const tier = Number(body.tier);
  const count = Number(body.count);
  const patternId = Number(body.patternId);

  if (!domain) return badRequest("Domain is required.");
  if (!skill) return badRequest("Skill is required.");
  if (tier !== 1 && tier !== 2 && tier !== 3) {
    return badRequest("Tier must be 1, 2, or 3.");
  }
  if (!Number.isFinite(count) || count < 1 || count > 10) {
    return badRequest("Count must be between 1 and 10.");
  }
  if (!Number.isInteger(patternId) || patternId < 1) return badRequest("Choose a pattern.");

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      try {
        send({ type: "progress", message: "Starting the generation job." });
        const result = await generateQuestionsForSkill(
          { domain, skill, tier, count, patternId },
          (message) => send({ type: "progress", message })
        );

        revalidatePath("/admin/generate-questions");
        revalidatePath("/admin/sandbox");
        revalidatePath("/admin/skills");
        revalidatePath("/admin/tools");

        send({
          type: "complete",
          addedCount: result.addedCount,
          questionIds: result.questionIds,
          anthropicModel: result.anthropicModel,
        });
      } catch (error) {
        send({
          type: "error",
          error: error instanceof Error ? error.message : "Question generation failed.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
