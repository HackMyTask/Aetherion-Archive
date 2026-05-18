import { EntityType } from '../../types/entity.js';

export interface EntityPrompt {
  role: string;
  creationGuidelines: string[];
  attributeFocus: string[];
  relationshipHints: string[];
  jsonExample: string;
}

function kingdomsPrompt(): EntityPrompt {
  return {
    role: 'You are generating a kingdom in a fantasy world recovering from a cosmic catastrophe.',
    creationGuidelines: [
      'The entity name MUST be exactly as provided. Do not rename, translate, or replace it.',
      'Set the campaign in Northern Velkaris — a region of frozen ruins, isolation, and dying kingdoms.',
      'Weave in themes: frozen ruins, isolation, celestial corruption, dying kingdoms, forbidden moon rituals.',
      'Describe the kingdom\'s geography, culture, and political structure',
      'Explain how the Celestial Fracture affected this kingdom',
      'Define its stance on magic use (soul cost)',
      'Include economic base and major exports',
      'Describe relationships with neighboring kingdoms',
    ],
    attributeFocus: ['capital', 'leader', 'government_type', 'founding_date', 'population', 'region'],
    relationshipHints: [
      'Output a minimum of 4 relationships',
      'If existing canon entities are provided in context, at least 2 relationships MUST reference existing canon entities by their exact slugs',
      'If no existing entities exist to reference, use placeholder targets such as "northern-velkaris" (region), "the-celestial-fracture" (event), or faction/religion/city names that would logically exist',
      'Consider declaring war, alliance, trade, or vassalage with existing kingdoms',
    ],
    jsonExample: `{
  "name": "Example Kingdom Name",
  "description": "A dying kingdom in Northern Velkaris, slowly freezing under celestial corruption.",
  "capital": "Frostfall Citadel",
  "leader": "King Edric the Pale",
  "government_type": "feudal_monarchy",
  "founding_date": "Second Age, Year 734",
  "population": 45000,
  "region": "Northern Velkaris",
  "relationships": [
    { "targetId": "northern-velkaris", "type": "located-in", "label": "The kingdom is located in the frozen reaches of Northern Velkaris", "bidirectional": false },
    { "targetId": "the-celestial-fracture", "type": "scarred-by", "label": "The Celestial Fracture devastated this kingdom", "bidirectional": false }
  ]
}`,
  };
}

function factionsPrompt(): EntityPrompt {
  return {
    role: 'You are generating a faction — an organization with shared goals in a fractured fantasy world.',
    creationGuidelines: [
      'The entity name MUST be exactly as provided. Do not rename, translate, or replace it.',
      'Set the campaign in Northern Velkaris — a region of frozen ruins, isolation, and dying kingdoms.',
      'Weave in themes: frozen ruins, isolation, celestial corruption, dying kingdoms, forbidden moon rituals.',
      'Define the faction\'s core ideology and goals',
      'Describe their membership and recruitment',
      'Explain their relationship to the Fracture and magic',
      'Include their methods (diplomatic, militant, scholarly)',
      'Describe their base of operations',
    ],
    attributeFocus: ['ideology', 'leader', 'headquarters', 'membership_size', 'founding_date', 'methods'],
    relationshipHints: [
      'Output a minimum of 3 relationships',
      'If existing canon entities are provided in context, at least 1 relationship MUST reference an existing canon entity by its exact slug',
      'If no existing entities exist to reference, use placeholder targets such as "northern-velkaris" (region), "the-celestial-fracture" (event), or kingdom/god names that would logically exist',
      'Connect to existing kingdoms, other factions, or religions',
    ],
    jsonExample: `{
  "name": "Example Faction Name",
  "description": "A secretive cult operating in the frozen ruins of Northern Velkaris.",
  "ideology": "Power through forbidden moon rituals",
  "leader": "Shard-Priest Malvorn",
  "headquarters": "The Sunken Vault",
  "membership_size": 300,
  "founding_date": "Age of Fractured Light, Year 15",
  "methods": ["ritual_sacrifice", "soul_binding", "covert_infiltration"],
  "relationships": [
    { "targetId": "northern-velkaris", "type": "operates-in", "label": "The faction operates in the frozen ruins of Northern Velkaris", "bidirectional": false },
    { "targetId": "the-celestial-fracture", "type": "born-from", "label": "The faction formed after the Celestial Fracture", "bidirectional": false }
  ]
}`,
  };
}

function godsPrompt(): EntityPrompt {
  return {
    role: 'You are generating a deity in a pantheon-shaped fantasy world.',
    creationGuidelines: [
      'The entity name MUST be exactly as provided. Do not rename, translate, or replace it.',
      'Set the campaign in Northern Velkaris — a region of frozen ruins, isolation, and dying kingdoms.',
      'Weave in themes: frozen ruins, isolation, celestial corruption, dying kingdoms, forbidden moon rituals.',
      'Define the god\'s domain and portfolio',
      'Describe their alignment and personality',
      'Include a concise 1-2 sentence summary as the "description" field',
      'Explain their role during and after the Celestial Fracture',
      'Include symbols, rituals, and clergy structure',
      'Describe rivalries or alliances with other gods',
    ],
    attributeFocus: ['domain', 'alignment', 'symbol', 'clergy', 'holy_city'],
    relationshipHints: [
      'Output a minimum of 2 relationships',
      'If existing canon entities are provided in context, at least 1 relationship MUST reference an existing canon entity by its exact slug',
      'If no existing entities exist to reference, use placeholder targets such as "northern-velkaris" (region), "the-celestial-fracture" (event), "forbidden-moon-rituals" (concept), or a faction/religion name that would logically exist',
      'Connect to existing religions, other gods, or factions that worship them',
    ],
    jsonExample: `{
  "name": "Example Deity Name",
  "description": "A god of celestial decay who rules the frozen ruins of Northern Velkaris.",
  "domain": "Frozen decay, isolation, corrupted moonlight",
  "alignment": "chaotic_neutral",
  "symbol": "A cracked crystal refracting a single beam",
  "clergy": "Mendicant scholars who collect memories",
  "holy_city": "The Luminary Ruins",
  "relationships": [
    { "targetId": "northern-velkaris", "type": "watches-over", "label": "Vel-Thara watches over the frozen ruins of Northern Velkaris", "bidirectional": false },
    { "targetId": "the-celestial-fracture", "type": "born-from", "label": "Born from the spiritual fallout of the Celestial Fracture", "bidirectional": false }
  ]
}`,
  };
}

function artifactsPrompt(): EntityPrompt {
  return {
    role: 'You are generating a magical artifact born from the Celestial Fracture.',
    creationGuidelines: [
      'The entity name MUST be exactly as provided. Do not rename, translate, or replace it.',
      'Set the campaign in Northern Velkaris — a region of frozen ruins, isolation, and dying kingdoms.',
      'Weave in themes: frozen ruins, isolation, celestial corruption, dying kingdoms, forbidden moon rituals.',
      'Describe the artifact\'s origin and creation',
      'Define its power and limitations',
      'Explain the cost of using it (soul price)',
      'Describe its physical appearance',
      'Mention its current wielder or location',
      'Include any curses or drawbacks',
    ],
    attributeFocus: ['power', 'origin', 'material', 'wielder', 'location', 'soul_cost', 'curse'],
    relationshipHints: [
      'Output a minimum of 2 relationships',
      'If existing canon entities are provided in context, at least 1 relationship MUST reference an existing canon entity by its exact slug',
      'If no existing entities exist to reference, use placeholder targets such as "northern-velkaris" (region), "the-celestial-fracture" (event), or wielder/kingdom names that would logically exist',
      'Link to the event that created it, its wielder, or where it was found',
    ],
    jsonExample: `{
  "name": "Example Artifact Name",
  "description": "A fragment of frozen moonlight imbued with forbidden memory magic.",
  "power": "Can reconstruct memories of the dead",
  "origin": "Forged from a fragment of the fractured moon",
  "material": "Lunar crystal and solidified twilight",
  "wielder": "Shard-Priest Malvorn",
  "location": "Northern Velkaris",
  "soul_cost": "One year of memory per use",
  "curse": "User slowly loses sense of self",
  "relationships": [
    { "targetId": "northern-velkaris", "type": "found-in", "label": "The artifact was discovered in the frozen ruins of Northern Velkaris", "bidirectional": false }
  ]
}`,
  };
}

function spellsPrompt(): EntityPrompt {
  return {
    role: 'You are generating a spell unique to this world\'s soul-based magic system.',
    creationGuidelines: [
      'The entity name MUST be exactly as provided. Do not rename, translate, or replace it.',
      'Set the campaign in Northern Velkaris — a region of frozen ruins, isolation, and dying kingdoms.',
      'Weave in themes: frozen ruins, isolation, celestial corruption, dying kingdoms, forbidden moon rituals.',
      'Describe the incantation and components',
      'Explain the effect and limitations',
      'Detail the soul cost (minor/major/severe)',
      'Specify school of magic',
      'Mention who discovered or commonly uses it',
    ],
    attributeFocus: ['school', 'power', 'cost', 'components', 'range', 'duration', 'discovered_by'],
    relationshipHints: [
      'Output a minimum of 2 relationships',
      'If existing canon entities are provided in context, at least 1 relationship MUST reference an existing canon entity by its exact slug',
      'If no existing entities exist to reference, use placeholder targets such as "northern-velkaris" (region), "the-celestial-fracture" (event), or mage/faction names that would logically exist',
      'Connect to the mage or faction that uses it, or the event of its discovery',
    ],
    jsonExample: `{
  "name": "Example Spell Name",
  "description": "A forbidden moon ritual that erases the caster's memories for power.",
  "school": "Soulmancy",
  "power": "major",
  "cost": "One month of lifespan",
  "components": "A fragment of moon crystal, spoken incantation",
  "range": "Touch",
  "duration": "Permanent",
  "discovered_by": "The Oathbound Remnants",
  "relationships": [
    { "targetId": "northern-velkaris", "type": "practiced-in", "label": "This spell is commonly practiced in the frozen reaches of Northern Velkaris", "bidirectional": false }
  ]
}`,
  };
}

function eventsPrompt(): EntityPrompt {
  return {
    role: 'You are generating a significant historical event in this fantasy world.',
    creationGuidelines: [
      'The entity name MUST be exactly as provided. Do not rename, translate, or replace it.',
      'Set the campaign in Northern Velkaris — a region of frozen ruins, isolation, and dying kingdoms.',
      'Weave in themes: frozen ruins, isolation, celestial corruption, dying kingdoms, forbidden moon rituals.',
      'Define the date relative to the Celestial Fracture (BF or AF)',
      'Describe the event\'s causes and consequences',
      'List participants and affected regions',
      'Explain impact on magic and society',
      'Connect to the timeline',
    ],
    attributeFocus: ['date', 'participants', 'location', 'impact', 'significance', 'aftermath'],
    relationshipHints: [
      'Output a minimum of 3 relationships',
      'If existing canon entities are provided in context, at least 1 relationship MUST reference an existing canon entity by its exact slug',
      'If no existing entities exist to reference, use placeholder targets such as "northern-velkaris" (region), "the-celestial-fracture" (event), or kingdom/god names that would logically exist',
      'Connect to entities that participated or were affected',
    ],
    jsonExample: `{
  "name": "Example Event Name",
  "description": "A catastrophic ritual that shattered the last standing kingdom in Northern Velkaris.",
  "date": "47 AF (After Fracture)",
  "participants": ["Valdenmoor", "The Oathbound Remnants"],
  "location": "Northern Velkaris",
  "impact": "Ended the last resistance against celestial corruption",
  "significance": "major",
  "aftermath": "The kingdom fell to isolation and frozen decay",
  "relationships": [
    { "targetId": "northern-velkaris", "type": "occurred-in", "label": "The event occurred in the frozen wastes of Northern Velkaris", "bidirectional": false }
  ]
}`,
  };
}

function monstersPrompt(): EntityPrompt {
  return {
    role: 'You are generating a monster twisted by the magical fallout of the Celestial Fracture.',
    creationGuidelines: [
      'The entity name MUST be exactly as provided. Do not rename, translate, or replace it.',
      'Set the campaign in Northern Velkaris — a region of frozen ruins, isolation, and dying kingdoms.',
      'Weave in themes: frozen ruins, isolation, celestial corruption, dying kingdoms, forbidden moon rituals.',
      'Describe appearance and behavior',
      'Explain how the Fracture created or changed this creature',
      'Define habitat and hunting patterns',
      'List weaknesses and strengths',
      'Describe any connection to moon fragments',
    ],
    attributeFocus: ['threat_level', 'habitat', 'diet', 'abilities', 'weaknesses', 'fragment_influence'],
    relationshipHints: [
      'Output a minimum of 2 relationships',
      'If existing canon entities are provided in context, at least 1 relationship MUST reference an existing canon entity by its exact slug',
      'If no existing entities exist to reference, use placeholder targets such as "northern-velkaris" (region), "the-celestial-fracture" (event), or kingdom/region names that would logically exist',
      'Connect to regions it hunts, hunters who fight it, or events involving it',
    ],
    jsonExample: `{
  "name": "Example Monster Name",
  "description": "A frost-wreathed beast corrupted by moon fragment exposure in Northern Velkaris.",
  "threat_level": "deadly",
  "habitat": "Northern Velkaris frozen ruins",
  "diet": "Soul essence of living beings",
  "abilities": ["phase_shift", "soul_drain", "crystal_armor"],
  "weaknesses": ["pure_light", "silver_weapons"],
  "fragment_influence": "Empowered by a large moon shard embedded in its chest",
  "relationships": [
    { "targetId": "northern-velkaris", "type": "hunts-in", "label": "The monster stalks the frozen ruins of Northern Velkaris", "bidirectional": false }
  ]
}`,
  };
}

function citiesPrompt(): EntityPrompt {
  return {
    role: 'You are generating a city in a fantasy world reshaped by magical catastrophe.',
    creationGuidelines: [
      'The entity name MUST be exactly as provided. Do not rename, translate, or replace it.',
      'Set the campaign in Northern Velkaris — a region of frozen ruins, isolation, and dying kingdoms.',
      'Weave in themes: frozen ruins, isolation, celestial corruption, dying kingdoms, forbidden moon rituals.',
      'Describe the city\'s founding and history',
      'Explain how the Fracture affected this city',
      'Define its economy and culture',
      'Describe notable districts and landmarks',
      'Mention population demographics',
    ],
    attributeFocus: ['population', 'region', 'ruler', 'founding_date', 'notable_districts', 'economy'],
    relationshipHints: [
      'Output a minimum of 3 relationships',
      'If existing canon entities are provided in context, at least 1 relationship MUST reference an existing canon entity by its exact slug',
      'If no existing entities exist to reference, use placeholder targets such as "northern-velkaris" (region), "the-celestial-fracture" (event), or kingdom/god names that would logically exist',
      'Connect to the kingdom it belongs to, nearby cities, or events it experienced',
    ],
    jsonExample: `{
  "name": "Example City Name",
  "description": "A frozen city in Northern Velkaris, barely surviving under celestial corruption.",
  "population": 12000,
  "region": "Northern Velkaris",
  "ruler": "Lord Commander Aldric Vane",
  "founding_date": "Second Age, Year 890",
  "notable_districts": ["Crystal Market", "The Drowned Quarter", "Spire Ward"],
  "economy": "Moon crystal trade, textiles, magical components",
  "relationships": [
    { "targetId": "northern-velkaris", "type": "located-in", "label": "The city is located in the frozen wastes of Northern Velkaris", "bidirectional": false }
  ]
}`,
  };
}

function religionsPrompt(): EntityPrompt {
  return {
    role: 'You are generating a religion or cult that formed in response to the Celestial Fracture.',
    creationGuidelines: [
      'The entity name MUST be exactly as provided. Do not rename, translate, or replace it.',
      'Set the campaign in Northern Velkaris — a region of frozen ruins, isolation, and dying kingdoms.',
      'Weave in themes: frozen ruins, isolation, celestial corruption, dying kingdoms, forbidden moon rituals.',
      'Describe the core beliefs and tenets',
      'Explain how the Fracture shaped this faith',
      'Define rituals and practices',
      'Describe the clergy hierarchy',
      'Mention holy sites and texts',
    ],
    attributeFocus: ['tenets', 'deity', 'holy_text', 'holy_site', 'clergy_title', 'founding_date', 'rituals'],
    relationshipHints: [
      'Output a minimum of 2 relationships',
      'If existing canon entities are provided in context, at least 1 relationship MUST reference an existing canon entity by its exact slug',
      'If no existing entities exist to reference, use placeholder targets such as "northern-velkaris" (region), "the-celestial-fracture" (event), or god/faction names that would logically exist',
      'Connect to the god they worship, factions aligned with them, or conflicts with other religions',
    ],
    jsonExample: `{
  "name": "Example Religion Name",
  "description": "A forbidden cult worshipping celestial corruption through moon rituals in Northern Velkaris.",
  "tenets": ["The Fracture was a divine warning", "Magic must be used sparingly", "Moon fragments are holy relics"],
  "deity": "Yssara of the Shattered Moon",
  "holy_text": "The Lament of Light",
  "holy_site": "The Temple of Echoes",
  "clergy_title": "Shard-Priest",
  "founding_date": "Age of Fractured Light, Year 3",
  "rituals": ["Daily prayer at moonrise", "Annual Pilgrimage of Shards"],
  "relationships": [
    { "targetId": "northern-velkaris", "type": "practiced-in", "label": "The religion is practiced in the frozen reaches of Northern Velkaris", "bidirectional": false }
  ]
}`,
  };
}

function racesPrompt(): EntityPrompt {
  return {
    role: 'You are generating a sentient race in a fantasy world.',
    creationGuidelines: [
      'The entity name MUST be exactly as provided. Do not rename, translate, or replace it.',
      'Set the campaign in Northern Velkaris — a region of frozen ruins, isolation, and dying kingdoms.',
      'Weave in themes: frozen ruins, isolation, celestial corruption, dying kingdoms, forbidden moon rituals.',
      'Describe physical appearance and lifespan',
      'Explain their culture and societal structure',
      'Detail how the Fracture affected them',
      'Describe their relationship with magic (soul cost)',
      'Mention their homeland and population distribution',
    ],
    attributeFocus: ['lifespan', 'homeland', 'language', 'magic_affinity', 'culture_traits', 'population'],
    relationshipHints: [
      'Output a minimum of 2 relationships',
      'If existing canon entities are provided in context, at least 1 relationship MUST reference an existing canon entity by its exact slug',
      'If no existing entities exist to reference, use placeholder targets such as "northern-velkaris" (region), "the-celestial-fracture" (event), or kingdom/faction names that would logically exist',
      'Connect to kingdoms they inhabit, factions they lead, or conflicts they are in',
    ],
    jsonExample: `{
  "name": "Example Race Name",
  "description": "A hardy race native to the frozen wastes of Northern Velkaris.",
  "lifespan": "200-300 years",
  "homeland": "Northern Velkaris",
  "language": "Old Velkari",
  "magic_affinity": "high",
  "culture_traits": ["resilient", "isolationist", "ritualistic"],
  "population": 50000,
  "relationships": [
    { "targetId": "northern-velkaris", "type": "native-to", "label": "This race is native to the frozen reaches of Northern Velkaris", "bidirectional": false }
  ]
}`,
  };
}

export function getEntityPrompt(entityType: EntityType): EntityPrompt {
  const prompts: Record<EntityType, () => EntityPrompt> = {
    kingdom: kingdomsPrompt,
    faction: factionsPrompt,
    race: racesPrompt,
    god: godsPrompt,
    artifact: artifactsPrompt,
    spell: spellsPrompt,
    event: eventsPrompt,
    monster: monstersPrompt,
    city: citiesPrompt,
    religion: religionsPrompt,
  };
  return prompts[entityType]();
}
