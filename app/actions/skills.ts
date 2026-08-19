"use server";

import { requireAdmin } from "@/app/actions/bootcamp";
import { listSkillGenerationSections } from "@/lib/question-generation/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function listSkillGenerationCatalog() {
  await requireAdmin();
  return listSkillGenerationSections();
}

export async function listGenerationPatterns(domain: string, skill: string, tier: 1 | 2 | 3) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: skillRow } = await admin.from("skills").select("id").eq("domain", domain).eq("skill", skill).maybeSingle();
  if (!skillRow) return [];
  const { data, error } = await admin.from("frameworks").select("tier_min, tier_max, patterns(id, name, description)").eq("skill_id", skillRow.id).eq("active", true).lte("tier_min", tier).gte("tier_max", tier);
  if (error) return [];
  return (data ?? []).flatMap((row) => {
    const pattern = Array.isArray(row.patterns) ? row.patterns[0] : row.patterns;
    return pattern ? [{ id: Number(pattern.id), name: String(pattern.name), description: String(pattern.description ?? "") }] : [];
  });
}
