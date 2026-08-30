-- Restore formatting and structure lost when these official SAT items were
-- imported from PDF text. The invisible separator pair is rendered as an
-- underline by MathText, while remaining invisible before the UI deploy.

update public.questions
set stem = 'Swahili is estimated to be the first language of up to 15 million people worldwide. It’s also an officially recognized language in Tanzania, Kenya, and the Democratic Republic of the Congo, which means these countries use Swahili in government documents and proceedings. [[But even in countries where almost everyone speaks Swahili, for many it isn''t their first language but is instead their second, third, or even fourth language.]] Which choice most effectively uses data from the table to support the underlined claim?',
    graph_spec = $$
      {"type":"data_table","title":"Swahili Speakers in Three African Countries","columns":["Country","Approximate number of speakers (in millions)","Estimated % of population"],"rows":[["Democratic Republic of the Congo","22","25"],["Kenya","55","100"],["Tanzania","61","100"]]}
    $$::jsonb
where question_id = '01c1d9ee';

update public.questions
set stem = 'A member of the Otomi, an Indigenous people in Central Mexico, Octavio Medellín immigrated to the United States as a child, and his sculpture bears the impress of traditions on both sides of the border: US-based modernist sculpture, Mexican modernist painting, Otomi art, and the ancient sculpture of other Mexican Indigenous peoples, including the Maya. [[In his 1950 masterpiece History of Mexico, Medellín fuses these influences into a style so idiosyncratic that it resists efforts to view his work through the lens of nationality or cultural identity.]] Artists, he insisted, should strive for individual expression, even as they draw inspiration from their heritage and the communities where they live and work. Which quotation from an art critic most directly challenges the underlined claim in the text?'
where question_id = '378c66d5';

update public.questions
set stem = 'Genetic studies have led researchers to suggest that turtles are most closely related to the group that includes modern crocodiles. But studies of fossils have suggested instead that turtles are most closely related to other groups, such as the one that contains modern snakes. [[However, many of the fossil studies have relied on incomplete data sets.]] For a 2022 investigation, biologist Tiago R. Simões and colleagues examined more than 1,000 reptile fossils collected worldwide. From this large data set, they found clear agreement with the results of the genetic studies. Which choice best describes the function of the underlined sentence?'
where question_id = '02e49a0c';

update public.questions
set stem = 'Industrial activity is often assumed to be a threat to wildlife, but that isn’t always so. [[Consider the silver-studded blue butterfly (Plebejus argus): as forest growth has reduced grasslands in northern Germany, many of these butterflies have left meadow habitats and are now thriving in active limestone quarries.]] In a survey of multiple active quarries and patches of maintained grassland, an ecologist found silver-studded blue butterflies in 100% of the quarries but only 57% of the grassland patches. Moreover, butterfly populations in the quarries were four times larger than those in the meadows. Which choice best describes the function of the underlined portion in the text as a whole?'
where question_id = '590f0ad2';

update public.questions
set stem = 'Researchers have found a nearly 164,000-year-old molar from a member of the archaic human species known as Denisovans in a cave in Laos, suggesting that Denisovans lived in a wider range of environments than indicated by earlier evidence. [[Before the discovery, Denisovans were thought to have lived only at high altitudes in relatively cold climates in what are now Russia and China,]] but the discovery of the tooth in Laos suggests that they may have lived at low altitudes in relatively warm climates in Southeast Asia as well. Which choice best states the function of the underlined portion in the text as a whole?'
where question_id = '066a3295';

update public.questions
set stem = 'A student is researching the number of visits each year to two museums, the National Museum of the American Indian and the National Museum of African American History and Culture. Of the four years included in the table, the year when both museums had the highest number of visits was ______ Which choice most effectively uses data from the table to complete the statement?',
    graph_spec = $$
      {"type":"data_table","title":"Number of Museum Visits (in Millions) from 2016 to 2019","columns":["Museum","2016","2017","2018","2019"],"rows":[["National Museum of the American Indian","1.1","1.2","1.1","0.96"],["National Museum of African American History and Culture","0.73","2.4","1.9","2.0"]]}
    $$::jsonb
where question_id = 'a04807d8';

update public.questions
set stem = 'In present-day Chiapas, Mexico, archaeologist Robert Rosenswig, remote-sensing specialist Ricardo López-Torrijos, and colleagues have located 41 smaller settlements surrounding the ancient Mesoamerican city of Izapa. The researchers have concluded that these settlements were culturally linked to Izapa because each of the settlements is the same age and configured in the same manner as Izapa, with a pyramid to the north and a plaza to the south. Their shared structural orientation suggests that residents of the settlements likely performed some of the same cultural ceremonies as residents in Izapa did. Which choice best states the main idea of the text?',
    choices = '{"A":"Researchers have determined that the arrangement of Izapa’s structures was based on those of other nearby settlements.","B":"Cultural ceremonies in Izapa seem to have played a more important role for its residents than those in smaller, surrounding settlements did.","C":"Although archaeologists have learned much about Izapa over years of research, they have only recently found the smaller settlements that surrounded it.","D":"Researchers have inferred that Izapa was related to the smaller settlements that surrounded it based in part on the similarity of their construction."}'::jsonb
where question_id = '04dff083';

update public.questions
set stem = 'Text 1 Graphic novels are increasingly popular in bookstores and libraries, but they shouldn’t be classified as literature. By definition, literature tells a story or conveys meaning through language only; graphic novels tell stories through illustrations and use language only sparingly, in captions and dialogue. Graphic novels are experienced as series of images and not as language, making them more similar to film than to literature. Text 2 Graphic novels present their stories through both language and images. Without captions and dialogue, readers would be unable to understand what is depicted in the illustrations: the story results from the interaction of text and image. Moreover, Alison Bechdel’s Fun Home and many other graphic novels feature text that is as beautifully written as the prose found in many standard novels. Therefore, graphic novels qualify as literary texts. Based on the texts, how would the author of Text 2 most likely respond to the overall argument presented in Text 1?',
    choices = '{"A":"By asserting that language plays a more important role in graphic novels than the author of Text 1 recognizes","B":"By acknowledging that the author of Text 1 has identified a flaw that is common to all graphic novels","C":"By suggesting that the story lines of certain graphic novels are more difficult to understand than the author of Text 1 claims","D":"By agreeing with the author of Text 1 that most graphic novels aren’t as well crafted as most literary works are"}'::jsonb
where question_id = '059f7201';

update public.questions
set stem = replace(replace(stem, '[[', chr(8291)), ']]', chr(8291))
where question_id in ('01c1d9ee', '378c66d5', '02e49a0c', '590f0ad2', '066a3295');
