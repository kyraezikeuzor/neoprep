# Math — Stems, Constraints, Distractor Patterns

Domain/skill names below match ArcPrep's schema exactly. Every Math question needs
`question_type`: `"multiple_choice"` (4 choices) or `"grid_in"` (student-produced
numeric response, no choices — set `"choices": null` and `correct_answer` to the
numeric value as a string).

## Algebra

Skills: Linear equations in one variable · Linear functions · Linear equations in
two variables · Systems of two linear equations in two variables · Linear
inequalities in one or two variables

- **Stem pattern:** present an equation/system/inequality with a variable coefficient
  or unknown constant, ask to solve or interpret
- **Common-mistake distractors:** sign error when moving terms across `=`; forgot to
  distribute a negative; solved for the wrong variable; used the wrong slope/intercept
  from a word-problem setup
- **Grid-in candidates:** "solve for x" questions with a clean integer/simple-fraction answer

## Advanced Math

Skills: Nonlinear functions · Nonlinear equations in one variable and systems of
equations in two variables · Equivalent expressions

- **Discriminant questions** (nonlinear functions/equations): present `ax² + bx + c = 0`
  (or a rewritten form) with one unknown constant (usually `k`), state the number of
  real solutions (0, 1, or 2), ask for the value/range of the constant
  - **Stem:** "The equation [...] has exactly one real solution. What is the value of k?"
  - **Common-mistake distractors:** forgot to square b (used `b` instead of `b²`);
    sign error in `-4ac` (added instead of subtracted, or vice versa); solved for
    `k` using the wrong root of the resulting equation; used `b² - 4ac > 0` when the
    stem asked for exactly one solution (`= 0`)
  - **Rationale must show algebraic steps** using the discriminant formula explicitly
- **Equivalent expressions:** ask which choice is algebraically equivalent to a given
  polynomial/rational expression after factoring or expanding
  - **Common-mistake distractors:** sign error in factoring; forgot a cross-term when
    expanding `(a+b)²`; simplified incorrectly by canceling additive terms instead of
    factors

## Problem-Solving and Data Analysis

Skills: Ratios, rates, proportional relationships, and units · Percentages ·
One-variable data: distributions and measures of center and spread · Two-variable
data: models and scatterplots · Probability and conditional probability ·
Inference from sample statistics and margin of error · Evaluating statistical claims

- **Stem pattern:** word-problem framing (never fictional named people from real
  test content — invent generic scenarios: a factory, a survey, a study)
- **Common-mistake distractors:** used the wrong base for a percent-change
  calculation; confused mean with median; computed probability without accounting
  for a stated condition; misread which variable is dependent in a scatterplot claim

## Geometry and Trigonometry

Skills: Area and volume · Lines, angles, and triangles · Right triangles and
trigonometry · Circles

**These skills are almost always diagram-based on the real exam.** When writing
these, describe the figure precisely in words in the stem (e.g. "Triangle ABC has
a right angle at C, with leg AC = 21 and leg BC = 20") since you can't generate an
actual image — the description substitutes for the figure.

- **Right triangle trig common-mistake distractors:** swapped sin/cos (used
  adjacent/hypotenuse when opposite/hypotenuse was asked); used the wrong angle's
  ratio (computed tan(B) when tan(A) was asked); inverted the fraction
- **Circles:** confused radius/diameter in area or circumference formula; used
  degrees where radians were needed (or vice versa) in arc-length problems
- **Area/volume:** used the wrong formula for a similar-looking shape; forgot to
  convert units; used a linear scale factor where an area/volume scale factor
  (squared/cubed) was needed

## Difficulty tiers

- **Tier 1 (easy):** single-step solve, no distractor requires multi-step reasoning
  to construct — a student mostly needs to recognize the right formula/approach
- **Tier 2 (medium):** 2-3 step solve, at least one distractor requires the *same*
  number of steps as the correct answer (so guessing "shortest-looking answer" fails)
- **Tier 3 (hard):** multi-step or requires combining two concepts (e.g. a system of
  equations word problem that also requires a unit conversion); distractors should
  result from a subtle single-step error partway through an otherwise-correct
  multi-step process, not from a wrong approach entirely

## Rationale requirements

Every math rationale must show the actual working, not just state the answer:
1. Identify the relevant formula/relationship
2. Show substitution of the problem's specific values
3. Show the algebraic simplification steps
4. State the final answer
5. For each distractor, name the specific step where that error would occur

## Graphs and diagrams — structured data, never prose descriptions or images

Since every question here is generated from scratch (not OCR'd from an existing
PDF), there's no reason to ever produce a raster image or describe a figure in
words for the stem. Represent the graph as structured JSON in a `graph_spec`
field on the question record, and let the app render it client-side. This is
strictly better than an image: infinitely reusable, no OCR, no "diagram looks
garbled" failure mode - it literally cannot fail to render correctly, because
there's no image to misread in the first place.

Use exactly one of four `graph_spec` shapes, matching the question's domain:

### `geometry_figure` (Geometry and Trigonometry: triangles, circles, angles)

```json
{
  "type": "geometry_figure",
  "shape": "triangle",
  "vertices": {"A": [0, 0], "B": [4, 0], "C": [4, 3]},
  "labels": {"AB": "4", "BC": "3", "AC": null, "angle_B": "90°"},
  "note": "Figure not drawn to scale"
}
```
- `vertices` are abstract plot coordinates (not required to be geometrically
  accurate to the labeled lengths - SAT figures are explicitly "not drawn to
  scale," so pick any coordinates that produce a legible, recognizable shape)
- `labels` maps an edge (two vertex letters) or `angle_<vertex>` to the text
  to display there - use `null` for a side whose length is the unknown being
  solved for (so it renders unlabeled)
- `shape` can be `triangle`, `circle`, or `right_triangle` (draws the right-
  angle marker automatically)
- For circles: `{"type": "geometry_figure", "shape": "circle", "center": [0,0], "radius": 3, "labels": {"radius": "3", "point_on_circle": "P"}}`

### `function_graph` (Algebra: linear; Advanced Math: nonlinear/quadratic/exponential)

```json
{
  "type": "function_graph",
  "expressions": ["y = x^2 - 4x + 3"],
  "viewport": {"xmin": -2, "xmax": 6, "ymin": -3, "ymax": 5},
  "highlight_points": [{"x": 1, "y": 0, "label": null}, {"x": 3, "y": 0, "label": null}]
}
```
- `expressions` is one or more Desmos-syntax expressions (plain algebraic
  notation - Desmos parses `x^2`, `sqrt(x)`, etc. directly, no LaTeX escaping
  needed)
- `highlight_points` marks specific points the question is about (e.g.
  x-intercepts for a discriminant question) - set `label` to `null` when the
  point's coordinates are what the student needs to find, otherwise give it a
  short label like `"(1, 4)"`
- Always set a `viewport` that comfortably frames the relevant part of the
  graph - don't leave Desmos to auto-zoom

### `data_chart` (Problem-Solving and Data Analysis: one/two-variable data)

```json
{
  "type": "data_chart",
  "chart_type": "bar",
  "title": "Weight of Three Aerial Robots",
  "x_label": "Robot",
  "y_label": "Weight (grams)",
  "categories": ["Ultra-Fast Robot Hand", "Permanent Magnet Hand", "Yale Model T"],
  "series": [{"name": "Weight", "values": [520, 480, 410]}]
}
```
- `chart_type` is `bar`, `line`, or `scatter`
- For scatter/two-variable data, `series` values are `[x, y]` pairs instead
  of single numbers
- Numbers here are the actual data the rationale reasons about - make sure
  the rationale's arithmetic matches these values exactly, since (unlike a
  described-in-words chart) a student can read the exact numbers directly
  off the rendered chart

### `data_table` (Problem-Solving and Data Analysis: plain tabular data, no chart)

```json
{
  "type": "data_table",
  "title": "Median Ages of First Marriage",
  "columns": ["Year", "Men (US)", "Women (US)"],
  "rows": [
    ["1990", "26.1", "23.9"],
    ["2000", "26.8", "25.1"],
    ["2010", "28.2", "26.1"]
  ]
}
```
- Use when the question presents a table of values (rows/columns of numbers or
  labels) with no bar/line/scatter chart — distinct from `data_chart`
- `columns` is the header row; each entry in `rows` is an array of cell
  strings aligned to those columns (same length as `columns`)
- All values in `rows` are strings (even numbers) so formatting like `"26.1"`
  or `"$4,200"` renders exactly as intended without the renderer reformatting it
- Optional `title` appears above the table when present

## Output format addition for graph questions

When a question includes a graph, add the `graph_spec` field to the JSON
output described earlier in this skill, alongside `stem`/`choices`/etc. The
`stem` text should still read naturally on its own (e.g. "In the figure
above, what is the value of..." or "The graph shows..."), assuming the
graph_spec will be rendered directly above it - don't redundantly describe
the figure in prose when graph_spec already carries that information.
