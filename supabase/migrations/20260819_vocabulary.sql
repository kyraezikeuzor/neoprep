-- SAT vocabulary bank + high-frequency seed list.
-- Run in the Supabase SQL editor if not applied via CLI.

create table if not exists public.vocabulary (
  id uuid primary key default gen_random_uuid(),
  word text not null,
  type text not null,
  part_of_speech text not null,
  definition text not null,
  example_sentence text,
  synonyms text[] not null default '{}',
  antonyms text[] not null default '{}',
  word_family text[] not null default '{}',
  tier smallint,
  frequency_rank integer,
  source text,
  notes text,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vocabulary_word_not_blank check (length(btrim(word)) > 0),
  constraint vocabulary_word_lowercase check (word = lower(btrim(word))),
  constraint vocabulary_definition_not_blank check (length(btrim(definition)) > 0),
  constraint vocabulary_type_check check (type in ('n', 'v', 'adj', 'adv')),
  constraint vocabulary_pos_check check (
    part_of_speech in ('noun', 'verb', 'adjective', 'adverb')
  ),
  constraint vocabulary_tier_check check (
    tier is null or tier in (1, 2, 3)
  ),
  constraint vocabulary_word_type_unique unique (word, type)
);

-- In case the table already existed without type.
alter table public.vocabulary add column if not exists type text;
alter table public.vocabulary add column if not exists part_of_speech text;
alter table public.vocabulary add column if not exists definition text;
alter table public.vocabulary add column if not exists frequency_rank integer;
alter table public.vocabulary add column if not exists verified boolean not null default false;
alter table public.vocabulary add column if not exists source text;
alter table public.vocabulary add column if not exists updated_at timestamptz not null default now();

create index if not exists vocabulary_word_idx
  on public.vocabulary (word);

create index if not exists vocabulary_type_idx
  on public.vocabulary (type);

create index if not exists vocabulary_tier_idx
  on public.vocabulary (tier);

create index if not exists vocabulary_verified_idx
  on public.vocabulary (verified);

alter table public.vocabulary enable row level security;

drop policy if exists "Authenticated users can read vocabulary" on public.vocabulary;
create policy "Authenticated users can read vocabulary"
  on public.vocabulary for select
  to authenticated
  using (true);

drop policy if exists "Admins can insert vocabulary" on public.vocabulary;
create policy "Admins can insert vocabulary"
  on public.vocabulary for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "Admins can update vocabulary" on public.vocabulary;
create policy "Admins can update vocabulary"
  on public.vocabulary for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "Admins can delete vocabulary" on public.vocabulary;
create policy "Admins can delete vocabulary"
  on public.vocabulary for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

grant select on public.vocabulary to authenticated;
grant all on public.vocabulary to service_role;

insert into public.vocabulary (
  word,
  type,
  part_of_speech,
  definition,
  frequency_rank,
  tier,
  verified,
  source
)
values
  ('aberration', 'n', 'noun', 'A departure from what is normal or expected', 1, 3, true, 'sat_high_frequency'),
  ('abate', 'v', 'verb', 'To become less intense or severe', 2, 2, true, 'sat_high_frequency'),
  ('abridge', 'v', 'verb', 'To shorten a text while keeping its main content', 3, 2, true, 'sat_high_frequency'),
  ('abstain', 'v', 'verb', 'To choose not to do or have something', 4, 1, true, 'sat_high_frequency'),
  ('acclaim', 'v', 'verb', 'To praise enthusiastically and publicly', 5, 1, true, 'sat_high_frequency'),
  ('acumen', 'n', 'noun', 'The ability to make good judgments quickly', 6, 3, true, 'sat_high_frequency'),
  ('adamant', 'adj', 'adjective', 'Refusing to change one''s mind', 7, 1, true, 'sat_high_frequency'),
  ('adversity', 'n', 'noun', 'A difficult or unfavorable situation', 8, 1, true, 'sat_high_frequency'),
  ('aesthetic', 'adj', 'adjective', 'Concerned with beauty or the appreciation of it', 9, 1, true, 'sat_high_frequency'),
  ('affable', 'adj', 'adjective', 'Friendly and easy to talk to', 10, 2, true, 'sat_high_frequency'),
  ('alleviate', 'v', 'verb', 'To make suffering or a problem less severe', 11, 2, true, 'sat_high_frequency'),
  ('altruistic', 'adj', 'adjective', 'Showing selfless concern for the wellbeing of others', 12, 2, true, 'sat_high_frequency'),
  ('ambiguous', 'adj', 'adjective', 'Open to more than one interpretation', 13, 2, true, 'sat_high_frequency'),
  ('ambivalent', 'adj', 'adjective', 'Having mixed or contradictory feelings', 14, 2, true, 'sat_high_frequency'),
  ('ameliorate', 'v', 'verb', 'To make a bad situation better', 15, 3, true, 'sat_high_frequency'),
  ('amiable', 'adj', 'adjective', 'Having a friendly and pleasant manner', 16, 2, true, 'sat_high_frequency'),
  ('anomaly', 'n', 'noun', 'Something that deviates from what is standard', 17, 2, true, 'sat_high_frequency'),
  ('antagonize', 'v', 'verb', 'To cause someone to become hostile', 18, 2, true, 'sat_high_frequency'),
  ('apathy', 'n', 'noun', 'A lack of interest or concern', 19, 1, true, 'sat_high_frequency'),
  ('arbitrary', 'adj', 'adjective', 'Based on random choice rather than reason', 20, 2, true, 'sat_high_frequency'),
  ('arduous', 'adj', 'adjective', 'Requiring great effort and hard to accomplish', 21, 2, true, 'sat_high_frequency'),
  ('articulate', 'adj', 'adjective', 'Able to express oneself clearly and effectively', 22, 1, true, 'sat_high_frequency'),
  ('ascertain', 'v', 'verb', 'To find something out for certain', 23, 2, true, 'sat_high_frequency'),
  ('astute', 'adj', 'adjective', 'Having sharp judgment; shrewd', 24, 2, true, 'sat_high_frequency'),
  ('audacious', 'adj', 'adjective', 'Showing a willingness to take bold risks', 25, 2, true, 'sat_high_frequency'),
  ('austere', 'adj', 'adjective', 'Plain and without comfort or luxury', 26, 2, true, 'sat_high_frequency'),
  ('authentic', 'adj', 'adjective', 'Genuine; of undisputed origin', 27, 1, true, 'sat_high_frequency'),
  ('autonomy', 'n', 'noun', 'The ability to act independently', 28, 1, true, 'sat_high_frequency'),
  ('avert', 'v', 'verb', 'To prevent or turn away something bad', 29, 1, true, 'sat_high_frequency'),
  ('banal', 'adj', 'adjective', 'So commonplace as to be boring', 30, 3, true, 'sat_high_frequency'),
  ('belligerent', 'adj', 'adjective', 'Hostile and eager to fight', 31, 2, true, 'sat_high_frequency'),
  ('benevolent', 'adj', 'adjective', 'Kind and generous', 32, 1, true, 'sat_high_frequency'),
  ('brevity', 'n', 'noun', 'Concise and exact use of words', 33, 2, true, 'sat_high_frequency'),
  ('candid', 'adj', 'adjective', 'Truthful and straightforward', 34, 1, true, 'sat_high_frequency'),
  ('capricious', 'adj', 'adjective', 'Given to sudden, unpredictable changes', 35, 3, true, 'sat_high_frequency'),
  ('catalyst', 'n', 'noun', 'Something that causes a change or event to happen', 36, 1, true, 'sat_high_frequency'),
  ('caustic', 'adj', 'adjective', 'Sarcastic in a harsh, biting way', 37, 3, true, 'sat_high_frequency'),
  ('censure', 'v', 'verb', 'To express strong disapproval of someone', 38, 3, true, 'sat_high_frequency'),
  ('circumvent', 'v', 'verb', 'To find a way around an obstacle or rule', 39, 2, true, 'sat_high_frequency'),
  ('clandestine', 'adj', 'adjective', 'Done secretly', 40, 3, true, 'sat_high_frequency'),
  ('coalesce', 'v', 'verb', 'To come together to form one group or whole', 41, 3, true, 'sat_high_frequency'),
  ('coerce', 'v', 'verb', 'To persuade someone using force or threats', 42, 2, true, 'sat_high_frequency'),
  ('cogent', 'adj', 'adjective', 'Clear, logical, and convincing', 43, 3, true, 'sat_high_frequency'),
  ('commensurate', 'adj', 'adjective', 'Corresponding in size or degree', 44, 3, true, 'sat_high_frequency'),
  ('compelling', 'adj', 'adjective', 'Evoking interest or attention powerfully', 45, 1, true, 'sat_high_frequency'),
  ('complacent', 'adj', 'adjective', 'Self-satisfied and unaware of danger', 46, 2, true, 'sat_high_frequency'),
  ('conciliatory', 'adj', 'adjective', 'Intended to end a disagreement', 47, 3, true, 'sat_high_frequency'),
  ('concise', 'adj', 'adjective', 'Giving information clearly in few words', 48, 1, true, 'sat_high_frequency'),
  ('concur', 'v', 'verb', 'To agree', 49, 2, true, 'sat_high_frequency'),
  ('condone', 'v', 'verb', 'To accept or allow behavior considered wrong', 50, 2, true, 'sat_high_frequency'),
  ('congenial', 'adj', 'adjective', 'Pleasant, agreeable, and suited to one''s taste', 51, 2, true, 'sat_high_frequency'),
  ('conjecture', 'n', 'noun', 'An opinion formed without full proof', 52, 2, true, 'sat_high_frequency'),
  ('contentious', 'adj', 'adjective', 'Likely to cause disagreement', 53, 2, true, 'sat_high_frequency'),
  ('conventional', 'adj', 'adjective', 'Based on what is generally done or believed', 54, 1, true, 'sat_high_frequency'),
  ('corroborate', 'v', 'verb', 'To confirm a statement with new evidence', 55, 3, true, 'sat_high_frequency'),
  ('credible', 'adj', 'adjective', 'Able to be believed', 56, 1, true, 'sat_high_frequency'),
  ('cursory', 'adj', 'adjective', 'Hasty and not thorough', 57, 3, true, 'sat_high_frequency'),
  ('cynical', 'adj', 'adjective', 'Distrustful of people''s stated motives', 58, 1, true, 'sat_high_frequency'),
  ('daunting', 'adj', 'adjective', 'Seeming difficult to deal with', 59, 1, true, 'sat_high_frequency'),
  ('debilitate', 'v', 'verb', 'To make someone weak', 60, 3, true, 'sat_high_frequency'),
  ('decorum', 'n', 'noun', 'Behavior in keeping with good taste', 61, 3, true, 'sat_high_frequency'),
  ('deference', 'n', 'noun', 'Respectful submission to someone''s wishes', 62, 3, true, 'sat_high_frequency'),
  ('deleterious', 'adj', 'adjective', 'Causing harm, often in a gradual way', 63, 3, true, 'sat_high_frequency'),
  ('denounce', 'v', 'verb', 'To publicly declare something wrong', 64, 2, true, 'sat_high_frequency'),
  ('deplete', 'v', 'verb', 'To use up the supply of something', 65, 1, true, 'sat_high_frequency'),
  ('deride', 'v', 'verb', 'To express contempt for someone or something', 66, 3, true, 'sat_high_frequency'),
  ('despondent', 'adj', 'adjective', 'In low spirits from loss of hope', 67, 2, true, 'sat_high_frequency'),
  ('deter', 'v', 'verb', 'To discourage someone from doing something', 68, 1, true, 'sat_high_frequency'),
  ('detrimental', 'adj', 'adjective', 'Tending to cause harm or damage', 69, 2, true, 'sat_high_frequency'),
  ('diligent', 'adj', 'adjective', 'Showing steady effort and care in one''s work', 70, 1, true, 'sat_high_frequency'),
  ('diminish', 'v', 'verb', 'To make or become less', 71, 1, true, 'sat_high_frequency'),
  ('discern', 'v', 'verb', 'To perceive or recognize something clearly', 72, 2, true, 'sat_high_frequency'),
  ('discord', 'n', 'noun', 'Disagreement between people', 73, 2, true, 'sat_high_frequency'),
  ('discrepancy', 'n', 'noun', 'A difference between things that should match', 74, 2, true, 'sat_high_frequency'),
  ('disdain', 'n', 'noun', 'A feeling of contempt for someone unworthy', 75, 2, true, 'sat_high_frequency'),
  ('disparage', 'v', 'verb', 'To speak of someone in a negative way', 76, 3, true, 'sat_high_frequency'),
  ('disperse', 'v', 'verb', 'To scatter in different directions', 77, 1, true, 'sat_high_frequency'),
  ('disseminate', 'v', 'verb', 'To spread information widely', 78, 2, true, 'sat_high_frequency'),
  ('dissonance', 'n', 'noun', 'A lack of harmony between ideas or sounds', 79, 3, true, 'sat_high_frequency'),
  ('dogmatic', 'adj', 'adjective', 'Asserting opinions as if undeniably true', 80, 3, true, 'sat_high_frequency'),
  ('dubious', 'adj', 'adjective', 'Hesitating or doubting', 81, 2, true, 'sat_high_frequency'),
  ('eccentric', 'adj', 'adjective', 'Unconventional and slightly odd', 82, 1, true, 'sat_high_frequency'),
  ('eclectic', 'adj', 'adjective', 'Drawing from a broad range of sources', 83, 2, true, 'sat_high_frequency'),
  ('elaborate', 'adj', 'adjective', 'Detailed and complicated', 84, 1, true, 'sat_high_frequency'),
  ('elicit', 'v', 'verb', 'To draw out a response or reaction', 85, 2, true, 'sat_high_frequency'),
  ('eloquent', 'adj', 'adjective', 'Fluent and persuasive in speech or writing', 86, 1, true, 'sat_high_frequency'),
  ('elusive', 'adj', 'adjective', 'Difficult to find, catch, or achieve', 87, 1, true, 'sat_high_frequency'),
  ('embellish', 'v', 'verb', 'To make something more attractive by adding detail', 88, 2, true, 'sat_high_frequency'),
  ('emulate', 'v', 'verb', 'To try to match or surpass by imitation', 89, 2, true, 'sat_high_frequency'),
  ('endorse', 'v', 'verb', 'To declare public approval of something', 90, 1, true, 'sat_high_frequency'),
  ('enigma', 'n', 'noun', 'A person or thing that is hard to understand', 91, 2, true, 'sat_high_frequency'),
  ('ephemeral', 'adj', 'adjective', 'Lasting for a very short time', 92, 3, true, 'sat_high_frequency'),
  ('equanimity', 'n', 'noun', 'Mental calm in a difficult situation', 93, 3, true, 'sat_high_frequency'),
  ('equivocal', 'adj', 'adjective', 'Open to more than one interpretation', 94, 3, true, 'sat_high_frequency'),
  ('erratic', 'adj', 'adjective', 'Not consistent or predictable', 95, 1, true, 'sat_high_frequency'),
  ('erroneous', 'adj', 'adjective', 'Wrong; incorrect', 96, 2, true, 'sat_high_frequency'),
  ('esoteric', 'adj', 'adjective', 'Understood by only a small number of people', 97, 3, true, 'sat_high_frequency'),
  ('euphemism', 'n', 'noun', 'A mild word used in place of a harsh one', 98, 2, true, 'sat_high_frequency'),
  ('exacerbate', 'v', 'verb', 'To make a problem worse', 99, 2, true, 'sat_high_frequency'),
  ('exemplary', 'adj', 'adjective', 'Serving as a desirable model', 100, 1, true, 'sat_high_frequency'),
  ('exhaustive', 'adj', 'adjective', 'Thorough and complete', 101, 1, true, 'sat_high_frequency'),
  ('exonerate', 'v', 'verb', 'To clear someone of blame', 102, 2, true, 'sat_high_frequency'),
  ('extraneous', 'adj', 'adjective', 'Irrelevant to the subject at hand', 103, 2, true, 'sat_high_frequency'),
  ('facetious', 'adj', 'adjective', 'Joking about something meant to be serious', 104, 3, true, 'sat_high_frequency'),
  ('fallacy', 'n', 'noun', 'A mistaken belief based on faulty reasoning', 105, 2, true, 'sat_high_frequency'),
  ('fastidious', 'adj', 'adjective', 'Very attentive to detail; hard to please', 106, 3, true, 'sat_high_frequency'),
  ('feasible', 'adj', 'adjective', 'Possible to do easily or conveniently', 107, 1, true, 'sat_high_frequency'),
  ('fervent', 'adj', 'adjective', 'Showing intense and passionate feeling', 108, 2, true, 'sat_high_frequency'),
  ('fickle', 'adj', 'adjective', 'Changing often, especially in loyalty', 109, 1, true, 'sat_high_frequency'),
  ('flippant', 'adj', 'adjective', 'Not showing proper seriousness', 110, 3, true, 'sat_high_frequency'),
  ('formidable', 'adj', 'adjective', 'Inspiring fear or respect through being impressive', 111, 1, true, 'sat_high_frequency'),
  ('fortuitous', 'adj', 'adjective', 'Happening by a lucky chance', 112, 2, true, 'sat_high_frequency'),
  ('frivolous', 'adj', 'adjective', 'Lacking any serious purpose', 113, 1, true, 'sat_high_frequency'),
  ('futile', 'adj', 'adjective', 'Incapable of producing a useful result', 114, 1, true, 'sat_high_frequency'),
  ('garrulous', 'adj', 'adjective', 'Excessively talkative', 115, 3, true, 'sat_high_frequency'),
  ('genuine', 'adj', 'adjective', 'Truly what it appears to be', 116, 1, true, 'sat_high_frequency'),
  ('hackneyed', 'adj', 'adjective', 'Lacking freshness from overuse', 117, 3, true, 'sat_high_frequency'),
  ('haphazard', 'adj', 'adjective', 'Lacking any order or plan', 118, 1, true, 'sat_high_frequency'),
  ('hedonistic', 'adj', 'adjective', 'Devoted to the pursuit of pleasure', 119, 2, true, 'sat_high_frequency'),
  ('hierarchy', 'n', 'noun', 'A system of ranking people or things', 120, 1, true, 'sat_high_frequency'),
  ('hypothetical', 'adj', 'adjective', 'Based on a suggested idea rather than known fact', 121, 1, true, 'sat_high_frequency'),
  ('idiosyncratic', 'adj', 'adjective', 'Peculiar to a particular person', 122, 3, true, 'sat_high_frequency'),
  ('impartial', 'adj', 'adjective', 'Treating all sides equally', 123, 1, true, 'sat_high_frequency'),
  ('imperative', 'adj', 'adjective', 'Of vital importance', 124, 1, true, 'sat_high_frequency'),
  ('impetuous', 'adj', 'adjective', 'Acting quickly without careful thought', 125, 3, true, 'sat_high_frequency'),
  ('implausible', 'adj', 'adjective', 'Not seeming reasonable or likely', 126, 2, true, 'sat_high_frequency'),
  ('impromptu', 'adj', 'adjective', 'Done without preparation', 127, 1, true, 'sat_high_frequency'),
  ('inadvertent', 'adj', 'adjective', 'Unintentional', 128, 2, true, 'sat_high_frequency'),
  ('incessant', 'adj', 'adjective', 'Continuing without pause', 129, 2, true, 'sat_high_frequency'),
  ('incite', 'v', 'verb', 'To stir someone into action, often violent', 130, 2, true, 'sat_high_frequency'),
  ('incongruous', 'adj', 'adjective', 'Out of place; not fitting the surroundings', 131, 3, true, 'sat_high_frequency'),
  ('indignant', 'adj', 'adjective', 'Angry over something seen as unfair', 132, 2, true, 'sat_high_frequency'),
  ('indolent', 'adj', 'adjective', 'Avoiding activity; lazy', 133, 3, true, 'sat_high_frequency'),
  ('inevitable', 'adj', 'adjective', 'Certain to happen', 134, 1, true, 'sat_high_frequency'),
  ('infer', 'v', 'verb', 'To reach a conclusion from evidence and reasoning', 135, 1, true, 'sat_high_frequency'),
  ('innate', 'adj', 'adjective', 'Present from birth; natural', 136, 2, true, 'sat_high_frequency'),
  ('innocuous', 'adj', 'adjective', 'Not harmful or offensive', 137, 2, true, 'sat_high_frequency'),
  ('insipid', 'adj', 'adjective', 'Lacking flavor, spirit, or interest', 138, 3, true, 'sat_high_frequency'),
  ('instigate', 'v', 'verb', 'To bring about or set in motion', 139, 2, true, 'sat_high_frequency'),
  ('integral', 'adj', 'adjective', 'Necessary to make a whole complete', 140, 1, true, 'sat_high_frequency'),
  ('intrepid', 'adj', 'adjective', 'Fearless and adventurous', 141, 2, true, 'sat_high_frequency'),
  ('intricate', 'adj', 'adjective', 'Very complicated or detailed', 142, 1, true, 'sat_high_frequency'),
  ('intuitive', 'adj', 'adjective', 'Based on instinct rather than reasoning', 143, 1, true, 'sat_high_frequency'),
  ('inundate', 'v', 'verb', 'To overwhelm with things to deal with', 144, 2, true, 'sat_high_frequency'),
  ('irrefutable', 'adj', 'adjective', 'Impossible to deny or disprove', 145, 2, true, 'sat_high_frequency'),
  ('jubilant', 'adj', 'adjective', 'Feeling or showing great happiness', 146, 1, true, 'sat_high_frequency'),
  ('juxtapose', 'v', 'verb', 'To place things side by side for contrast', 147, 3, true, 'sat_high_frequency'),
  ('lament', 'v', 'verb', 'To express sorrow or regret about something', 148, 2, true, 'sat_high_frequency'),
  ('latent', 'adj', 'adjective', 'Present but not yet developed or visible', 149, 2, true, 'sat_high_frequency'),
  ('laudable', 'adj', 'adjective', 'Deserving praise', 150, 3, true, 'sat_high_frequency'),
  ('lethargic', 'adj', 'adjective', 'Lacking energy; sluggish', 151, 1, true, 'sat_high_frequency'),
  ('lucid', 'adj', 'adjective', 'Clearly expressed and easy to follow', 152, 2, true, 'sat_high_frequency'),
  ('malleable', 'adj', 'adjective', 'Easily shaped, persuaded, or influenced', 153, 2, true, 'sat_high_frequency'),
  ('mandate', 'n', 'noun', 'An official order or authorization', 154, 1, true, 'sat_high_frequency'),
  ('meager', 'adj', 'adjective', 'Small in amount; lacking in substance', 155, 2, true, 'sat_high_frequency'),
  ('meticulous', 'adj', 'adjective', 'Very careful and precise about details', 156, 1, true, 'sat_high_frequency'),
  ('mitigate', 'v', 'verb', 'To make a problem or its effects less severe', 157, 2, true, 'sat_high_frequency'),
  ('mundane', 'adj', 'adjective', 'Ordinary and lacking excitement', 158, 1, true, 'sat_high_frequency'),
  ('myriad', 'n', 'noun', 'A very great number of things', 159, 2, true, 'sat_high_frequency'),
  ('naive', 'adj', 'adjective', 'Showing a lack of experience or judgment', 160, 1, true, 'sat_high_frequency'),
  ('negligent', 'adj', 'adjective', 'Failing to give proper care or attention', 161, 2, true, 'sat_high_frequency'),
  ('nostalgic', 'adj', 'adjective', 'Feeling sentimental longing for the past', 162, 1, true, 'sat_high_frequency'),
  ('notorious', 'adj', 'adjective', 'Well known for something bad', 163, 1, true, 'sat_high_frequency'),
  ('novice', 'n', 'noun', 'A person new to a skill or activity', 164, 1, true, 'sat_high_frequency'),
  ('nuance', 'n', 'noun', 'A subtle difference in meaning or tone', 165, 1, true, 'sat_high_frequency'),
  ('objective', 'adj', 'adjective', 'Based on facts rather than personal feelings', 166, 1, true, 'sat_high_frequency'),
  ('obscure', 'adj', 'adjective', 'Not well known, or hard to understand', 167, 1, true, 'sat_high_frequency'),
  ('obsolete', 'adj', 'adjective', 'No longer in use or production', 168, 1, true, 'sat_high_frequency'),
  ('obstinate', 'adj', 'adjective', 'Stubbornly unwilling to change one''s mind', 169, 3, true, 'sat_high_frequency'),
  ('opaque', 'adj', 'adjective', 'Impossible to see through, or hard to understand', 170, 2, true, 'sat_high_frequency'),
  ('optimal', 'adj', 'adjective', 'The best or most favorable option', 171, 1, true, 'sat_high_frequency'),
  ('ostentatious', 'adj', 'adjective', 'Showy; meant to impress others', 172, 3, true, 'sat_high_frequency'),
  ('paradox', 'n', 'noun', 'A statement that seems contradictory but may be true', 173, 2, true, 'sat_high_frequency'),
  ('paramount', 'adj', 'adjective', 'More important than anything else', 174, 2, true, 'sat_high_frequency'),
  ('partisan', 'adj', 'adjective', 'Strongly favoring one side of a dispute', 175, 1, true, 'sat_high_frequency'),
  ('paucity', 'n', 'noun', 'A smaller amount of something than is needed', 176, 3, true, 'sat_high_frequency'),
  ('pensive', 'adj', 'adjective', 'Deep in serious or wistful thought', 177, 2, true, 'sat_high_frequency'),
  ('perpetuate', 'v', 'verb', 'To make something continue indefinitely', 178, 2, true, 'sat_high_frequency'),
  ('pervasive', 'adj', 'adjective', 'Present and spreading throughout a place', 179, 2, true, 'sat_high_frequency'),
  ('plausible', 'adj', 'adjective', 'Seeming reasonable or believable', 180, 1, true, 'sat_high_frequency'),
  ('plethora', 'n', 'noun', 'An excessive or overabundant amount', 181, 2, true, 'sat_high_frequency'),
  ('pragmatic', 'adj', 'adjective', 'Dealing with things in a sensible, practical way', 182, 1, true, 'sat_high_frequency'),
  ('precarious', 'adj', 'adjective', 'Not securely held; likely to fail or fall', 183, 2, true, 'sat_high_frequency'),
  ('precedent', 'n', 'noun', 'An earlier event used as a guide for later ones', 184, 1, true, 'sat_high_frequency'),
  ('precocious', 'adj', 'adjective', 'Showing adult qualities at an unusually early age', 185, 3, true, 'sat_high_frequency'),
  ('prevalent', 'adj', 'adjective', 'Widespread at a particular time or place', 186, 1, true, 'sat_high_frequency'),
  ('pristine', 'adj', 'adjective', 'In its original, unspoiled condition', 187, 1, true, 'sat_high_frequency'),
  ('profound', 'adj', 'adjective', 'Very deep or intense; showing great insight', 188, 1, true, 'sat_high_frequency'),
  ('prolific', 'adj', 'adjective', 'Producing a large amount of work or output', 189, 2, true, 'sat_high_frequency'),
  ('prudent', 'adj', 'adjective', 'Careful and sensible, especially about the future', 190, 2, true, 'sat_high_frequency'),
  ('quandary', 'n', 'noun', 'A state of not knowing what to do', 191, 3, true, 'sat_high_frequency'),
  ('rebuttal', 'n', 'noun', 'An argument made in response to an opposing claim', 192, 1, true, 'sat_high_frequency'),
  ('reciprocate', 'v', 'verb', 'To respond to an action with a similar one', 193, 2, true, 'sat_high_frequency'),
  ('reticent', 'adj', 'adjective', 'Reluctant to reveal thoughts or feelings', 194, 3, true, 'sat_high_frequency'),
  ('rhetoric', 'n', 'noun', 'Language designed to persuade or impress', 195, 2, true, 'sat_high_frequency'),
  ('rudimentary', 'adj', 'adjective', 'Basic and undeveloped', 196, 2, true, 'sat_high_frequency'),
  ('scrutinize', 'v', 'verb', 'To examine something closely and carefully', 197, 2, true, 'sat_high_frequency'),
  ('skeptical', 'adj', 'adjective', 'Having doubts about a claim', 198, 1, true, 'sat_high_frequency'),
  ('sporadic', 'adj', 'adjective', 'Happening at irregular intervals', 199, 2, true, 'sat_high_frequency'),
  ('tenacious', 'adj', 'adjective', 'Holding on firmly; not easily giving up', 200, 2, true, 'sat_high_frequency')
on conflict (word, type) do update set
  part_of_speech = excluded.part_of_speech,
  definition = excluded.definition,
  frequency_rank = excluded.frequency_rank,
  tier = excluded.tier,
  verified = excluded.verified,
  source = excluded.source,
  updated_at = now();

-- Ensure every definition starts with a capital letter.
update public.vocabulary
set
  definition = upper(left(definition, 1)) || substr(definition, 2),
  updated_at = now()
where definition ~ '^[a-z]';
