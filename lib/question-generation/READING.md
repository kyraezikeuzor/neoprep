# Reading & Writing — Stems, Constraints, Distractor Patterns

Domain/skill names below match ArcPrep's schema exactly (validated against 605 real
College-Board questions during pipeline development) — use these exact strings for
the `domain`/`skill` fields, don't invent variants.

## Information and Ideas

### Central Ideas and Details
- **Stem:** "Which choice best states the main idea of the text?" (or "...main purpose of the text?")
- **Passage:** single paragraph, 50–90 words, third person
- **Distractors:** (B) too broad — true but overstates scope; (C) too narrow — a supporting detail mistaken for the main point; (D) plausible misreading — states a real fact from the text but misidentifies its relationship to the main idea
- **Difficulty lever:** tier 1 = main idea stated near-explicitly in text; tier 3 = main idea must be synthesized across 2+ sentences with no single topic sentence

### Command of Evidence (textual)
- **Stem:** "Which quotation from [source] would provide the strongest support for [claim]?" or "...most directly support Armijo's hypothesis?" (name the source/researcher in-passage)
- **Distractors:** each choice must be a plausible-sounding quotation; (B) supports the opposite conclusion; (C) is irrelevant/off-topic detail dressed as evidence; (D) restates the claim without adding supporting evidence
- **Difficulty lever:** tier 3 = correct evidence requires combining an implicit premise from the passage with the quoted fact

### Command of Evidence (quantitative)
- **Stem:** "Which choice most effectively uses data from the [graph/table] to complete the [statement/example]?"
- Must describe a simple 2-4 series chart in words (don't render an actual image) — give the AI-reader enough numeric detail to reason about which choice is data-accurate
- **Distractors:** (B) cites real data but for the wrong series/year; (C) reverses a trend direction; (D) uses real numbers but draws an unsupported causal claim

### Inferences
- **Stem:** "Which choice most logically completes the text?"
- **Passage:** ends with a blank; final sentence requires drawing a conclusion beyond what's explicitly stated
- **Distractors:** (B) restates a premise rather than concluding from it; (C) draws an overly strong/certain conclusion the evidence doesn't support; (D) is a plausible real-world inference that isn't actually supported by *this* passage's specific evidence

## Craft and Structure

### Words in Context
- **Stem:** "Which choice completes the text with the most logical and precise word or phrase?"
- **Distractors:** all 4 must be real synonyms/near-synonyms of a common sense of the blank word — differentiate by connotation or precision, not by obviously wrong meaning
- **Difficulty lever:** tier 3 = correct word tests a secondary/less common dictionary sense

### Text Structure and Purpose
- **Stem:** "Which choice best states the main purpose of the text?" / "Which choice best describes the overall structure of the text?"
- **Distractors:** each must name a plausible rhetorical move (e.g. "presents a counterargument then refutes it") that doesn't match this specific passage's actual structure

### Cross-Text Connections
- **Stem:** "Based on the texts, how would the author of Text 2 most likely respond to [claim/underlined portion] in Text 1?"
- **Requires TWO short passages** (60-80 words each) presenting related but distinct positions on the same topic
- **Distractors:** (B) has Text 2's author agreeing when they'd actually disagree; (C) correct stance but wrong/invented reasoning; (D) conflates the two authors' positions

## Expression of Ideas

### Rhetorical Synthesis
- **Stem:** "The student wants to [specific rhetorical goal]. Which choice most effectively uses relevant information from the notes to accomplish this goal?"
- **Format:** provide 4-6 bullet-point "notes" (not a paragraph), then ask the question
- **Distractors:** each choice must be factually accurate per the notes but fail the *specific stated goal* (e.g. goal is "emphasize a similarity" — distractor instead emphasizes a difference, or states an unrelated fact)

### Transitions
- **Stem:** "Which choice completes the text with the most logical transition?"
- **Distractors:** the four options should be transition words from different logical categories (contrast, cause/effect, addition, example) — exactly one matches the actual logical relationship between the two sentences

## Standard English Conventions

### Boundaries
- **Stem:** "Which choice completes the text so that it conforms to the conventions of Standard English?"
- **Tests:** comma splices, run-ons, fragments, colon/semicolon/dash usage for supplementary elements
- **blank_index required** — mark the `______` position
- **Distractors:** each must be a specific, nameable punctuation error (run-on, comma splice, incorrect fragment, wrong mark pairing)

### Form, Structure, and Sense
- **Stem:** "Which choice completes the text so that it conforms to the conventions of Standard English?"
- **Tests:** subject-verb agreement, pronoun-antecedent agreement, verb tense/form, possessives
- **blank_index required**
- **Distractors:** each must be a specific grammatical error type, named in your rationale (e.g. "singular verb with plural subject")

## Distractor-type naming reference

Always name the error type explicitly when constructing distractors — never write "this is wrong" without a mechanism:
- Too broad / too narrow (scope errors)
- Reversed cause-and-effect
- Plausible-but-unsupported inference
- Real fact, wrong relationship to the claim
- Right topic, wrong logical connector
- Specific grammar error (name it: comma splice, run-on, fragment, agreement error, tense shift)
