// src/lib/allergies.ts

export type AllergyCatalogEntry = {
  id: string;
  name: string; // e.g. "Penicillin"
  type: "Drug" | "Food" | "Environmental" | "Other";
  commonReactions: string[];
  severityHint: "Mild" | "Moderate" | "Severe" | "Life-Threatening";
  notes?: string;
};

export const ALLERGY_CATALOG: AllergyCatalogEntry[] = [
  // -------- DRUG ALLERGIES --------
  {
    id: "penicillin",
    name: "Penicillin",
    type: "Drug",
    commonReactions: ["Rash", "Urticaria", "Angioedema", "Anaphylaxis"],
    severityHint: "Severe",
    notes:
      "Classic beta-lactam allergy; avoid other penicillins and consider cephalosporin cross-reactivity."
  },
  {
    id: "amoxicillin",
    name: "Amoxicillin",
    type: "Drug",
    commonReactions: ["Rash", "Urticaria", "Angioedema"],
    severityHint: "Moderate",
    notes:
      "Frequently reported in children; clarify if true allergy vs viral exanthem."
  },
  {
    id: "cephalosporins",
    name: "Cephalosporins",
    type: "Drug",
    commonReactions: ["Rash", "Urticaria", "Anaphylaxis"],
    severityHint: "Severe",
    notes:
      "Possible cross-reactivity with penicillins, especially first-generation agents."
  },
  {
    id: "sulfa",
    name: "Sulfonamides (co-trimoxazole, TMP-SMX)",
    type: "Drug",
    commonReactions: ["Rash", "Fever", "Stevens–Johnson syndrome"],
    severityHint: "Severe",
    notes:
      "Differentiate between mild rash and severe mucocutaneous reactions."
  },
  {
    id: "nsaids",
    name: "NSAIDs (Ibuprofen, Diclofenac, etc.)",
    type: "Drug",
    commonReactions: ["Bronchospasm", "Urticaria", "Angioedema"],
    severityHint: "Moderate",
    notes:
      "Watch carefully in asthma, nasal polyps or chronic urticaria (AERD phenotype)."
  },
  {
    id: "aspirin",
    name: "Aspirin",
    type: "Drug",
    commonReactions: ["Bronchospasm", "Urticaria", "Angioedema"],
    severityHint: "Moderate",
    notes:
      "Can trigger aspirin-exacerbated respiratory disease; avoid in known cases."
  },
  {
    id: "opioids",
    name: "Opioids (Morphine, Codeine, etc.)",
    type: "Drug",
    commonReactions: ["Itching", "Rash", "Flushing"],
    severityHint: "Mild",
    notes:
      "Many reactions are histamine release rather than true IgE allergy."
  },
  {
    id: "contrast",
    name: "Iodinated contrast media",
    type: "Drug",
    commonReactions: ["Urticaria", "Angioedema", "Anaphylactoid reaction"],
    severityHint: "Severe",
    notes:
      "Consider premedication protocols and alternative imaging if previous reaction."
  },
  {
    id: "chlorhexidine",
    name: "Chlorhexidine",
    type: "Drug",
    commonReactions: ["Contact dermatitis", "Urticaria", "Anaphylaxis"],
    severityHint: "Severe",
    notes:
      "Common in prep solutions, mouthwash, line dressings; important peri-operative trigger."
  },
  {
    id: "local-anaesthetic",
    name: "Local anaesthetics (e.g. Lignocaine)",
    type: "Drug",
    commonReactions: ["Rash", "Angioedema", "Hypotension"],
    severityHint: "Moderate",
    notes:
      "True allergy is rare; differentiate from toxicity or vasovagal episodes."
  },

  // -------- FOOD ALLERGIES --------
  {
    id: "peanut",
    name: "Peanut",
    type: "Food",
    commonReactions: ["Urticaria", "Angioedema", "Anaphylaxis"],
    severityHint: "Life-Threatening",
    notes: "High-risk food allergy; often requires adrenaline auto-injector."
  },
  {
    id: "tree-nut",
    name: "Tree nuts (Cashew, Almond, Walnut, etc.)",
    type: "Food",
    commonReactions: ["Urticaria", "Angioedema", "Anaphylaxis"],
    severityHint: "Life-Threatening",
    notes:
      "Clarify specific nut; cross-contamination is common in processed foods."
  },
  {
    id: "shellfish",
    name: "Shellfish (Prawns, Crab, Lobster)",
    type: "Food",
    commonReactions: ["Urticaria", "Angioedema", "Anaphylaxis"],
    severityHint: "Severe",
    notes:
      "Often persists lifelong; important travel and restaurant history."
  },
  {
    id: "fish",
    name: "Fish",
    type: "Food",
    commonReactions: ["Urticaria", "Angioedema", "Anaphylaxis"],
    severityHint: "Severe",
    notes: "Differentiate from shellfish allergy; may be species-specific."
  },
  {
    id: "egg",
    name: "Egg",
    type: "Food",
    commonReactions: ["Eczema flare", "Urticaria", "Vomiting"],
    severityHint: "Moderate",
    notes:
      "Important for some vaccines; many children outgrow egg allergy."
  },
  {
    id: "milk",
    name: "Cow’s milk protein",
    type: "Food",
    commonReactions: ["Vomiting", "Diarrhoea", "Eczema", "Anaphylaxis"],
    severityHint: "Moderate",
    notes:
      "Common in infants; clarify IgE vs non-IgE mediated disease."
  },
  {
    id: "wheat",
    name: "Wheat",
    type: "Food",
    commonReactions: ["Urticaria", "GI upset", "Exercise-induced anaphylaxis"],
    severityHint: "Moderate",
    notes:
      "Distinguish from coeliac disease or non-coeliac gluten sensitivity."
  },
  {
    id: "soy",
    name: "Soy",
    type: "Food",
    commonReactions: ["Urticaria", "GI upset"],
    severityHint: "Mild",
    notes: "May cross-react with other legumes in some patients."
  },

  // -------- ENVIRONMENTAL ALLERGIES --------
  {
    id: "house-dust-mite",
    name: "House dust mite",
    type: "Environmental",
    commonReactions: ["Rhinitis", "Sneezing", "Itchy eyes", "Asthma symptoms"],
    severityHint: "Moderate",
    notes:
      "Classic trigger for perennial allergic rhinitis and asthma."
  },
  {
    id: "grass-pollen",
    name: "Grass pollen",
    type: "Environmental",
    commonReactions: ["Seasonal rhinitis", "Conjunctivitis", "Asthma symptoms"],
    severityHint: "Mild",
    notes: "Typically worse in specific seasons; treat with antihistamines and nasal steroids."
  },
  {
    id: "tree-pollen",
    name: "Tree pollen",
    type: "Environmental",
    commonReactions: ["Seasonal rhinitis", "Conjunctivitis"],
    severityHint: "Mild",
    notes: "Check regional species (e.g. birch, oak, plane trees)."
  },
  {
    id: "cat-dander",
    name: "Cat dander",
    type: "Environmental",
    commonReactions: ["Rhinitis", "Conjunctivitis", "Asthma symptoms"],
    severityHint: "Moderate",
    notes:
      "Symptom pattern improves when away from cats; important home trigger."
  },
  {
    id: "dog-dander",
    name: "Dog dander",
    type: "Environmental",
    commonReactions: ["Rhinitis", "Conjunctivitis", "Asthma symptoms"],
    severityHint: "Moderate",
    notes:
      "Common in households with dogs; ask about bedroom exposure."
  },
  {
    id: "mould",
    name: "Mould spores",
    type: "Environmental",
    commonReactions: ["Rhinitis", "Asthma symptoms", "Cough"],
    severityHint: "Moderate",
    notes:
      "Damp housing, bathrooms, and occupational exposure are key clues."
  },
  {
    id: "latex",
    name: "Latex",
    type: "Environmental",
    commonReactions: ["Contact urticaria", "Angioedema", "Anaphylaxis"],
    severityHint: "Severe",
    notes:
      "Important in theatre; cross-reacts with some fruits (banana, avocado, kiwi)."
  },

  // -------- INSECT / OTHER --------
  {
    id: "bee-venom",
    name: "Bee venom",
    type: "Other",
    commonReactions: ["Large local swelling", "Urticaria", "Anaphylaxis"],
    severityHint: "Severe",
    notes:
      "Systemic reactions require adrenaline auto-injector and specialist referral."
  },
  {
    id: "wasp-venom",
    name: "Wasp / hornet venom",
    type: "Other",
    commonReactions: ["Large local swelling", "Urticaria", "Anaphylaxis"],
    severityHint: "Severe",
    notes:
      "Ask specifically about wheeze, tongue swelling, hypotension or syncope."
  },
  {
    id: "adhesives",
    name: "Adhesive dressings / plasters",
    type: "Other",
    commonReactions: ["Contact dermatitis", "Rash"],
    severityHint: "Mild",
    notes:
      "Switch to hypoallergenic or silicone-based adhesives if needed."
  },
  {
    id: "nickel",
    name: "Nickel",
    type: "Other",
    commonReactions: ["Contact dermatitis", "Eczematous rash"],
    severityHint: "Mild",
    notes:
      "Common with jewellery, belt buckles, jean buttons, watch straps."
  }
];

export function searchAllergies(
  query: string,
  limit = 50
): AllergyCatalogEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return ALLERGY_CATALOG.slice(0, limit);

  return ALLERGY_CATALOG.filter((a) => {
    return (
      a.name.toLowerCase().includes(q) ||
      a.notes?.toLowerCase().includes(q) ||
      a.commonReactions.some((r) => r.toLowerCase().includes(q))
    );
  }).slice(0, limit);
}

export function findAllergyByName(
  name: string
): AllergyCatalogEntry | undefined {
  const key = name.toLowerCase().trim();
  return (
    ALLERGY_CATALOG.find((a) => a.name.toLowerCase() === key) ||
    ALLERGY_CATALOG.find((a) => key.includes(a.name.toLowerCase())) ||
    ALLERGY_CATALOG.find((a) => a.name.toLowerCase().includes(key))
  );
}
