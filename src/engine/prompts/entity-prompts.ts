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
      'Describe the kingdom\'s geography, culture, and political structure',
      'Explain how the Celestial Fracture affected this kingdom',
      'Define its stance on magic use (soul cost)',
      'Include economic base and major exports',
      'Describe relationships with neighboring kingdoms',
    ],
    attributeFocus: ['capital', 'leader', 'government_type', 'founding_date', 'population', 'region'],
    relationshipHints: ['Consider declaring war, alliance, trade, or vassalage with existing kingdoms'],
    jsonExample: `{
      "capital": "Eldoria City",
      "leader": "High King Theron Valdris",
      "government_type": "constitutional_monarchy",
      "founding_date": "Third Age, Year 412",
      "population": 250000,
      "region": "Western Heartlands"
    }`,
  };
}

function factionsPrompt(): EntityPrompt {
  return {
    role: 'You are generating a faction — an organization with shared goals in a fractured fantasy world.',
    creationGuidelines: [
      'Define the faction\'s core ideology and goals',
      'Describe their membership and recruitment',
      'Explain their relationship to the Fracture and magic',
      'Include their methods (diplomatic, militant, scholarly)',
      'Describe their base of operations',
    ],
    attributeFocus: ['ideology', 'leader', 'headquarters', 'membership_size', 'founding_date', 'methods'],
    relationshipHints: ['Connect to existing kingdoms, other factions, or religions'],
    jsonExample: `{
      "ideology": "Preservation of natural magical order",
      "leader": "Archmage Elara Mistweaver",
      "headquarters": "The Spire of Equilibrium",
      "membership_size": 5000,
      "founding_date": "Age of Fractured Light, Year 12",
      "methods": ["scholarship", "diplomacy", "magical_containment"]
    }`,
  };
}

function godsPrompt(): EntityPrompt {
  return {
    role: 'You are generating a deity in a pantheon-shaped fantasy world.',
    creationGuidelines: [
      'Define the god\'s domain and portfolio',
      'Describe their alignment and personality',
      'Explain their role during and after the Celestial Fracture',
      'Include symbols, rituals, and clergy structure',
      'Describe rivalries or alliances with other gods',
    ],
    attributeFocus: ['domain', 'alignment', 'symbol', 'clergy', 'holy_city'],
    relationshipHints: ['Connect to existing religions, other gods, or factions that worship them'],
    jsonExample: `{
      "domain": "Shattered light, echoes, memory",
      "alignment": "chaotic_neutral",
      "symbol": "A cracked crystal refracting a single beam",
      "clergy": "Mendicant scholars who collect memories",
      "holy_city": "The Luminary Ruins"
    }`,
  };
}

function artifactsPrompt(): EntityPrompt {
  return {
    role: 'You are generating a magical artifact born from the Celestial Fracture.',
    creationGuidelines: [
      'Describe the artifact\'s origin and creation',
      'Define its power and limitations',
      'Explain the cost of using it (soul price)',
      'Describe its physical appearance',
      'Mention its current wielder or location',
      'Include any curses or drawbacks',
    ],
    attributeFocus: ['power', 'origin', 'material', 'wielder', 'location', 'soul_cost', 'curse'],
    relationshipHints: ['Link to the event that created it, its wielder, or where it was found'],
    jsonExample: `{
      "power": "Can reconstruct memories of the dead",
      "origin": "Forged from a fragment of the fractured moon",
      "material": "Lunar crystal and solidified twilight",
      "wielder": "High King Theron Valdris",
      "location": "Eldoria Castle Vault",
      "soul_cost": "One year of memory per use",
      "curse": "User slowly loses sense of self"
    }`,
  };
}

function spellsPrompt(): EntityPrompt {
  return {
    role: 'You are generating a spell unique to this world\'s soul-based magic system.',
    creationGuidelines: [
      'Describe the incantation and components',
      'Explain the effect and limitations',
      'Detail the soul cost (minor/major/severe)',
      'Specify school of magic',
      'Mention who discovered or commonly uses it',
    ],
    attributeFocus: ['school', 'power', 'cost', 'components', 'range', 'duration', 'discovered_by'],
    relationshipHints: ['Connect to the mage or faction that uses it, or the event of its discovery'],
    jsonExample: `{
      "school": "Soulmancy",
      "power": "major",
      "cost": "One month of lifespan",
      "components": "A fragment of moon crystal, spoken incantation",
      "range": "Touch",
      "duration": "Permanent",
      "discovered_by": "Archmage Elara Mistweaver"
    }`,
  };
}

function eventsPrompt(): EntityPrompt {
  return {
    role: 'You are generating a significant historical event in this fantasy world.',
    creationGuidelines: [
      'Define the date relative to the Celestial Fracture (BF or AF)',
      'Describe the event\'s causes and consequences',
      'List participants and affected regions',
      'Explain impact on magic and society',
      'Connect to the timeline',
    ],
    attributeFocus: ['date', 'participants', 'location', 'impact', 'significance', 'aftermath'],
    relationshipHints: ['Connect to entities that participated or were affected'],
    jsonExample: `{
      "date": "47 AF (After Fracture)",
      "participants": ["Kingdom of Eldoria", "Order of the Celestial Blade"],
      "location": "The Shattered Plains",
      "impact": "Ended the War of Shards",
      "significance": "major",
      "aftermath": "Treaty of Eldoria signed, stabilizing the region"
    }`,
  };
}

function monstersPrompt(): EntityPrompt {
  return {
    role: 'You are generating a monster twisted by the magical fallout of the Celestial Fracture.',
    creationGuidelines: [
      'Describe appearance and behavior',
      'Explain how the Fracture created or changed this creature',
      'Define habitat and hunting patterns',
      'List weaknesses and strengths',
      'Describe any connection to moon fragments',
    ],
    attributeFocus: ['threat_level', 'habitat', 'diet', 'abilities', 'weaknesses', 'fragment_influence'],
    relationshipHints: ['Connect to regions it hunts, hunters who fight it, or events involving it'],
    jsonExample: `{
      "threat_level": "deadly",
      "habitat": "The Crystal Wastes",
      "diet": "Soul essence of living beings",
      "abilities": ["phase_shift", "soul_drain", "crystal_armor"],
      "weaknesses": ["pure_light", "silver_weapons"],
      "fragment_influence": "Empowered by a large moon shard embedded in its chest"
    }`,
  };
}

function citiesPrompt(): EntityPrompt {
  return {
    role: 'You are generating a city in a fantasy world reshaped by magical catastrophe.',
    creationGuidelines: [
      'Describe the city\'s founding and history',
      'Explain how the Fracture affected this city',
      'Define its economy and culture',
      'Describe notable districts and landmarks',
      'Mention population demographics',
    ],
    attributeFocus: ['population', 'region', 'ruler', 'founding_date', 'notable_districts', 'economy'],
    relationshipHints: ['Connect to the kingdom it belongs to, nearby cities, or events it experienced'],
    jsonExample: `{
      "population": 45000,
      "region": "Western Heartlands",
      "ruler": "Lord Commander Aldric Vane",
      "founding_date": "Second Age, Year 890",
      "notable_districts": ["Crystal Market", "The Drowned Quarter", "Spire Ward"],
      "economy": "Moon crystal trade, textiles, magical components"
    }`,
  };
}

function religionsPrompt(): EntityPrompt {
  return {
    role: 'You are generating a religion or cult that formed in response to the Celestial Fracture.',
    creationGuidelines: [
      'Describe the core beliefs and tenets',
      'Explain how the Fracture shaped this faith',
      'Define rituals and practices',
      'Describe the clergy hierarchy',
      'Mention holy sites and texts',
    ],
    attributeFocus: ['tenets', 'deity', 'holy_text', 'holy_site', 'clergy_title', 'founding_date', 'rituals'],
    relationshipHints: ['Connect to the god they worship, factions aligned with them, or conflicts with other religions'],
    jsonExample: `{
      "tenets": ["The Fracture was a divine warning", "Magic must be used sparingly", "Moon fragments are holy relics"],
      "deity": "Nyxara the Shattered",
      "holy_text": "The Lament of Light",
      "holy_site": "The Temple of Echoes",
      "clergy_title": "Shard-Priest",
      "founding_date": "Age of Fractured Light, Year 3",
      "rituals": ["Daily prayer at moonrise", "Annual Pilgrimage of Shards"]
    }`,
  };
}

function racesPrompt(): EntityPrompt {
  return {
    role: 'You are generating a sentient race in a fantasy world.',
    creationGuidelines: [
      'Describe physical appearance and lifespan',
      'Explain their culture and societal structure',
      'Detail how the Fracture affected them',
      'Describe their relationship with magic (soul cost)',
      'Mention their homeland and population distribution',
    ],
    attributeFocus: ['lifespan', 'homeland', 'language', 'magic_affinity', 'culture_traits', 'population'],
    relationshipHints: ['Connect to kingdoms they inhabit, factions they lead, or conflicts they are in'],
    jsonExample: `{
      "lifespan": "200-300 years",
      "homeland": "The Luminary Plains",
      "language": "Aetherian",
      "magic_affinity": "high",
      "culture_traits": ["philosophical", "artistic", "reclusive"],
      "population": 50000
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
