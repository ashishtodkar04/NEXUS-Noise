// Scientific noise calculation utilities and disclaimer strings

export const SCIENTIFIC_DISCLAIMER =
  "Disclaimer: Sound-level readings captured via standard smartphone microphones are software estimates. " +
  "They are indicative for civic complaint triage and must be officially calibrated with a certified Class 1/2 sound-level meter for judicial enforcement.";

export const getNoiseSeverity = (currentDb, permittedDb = 75) => {
  const diff = currentDb - permittedDb;
  if (diff > 10) return { status: 'Critical Violation', color: 'red', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40' };
  if (diff > 3) return { status: 'Potential Violation', color: 'amber', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40' };
  if (diff > 0) return { status: 'Warning Level', color: 'yellow', bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/40' };
  return { status: 'Within Permitted Limit', color: 'emerald', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40' };
};

export const getDecibelCategoryLabel = (db) => {
  if (db < 45) return "Quiet Room / Library";
  if (db < 60) return "Normal Conversation";
  if (db < 75) return "Commercial Area Traffic";
  if (db < 85) return "Loud Music / Heavy Machinery";
  if (db < 95) return "Subwoofer DJ System";
  return "Hazardous Noise Level";
};
