/**
 * ============================================================
 *  CLINIFY — Clinical Calculator  ·  calc.js
 *  Depends on: math.js (window.math), Bootstrap 5
 * ============================================================
 */

document.addEventListener("DOMContentLoaded", function () {

  /* ═══════════════════════════════════════════════════════════
     PROJECT CLASS MAPPINGS
     interpret status → project border-dashed class
  ═══════════════════════════════════════════════════════════ */
  const STATUS_CLASS = {
    ok:   "border-dashed-success",
    warn: "border-dashed-warning",
    bad:  "border-dashed-danger",
    info: "border-dashed-info"
  };


  /* ═══════════════════════════════════════════════════════════
     1.  FORMULA CATEGORIES
  ═══════════════════════════════════════════════════════════ */

  const FORMULA_CATEGORIES = {
    "Anthropometry":   ["bmi", "bsa", "ibw", "abw", "bmr"],
    "Hemodynamics":    ["map", "pp", "si", "rpp", "qtc"],
    "Renal":           ["crcl", "egfr", "fwd"],
    "Electrolytes":    ["na_corr", "ag", "ag_corr", "osm", "osm_gap", "ca_corr", "delta_delta"],
    "Acid-Base":       ["acid_base", "winters", "hco3_deficit", "na_deficit"],
    "Hematology":      ["anc", "retic_idx", "wbc_corrected"],
    "Fluids & Burns":  ["parkland", "holliday"],
    "Pulmonology & Ventilator": [
      "—Blood Gases",    "aa_grad", "pf_ratio",
      "—Oxygenation",    "tidal_vol", "min_vent",
      "—Vent Setup",     "vent_setup", "vent_mechanics",
      "—Gas Exchange",   "vent_gas", "vent_weaning"
    ],
    "ICU Drugs": [
      "—Vasopressors",   "norepi", "epi", "dopamine", "dobutamine", "vasopressin", "phenylephrine", "milrinone",
      "—Sedation",       "propofol", "midazolam", "dexmed", "fentanyl", "morphine", "ketamine",
      "—Infusions",      "insulin_inf", "heparin_inf", "labetalol_inf", "nicardipine_inf", "nitroprusside_inf", "furosemide_inf"
    ],
    "Obstetrics": ["ob"]
  };


  /* ═══════════════════════════════════════════════════════════
     2.  FORMULA DEFINITIONS
  ═══════════════════════════════════════════════════════════ */

  const FORMULAS = {

    // ── Anthropometry ──────────────────────────────────────

    bmi: {
      label: "BMI", unit: "kg/m²",
      fields: [
        { id:"weight", label:"Weight", type:"number", placeholder:"kg", min:1, max:400,
          unitToggle:{key:"wt", units:[{label:"kg",factor:1},{label:"lb",factor:0.453592}]} },
        { id:"height", label:"Height", type:"number", placeholder:"cm", min:30, max:250,
          unitToggle:{key:"ht", units:[{label:"cm",factor:1},{label:"in",factor:2.54}]} }
      ],
      calculate: v => v.weight / (v.height / 100) ** 2,
      interpret: r => {
        if (r < 16)   return { status:"bad",  label:"Severe thinness",   range:"Normal: 18.5 – 24.9 kg/m²" };
        if (r < 18.5) return { status:"warn", label:"Underweight",       range:"Normal: 18.5 – 24.9 kg/m²" };
        if (r < 25)   return { status:"ok",   label:"Normal weight",     range:"Normal: 18.5 – 24.9 kg/m²" };
        if (r < 30)   return { status:"warn", label:"Overweight",        range:"Normal: 18.5 – 24.9 kg/m²" };
        if (r < 35)   return { status:"bad",  label:"Obese Class I",     range:"Normal: 18.5 – 24.9 kg/m²" };
        if (r < 40)   return { status:"bad",  label:"Obese Class II",    range:"Normal: 18.5 – 24.9 kg/m²" };
                      return { status:"bad",  label:"Obese Class III",   range:"Normal: 18.5 – 24.9 kg/m²" };
      }
    },

    bsa: {
      label: "BSA", unit: "m²",
      note: "Mosteller formula: √(height × weight / 3600)",
      fields: [
        { id:"weight", label:"Weight", type:"number", placeholder:"kg", min:1, max:400,
          unitToggle:{key:"wt", units:[{label:"kg",factor:1},{label:"lb",factor:0.453592}]} },
        { id:"height", label:"Height", type:"number", placeholder:"cm", min:30, max:250,
          unitToggle:{key:"ht", units:[{label:"cm",factor:1},{label:"in",factor:2.54}]} }
      ],
      calculate: v => Math.sqrt((v.height * v.weight) / 3600),
      interpret: r => {
        if (r >= 1.5 && r <= 2.0) return { status:"ok",   label:"Normal adult BSA",    range:"Typical adult: 1.5 – 2.0 m²" };
        if (r < 1.5)               return { status:"info", label:"Below typical adult", range:"Typical adult: 1.5 – 2.0 m²" };
                                   return { status:"info", label:"Above typical adult", range:"Typical adult: 1.5 – 2.0 m²" };
      }
    },

    ibw: {
      label: "IBW", unit: "kg",
      note: "Devine formula. Used for dosing: aminoglycosides, vancomycin, tidal volume.",
      fields: [
        { id:"height", label:"Height", type:"number", placeholder:"cm", min:100, max:250,
          unitToggle:{key:"ht", units:[{label:"cm",factor:1},{label:"in",factor:2.54}]} },
        { id:"female", label:"Female sex", type:"checkbox" }
      ],
      calculate: v => (v.female ? 45.5 : 50.0) + 2.3 * (v.height / 2.54 - 60),
      interpret: r => {
        if (r < 30) return { status:"warn", label:"Very low IBW — verify height",     range:"Reference only, not a goal weight" };
                    return { status:"info", label:"Ideal Body Weight (dosing ref.)",  range:"Aminoglycosides · LMWH · Ventilator Vt" };
      }
    },

    abw: {
      label: "Adj. BW", unit: "kg",
      note: "Adjusted BW = IBW + 0.4 × (TBW − IBW). Applies when BMI > 30.",
      fields: [
        { id:"weight", label:"Actual Weight", type:"number", placeholder:"kg", min:1, max:400,
          unitToggle:{key:"wt", units:[{label:"kg",factor:1},{label:"lb",factor:0.453592}]} },
        { id:"height", label:"Height", type:"number", placeholder:"cm", min:100, max:250,
          unitToggle:{key:"ht", units:[{label:"cm",factor:1},{label:"in",factor:2.54}]} },
        { id:"female", label:"Female sex", type:"checkbox" }
      ],
      calculate: v => {
        const ibw = (v.female ? 45.5 : 50.0) + 2.3 * (v.height / 2.54 - 60);
        const bmi = v.weight / (v.height / 100) ** 2;
        return bmi > 30 ? ibw + 0.4 * (v.weight - ibw) : ibw;
      },
      interpret: (r, v) => {
        const ibw = (v.female ? 45.5 : 50.0) + 2.3 * (v.height / 2.54 - 60);
        const bmi = v.weight / (v.height / 100) ** 2;
        if (bmi <= 30) return { status:"info", label:`BMI ${bmi.toFixed(1)} — not obese, IBW used`, range:"ABW differs only when BMI > 30" };
                       return { status:"info", label:`IBW: ${ibw.toFixed(1)} kg · ABW applied`,     range:"Gentamicin · Vancomycin · LMWH in obesity" };
      }
    },

    bmr: {
      label: "BMR", unit: "kcal/day",
      note: "Mifflin–St Jeor resting metabolic rate",
      fields: [
        { id:"weight", label:"Weight", type:"number", placeholder:"kg", min:1, max:400,
          unitToggle:{key:"wt", units:[{label:"kg",factor:1},{label:"lb",factor:0.453592}]} },
        { id:"height", label:"Height", type:"number", placeholder:"cm", min:30, max:250,
          unitToggle:{key:"ht", units:[{label:"cm",factor:1},{label:"in",factor:2.54}]} },
        { id:"age",    label:"Age",    type:"number", placeholder:"years", min:18, max:120 },
        { id:"female", label:"Female sex", type:"checkbox" }
      ],
      calculate: v => {
        const base = 10 * v.weight + 6.25 * v.height - 5 * v.age;
        return v.female ? base - 161 : base + 5;
      },
      interpret: r => ({
        status: "info",
        label: `Resting: ${Math.round(r)} kcal/day`,
        range: `Sedentary ×1.2 = ${Math.round(r*1.2)} · Moderate ×1.55 = ${Math.round(r*1.55)} · Active ×1.725 = ${Math.round(r*1.725)} kcal/day`
      })
    },

    // ── Hemodynamics ──────────────────────────────────────

    map: {
      label: "MAP", unit: "mmHg",
      fields: [
        { id:"sbp", label:"SBP", type:"number", placeholder:"mmHg", min:50, max:300 },
        { id:"dbp", label:"DBP", type:"number", placeholder:"mmHg", min:20, max:200 }
      ],
      validate: v => v.dbp >= v.sbp ? "DBP must be less than SBP" : null,
      calculate: v => (v.sbp + 2 * v.dbp) / 3,
      interpret: r => {
        if (r < 65)   return { status:"bad",  label:"Hypotension — organ perfusion at risk", range:"Target ≥ 65 mmHg (sepsis/shock)" };
        if (r < 70)   return { status:"warn", label:"Low-normal MAP",                        range:"Normal: 70 – 100 mmHg" };
        if (r <= 100) return { status:"ok",   label:"Normal MAP",                            range:"Normal: 70 – 100 mmHg" };
                      return { status:"warn", label:"Hypertension",                          range:"Normal: 70 – 100 mmHg" };
      }
    },

    pp: {
      label: "Pulse Pressure", unit: "mmHg",
      fields: [
        { id:"sbp", label:"SBP", type:"number", placeholder:"mmHg", min:50, max:300 },
        { id:"dbp", label:"DBP", type:"number", placeholder:"mmHg", min:20, max:200 }
      ],
      validate: v => v.dbp >= v.sbp ? "DBP must be less than SBP" : null,
      calculate: v => v.sbp - v.dbp,
      interpret: r => {
        if (r < 25)  return { status:"bad",  label:"Narrow PP — tamponade / severe AS?", range:"Normal: 30 – 60 mmHg" };
        if (r < 30)  return { status:"warn", label:"Low-normal PP",                      range:"Normal: 30 – 60 mmHg" };
        if (r <= 60) return { status:"ok",   label:"Normal pulse pressure",              range:"Normal: 30 – 60 mmHg" };
                     return { status:"warn", label:"Wide PP — AR, hyperthyroidism?",     range:"Normal: 30 – 60 mmHg" };
      }
    },

    si: {
      label: "Shock Index", unit: "",
      fields: [
        { id:"hr",  label:"Heart Rate", type:"number", placeholder:"bpm",  min:20, max:250 },
        { id:"sbp", label:"SBP",        type:"number", placeholder:"mmHg", min:50, max:300 }
      ],
      calculate: v => v.hr / v.sbp,
      interpret: r => {
        if (r < 0.7) return { status:"ok",   label:"Normal shock index",        range:"SI < 0.7  · ≥0.7 mild  · ≥1.0 significant" };
        if (r < 1.0) return { status:"warn", label:"Mildly elevated SI",        range:"Assess fluid status and haemodynamics" };
        if (r < 1.4) return { status:"bad",  label:"Significant — high risk",   range:"SI ≥1.0 associated with elevated 30-day mortality" };
                     return { status:"bad",  label:"Critical shock index",      range:"Severe haemodynamic compromise. Escalate." };
      }
    },

    rpp: {
      label: "Rate-Pressure Product", unit: "",
      note: "RPP = HR × SBP. Surrogate for myocardial oxygen demand.",
      fields: [
        { id:"hr",  label:"Heart Rate", type:"number", placeholder:"bpm",  min:20, max:250 },
        { id:"sbp", label:"SBP",        type:"number", placeholder:"mmHg", min:50, max:300 }
      ],
      calculate: v => v.hr * v.sbp,
      interpret: r => {
        if (r < 10000) return { status:"ok",   label:"Low myocardial O₂ demand",      range:"RPP < 10,000: resting range" };
        if (r < 20000) return { status:"ok",   label:"Moderate myocardial O₂ demand", range:"RPP 10,000–20,000: typical exertion" };
        if (r < 25000) return { status:"warn", label:"High myocardial O₂ demand",     range:"RPP > 20,000: ischaemia threshold in CAD" };
                       return { status:"bad",  label:"Very high — ischaemia risk",    range:"RPP > 25,000: significant ischaemia risk" };
      }
    },

    qtc: {
      label: "Corrected QT", unit: "ms",
      note: "Bazett: QTc = QT / √(RR).  RR = 60000 / HR",
      fields: [
        { id:"qt", label:"QT Interval", type:"number", placeholder:"ms",  min:200, max:800 },
        { id:"hr", label:"Heart Rate",  type:"number", placeholder:"bpm", min:20,  max:250 }
      ],
      calculate: v => v.qt / Math.sqrt(60000 / v.hr / 1000),
      interpret: r => {
        if (r <= 440) return { status:"ok",   label:"Normal QTc",                    range:"Normal: ♂ ≤440 ms · ♀ ≤460 ms" };
        if (r <= 460) return { status:"warn", label:"Borderline prolongation",       range:"Monitor — review drugs, electrolytes" };
        if (r <= 500) return { status:"warn", label:"Prolonged QTc",                 range:"Review QT-prolonging drugs, correct K⁺/Mg²⁺" };
                      return { status:"bad",  label:"Critical — TdP risk",           range:"QTc > 500 ms: high risk of Torsades de Pointes" };
      }
    },

    // ── Renal ─────────────────────────────────────────────

    crcl: {
      label: "CrCl", unit: "mL/min",
      note: "Cockcroft–Gault. Use IBW if obese; actual weight if underweight.",
      fields: [
        { id:"weight", label:"Weight (IBW if obese)", type:"number", placeholder:"kg", min:1, max:400,
          unitToggle:{key:"wt", units:[{label:"kg",factor:1},{label:"lb",factor:0.453592}]} },
        { id:"age",    label:"Age",        type:"number", placeholder:"years", min:1,   max:120 },
        { id:"creat",  label:"Creatinine", type:"number", placeholder:"mg/dL", min:0.1, max:25  },
        { id:"female", label:"Female sex", type:"checkbox" }
      ],
      calculate: v => ((140 - v.age) * v.weight / (72 * v.creat)) * (v.female ? 0.85 : 1),
      interpret: r => {
        if (r >= 90) return { status:"ok",   label:"CKD G1 – Normal or high",       range:"CrCl ≥ 90 mL/min" };
        if (r >= 60) return { status:"ok",   label:"CKD G2 – Mildly decreased",     range:"CrCl 60 – 89" };
        if (r >= 30) return { status:"warn", label:"CKD G3 – Moderately decreased", range:"CrCl 30 – 59 · Review drug dosing" };
        if (r >= 15) return { status:"bad",  label:"CKD G4 – Severely decreased",   range:"CrCl 15 – 29 · Nephrology referral" };
                     return { status:"bad",  label:"CKD G5 – Kidney failure",       range:"CrCl < 15 · Consider dialysis" };
      }
    },

    egfr: {
      label: "eGFR (CKD-EPI)", unit: "mL/min/1.73m²",
      note: "CKD-EPI 2021 creatinine equation (race-free)",
      fields: [
        { id:"age",    label:"Age",        type:"number", placeholder:"years", min:18, max:120 },
        { id:"creat",  label:"Creatinine", type:"number", placeholder:"mg/dL", min:0.1, max:25 },
        { id:"female", label:"Female sex", type:"checkbox" }
      ],
      calculate: v => {
        const k = v.female ? 0.7 : 0.9, a = v.female ? -0.241 : -0.302, sf = v.female ? 1.012 : 1;
        const r = v.creat / k;
        return 142 * Math.pow(Math.min(r,1),a) * Math.pow(Math.max(r,1),-1.2) * Math.pow(0.9938,v.age) * sf;
      },
      interpret: r => {
        if (r >= 90) return { status:"ok",   label:"G1 – Normal or high",           range:"eGFR ≥ 90" };
        if (r >= 60) return { status:"ok",   label:"G2 – Mildly decreased",         range:"eGFR 60 – 89" };
        if (r >= 45) return { status:"warn", label:"G3a – Mild-moderate decrease",  range:"eGFR 45 – 59" };
        if (r >= 30) return { status:"warn", label:"G3b – Moderate-severe",         range:"eGFR 30 – 44 · Review medications" };
        if (r >= 15) return { status:"bad",  label:"G4 – Severely decreased",       range:"eGFR 15 – 29 · Nephrology referral" };
                     return { status:"bad",  label:"G5 – Kidney failure",           range:"eGFR < 15 · Dialysis consideration" };
      }
    },

    fwd: {
      label: "Free Water Deficit", unit: "L",
      note: "FWD = TBW × (Na/140 – 1). TBW: 0.6 × wt (♂) / 0.5 × wt (♀)",
      fields: [
        { id:"weight", label:"Weight", type:"number", placeholder:"kg", min:1, max:400,
          unitToggle:{key:"wt", units:[{label:"kg",factor:1},{label:"lb",factor:0.453592}]} },
        { id:"na",     label:"Serum Na", type:"number", placeholder:"mEq/L", min:130, max:180 },
        { id:"female", label:"Female sex", type:"checkbox" }
      ],
      calculate: v => (v.female ? 0.5 : 0.6) * v.weight * (v.na / 140 - 1),
      interpret: r => {
        if (r <= 0) return { status:"info", label:"No free water deficit",       range:"Positive FWD = hypernatraemia" };
        if (r < 2)  return { status:"warn", label:"Mild free water deficit",     range:"Correct ≤ 10–12 mEq/L Na per 24h" };
        if (r < 4)  return { status:"bad",  label:"Moderate free water deficit", range:"Monitor Na every 4–6h during correction" };
                    return { status:"bad",  label:"Severe free water deficit",  range:"ICU-level monitoring recommended" };
      }
    },

    // ── Electrolytes ──────────────────────────────────────

    na_corr: {
      label: "Corrected Na", unit: "mEq/L",
      note: "Adjusts measured sodium for hyperglycaemia.",
      fields: [
        { id:"na",      label:"Measured Na", type:"number", placeholder:"mEq/L", min:100, max:200 },
        { id:"glucose", label:"Glucose",     type:"number", placeholder:"mg/dL", min:20, max:2000,
          unitToggle:{key:"glu", units:[{label:"mg/dL",factor:1},{label:"mmol/L",factor:18,decimals:1}]} },
        { id:"factor",  label:"Correction",  type:"select",
          options:[{value:"1.6",label:"1.6 (classic)"},{value:"2.4",label:"2.4 (revised)"}] }
      ],
      calculate: v => v.na + parseFloat(v.factor) * ((v.glucose - 100) / 100),
      interpret: r => {
        if (r < 135)  return { status:"warn", label:"Hyponatraemia (corrected)",   range:"Normal: 135 – 145 mEq/L" };
        if (r <= 145) return { status:"ok",   label:"Normal corrected sodium",     range:"Normal: 135 – 145 mEq/L" };
        if (r <= 155) return { status:"warn", label:"Hypernatraemia (corrected)",  range:"Normal: 135 – 145 mEq/L" };
                      return { status:"bad",  label:"Severe hypernatraemia",       range:"Normal: 135 – 145 mEq/L" };
      }
    },

    ag: {
      label: "Anion Gap", unit: "mEq/L",
      fields: [
        { id:"na",   label:"Na",   type:"number", placeholder:"mEq/L", min:100, max:200 },
        { id:"cl",   label:"Cl",   type:"number", placeholder:"mEq/L", min:50,  max:160 },
        { id:"hco3", label:"HCO₃", type:"number", placeholder:"mEq/L", min:5,   max:60  }
      ],
      calculate: v => v.na - (v.cl + v.hco3),
      interpret: r => {
        if (r < 3)   return { status:"bad",  label:"Low AG — albumin / paraprotein?",  range:"Normal: 8 – 12 mEq/L (albumin 4 g/dL)" };
        if (r <= 12) return { status:"ok",   label:"Normal anion gap",                 range:"Normal: 8 – 12 mEq/L" };
        if (r <= 16) return { status:"warn", label:"Borderline elevated AG",           range:"Normal: 8 – 12 mEq/L" };
                     return { status:"bad",  label:"Elevated AG — consider MUDPILES",  range:"Methanol · Uraemia · DKA · Propylene glycol · INH/Iron · Lactic · Ethylene glycol · Salicylates" };
      }
    },

    ag_corr: {
      label: "Corrected AG", unit: "mEq/L",
      note: "Corrects AG for hypoalbuminaemia: +2.5 per 1 g/dL ↓ albumin below 4",
      fields: [
        { id:"na",      label:"Na",      type:"number", placeholder:"mEq/L", min:100, max:200 },
        { id:"cl",      label:"Cl",      type:"number", placeholder:"mEq/L", min:50,  max:160 },
        { id:"hco3",    label:"HCO₃",   type:"number", placeholder:"mEq/L", min:5,   max:60  },
        { id:"albumin", label:"Albumin", type:"number", placeholder:"g/dL",  min:0.5, max:6   }
      ],
      calculate: v => (v.na - (v.cl + v.hco3)) + 2.5 * (4 - v.albumin),
      interpret: r => {
        if (r <= 12) return { status:"ok",   label:"Normal corrected AG",              range:"Normal: 8 – 12 mEq/L" };
        if (r <= 16) return { status:"warn", label:"Borderline elevated corrected AG", range:"Normal: 8 – 12 mEq/L" };
                     return { status:"bad",  label:"Elevated corrected AG",            range:"Underlying HAGMA masked by hypoalbuminaemia" };
      }
    },

    osm: {
      label: "Osmolality", unit: "mOsm/kg",
      note: "Calculated: 2×Na + glucose/18 + BUN/2.8",
      fields: [
        { id:"na",      label:"Na",      type:"number", placeholder:"mEq/L", min:100, max:200 },
        { id:"glucose", label:"Glucose", type:"number", placeholder:"mg/dL", min:20,  max:2000,
          unitToggle:{key:"glu", units:[{label:"mg/dL",factor:1},{label:"mmol/L",factor:18,decimals:1}]} },
        { id:"bun",     label:"BUN",     type:"number", placeholder:"mg/dL", min:1,   max:300 }
      ],
      calculate: v => 2 * v.na + v.glucose / 18 + v.bun / 2.8,
      interpret: r => {
        if (r < 280)  return { status:"warn", label:"Low osmolality",         range:"Normal: 285 – 295 mOsm/kg" };
        if (r <= 295) return { status:"ok",   label:"Normal osmolality",      range:"Normal: 285 – 295 mOsm/kg" };
        if (r <= 320) return { status:"warn", label:"Mildly elevated",        range:"Normal: 285 – 295 mOsm/kg" };
                      return { status:"bad",  label:"Severe hyperosmolality", range:">320 mOsm/kg: coma risk" };
      }
    },

    osm_gap: {
      label: "Osmolar Gap", unit: "mOsm/kg",
      note: "OG = Measured − Calculated. >10 suggests toxic alcohols.",
      fields: [
        { id:"na",       label:"Na",           type:"number", placeholder:"mEq/L",   min:100, max:200 },
        { id:"glucose",  label:"Glucose",      type:"number", placeholder:"mg/dL",   min:20,  max:2000 },
        { id:"bun",      label:"BUN",          type:"number", placeholder:"mg/dL",   min:1,   max:300 },
        { id:"meas_osm", label:"Measured Osm", type:"number", placeholder:"mOsm/kg", min:200, max:500 }
      ],
      calculate: v => v.meas_osm - (2 * v.na + v.glucose / 18 + v.bun / 2.8),
      interpret: r => {
        if (r <= 10) return { status:"ok",   label:"Normal osmolar gap",     range:"Normal < 10 mOsm/kg" };
        if (r <= 20) return { status:"warn", label:"Borderline osmolar gap", range:"Consider ethanol, mannitol" };
                     return { status:"bad",  label:"Elevated osmolar gap",   range:"Consider methanol, ethylene glycol, isopropanol" };
      }
    },

    ca_corr: {
      label: "Corrected Ca", unit: "mg/dL",
      note: "Corrected Ca = Measured Ca + 0.8 × (4 − albumin)",
      fields: [
        { id:"calcium", label:"Calcium",  type:"number", placeholder:"mg/dL", min:4,   max:20 },
        { id:"albumin", label:"Albumin",  type:"number", placeholder:"g/dL",  min:0.5, max:6  }
      ],
      calculate: v => v.calcium + 0.8 * (4 - v.albumin),
      interpret: r => {
        if (r < 8.5)   return { status:"warn", label:"Hypocalcaemia (corrected)",       range:"Normal: 8.5 – 10.5 mg/dL" };
        if (r <= 10.5) return { status:"ok",   label:"Normal corrected calcium",        range:"Normal: 8.5 – 10.5 mg/dL" };
        if (r <= 12)   return { status:"warn", label:"Mild hypercalcaemia (corrected)", range:"Normal: 8.5 – 10.5 mg/dL" };
                       return { status:"bad",  label:"Significant hypercalcaemia",      range:"Consider PTH, malignancy, granuloma" };
      }
    },

    delta_delta: {
      label: "Δ-Δ Ratio", unit: "",
      note: "ΔΔ = (AG − 12) / (24 − HCO₃). Identifies mixed acid-base disorders.",
      fields: [
        { id:"na",   label:"Na",   type:"number", placeholder:"mEq/L", min:100, max:200 },
        { id:"cl",   label:"Cl",   type:"number", placeholder:"mEq/L", min:50,  max:160 },
        { id:"hco3", label:"HCO₃", type:"number", placeholder:"mEq/L", min:5,   max:60  }
      ],
      calculate: v => {
        const denom = 24 - v.hco3;
        if (denom === 0) throw new Error("HCO₃ = 24 — no metabolic acidosis to assess");
        return (v.na - (v.cl + v.hco3) - 12) / denom;
      },
      interpret: r => {
        if (r < 0.4)  return { status:"info", label:"Pure NAGMA",                             range:"< 0.4: Non-anion gap metabolic acidosis only" };
        if (r < 1.0)  return { status:"warn", label:"Mixed: NAGMA + HAGMA",                   range:"0.4 – 1.0: concurrent NAGMA and HAGMA" };
        if (r <= 2.0) return { status:"ok",   label:"Pure HAGMA",                             range:"1 – 2: Pure high-AG metabolic acidosis" };
                      return { status:"warn", label:"HAGMA + metabolic alkalosis",            range:"> 2: Underlying metabolic alkalosis suspected" };
      }
    },

    // ── Acid-Base ─────────────────────────────────────────
    // Full interpreter — renders its own rich card

    acid_base: {
      label: "Acid-Base Interpreter", unit: "",
      isAcidBase: true,
      note: "pH + PaCO₂ required. HCO₃ auto-calculated if blank. Add Na/Cl for AG, albumin for correction, weight for deficit.",
      fields: [
        { id:"ph",       label:"pH",                  type:"number", placeholder:"e.g. 7.25", min:6.5, max:8.0 },
        { id:"paco2",    label:"PaCO₂",               type:"number", placeholder:"mmHg",      min:10,  max:120 },
        { id:"hco3",     label:"HCO₃",                type:"number", placeholder:"auto-calc if blank", min:1, max:60, optional:true },
        { id:"na",       label:"Na",                  type:"number", placeholder:"mEq/L for AG", min:100, max:200, optional:true },
        { id:"cl",       label:"Cl",                  type:"number", placeholder:"mEq/L for AG", min:50,  max:160, optional:true },
        { id:"albumin",  label:"Albumin",             type:"number", placeholder:"g/dL for corr.", min:0.5, max:6, optional:true },
        { id:"weight",   label:"Weight",              type:"number", placeholder:"kg for deficit", min:1, max:400, optional:true,
          unitToggle:{key:"wt", units:[{label:"kg",factor:1},{label:"lb",factor:0.453592}]} },
        { id:"female",   label:"Female sex",          type:"checkbox" }
      ],
      calculate: v => {
        // HCO3: use entered value or calculate via Henderson-Hasselbalch
        const hco3 = (v.hco3 && v.hco3 > 0)
          ? v.hco3
          : parseFloat((0.03 * v.paco2 * Math.pow(10, v.ph - 6.1)).toFixed(1));
        const hco3Calc = !(v.hco3 && v.hco3 > 0);

        // ── Step 1: pH status ──
        const acidaemic  = v.ph < 7.35;
        const alkalaemic = v.ph > 7.45;
        const normalPH   = !acidaemic && !alkalaemic;

        // Component abnormalities
        const metAcid  = hco3 < 22;
        const metAlk   = hco3 > 26;
        const respAcid = v.paco2 > 45;
        const respAlk  = v.paco2 < 35;

        // ── Step 2: Primary disorder ──
        let disorders = [], overallStatus = "ok";

        if (acidaemic) {
          overallStatus = "bad";
          if (metAcid && respAcid) disorders.push({ label:"Mixed Acidosis", sub:"Metabolic + Respiratory", status:"bad" });
          else if (metAcid)        disorders.push({ label:"Metabolic Acidosis", sub:`pH ${v.ph} · HCO₃ ${hco3.toFixed(1)} mEq/L`, status:"bad" });
          else if (respAcid)       disorders.push({ label:"Respiratory Acidosis", sub:`pH ${v.ph} · PaCO₂ ${v.paco2} mmHg`, status:"bad" });
          else                     disorders.push({ label:"Acidaemia — mixed picture", sub:"Check all values", status:"bad" });
        } else if (alkalaemic) {
          overallStatus = "warn";
          if (metAlk && respAlk)   disorders.push({ label:"Mixed Alkalosis", sub:"Metabolic + Respiratory", status:"warn" });
          else if (metAlk)         disorders.push({ label:"Metabolic Alkalosis", sub:`pH ${v.ph} · HCO₃ ${hco3.toFixed(1)} mEq/L`, status:"warn" });
          else if (respAlk)        disorders.push({ label:"Respiratory Alkalosis", sub:`pH ${v.ph} · PaCO₂ ${v.paco2} mmHg`, status:"warn" });
          else                     disorders.push({ label:"Alkalaemia — mixed picture", sub:"Check all values", status:"warn" });
        } else {
          // Normal pH — compensated or mixed
          if      (metAcid && respAlk) disorders.push({ label:"Compensated Metabolic Acidosis",  sub:"pH corrected by hyperventilation", status:"info" });
          else if (metAlk  && respAcid) disorders.push({ label:"Compensated Metabolic Alkalosis", sub:"pH corrected by hypoventilation",  status:"info" });
          else if (respAcid && metAlk)  disorders.push({ label:"Compensated Respiratory Acidosis", sub:"pH corrected by renal retention of HCO₃", status:"info" });
          else if (respAlk  && metAcid) disorders.push({ label:"Compensated Respiratory Alkalosis", sub:"pH corrected by renal excretion of HCO₃", status:"info" });
          else if (metAcid  && metAlk)  disorders.push({ label:"Mixed Metabolic Disorder", sub:"Concurrent metabolic acidosis + alkalosis", status:"warn" });
          else                          disorders.push({ label:"Normal Acid-Base", sub:`pH ${v.ph} · PaCO₂ ${v.paco2} · HCO₃ ${hco3.toFixed(1)}`, status:"ok" });
        }

        // ── Step 3: Compensation ──
        let comps = [];
        const isPrimaryMetAcid = acidaemic && metAcid && !respAcid;
        const isPrimaryMetAlk  = alkalaemic && metAlk && !respAlk;
        const isPrimaryRespAcid = acidaemic && respAcid && !metAcid;
        const isPrimaryRespAlk  = alkalaemic && respAlk && !metAlk;
        const isCompMetAcid    = normalPH && metAcid && respAlk;
        const isCompMetAlk     = normalPH && metAlk && respAcid;

        if (isPrimaryMetAcid || isCompMetAcid) {
          const exp = 1.5 * hco3 + 8;
          const lo  = exp - 2, hi = exp + 2;
          if (v.paco2 >= lo && v.paco2 <= hi)
            comps.push({ status:"ok",   label:"Respiratory compensation: appropriate (Winter's)", detail:`Expected PaCO₂ ${lo.toFixed(0)}–${hi.toFixed(0)} mmHg · Measured ${v.paco2}` });
          else if (v.paco2 > hi)
            comps.push({ status:"bad",  label:"Superimposed respiratory acidosis", detail:`PaCO₂ ${v.paco2} > expected ${lo.toFixed(0)}–${hi.toFixed(0)} mmHg` });
          else
            comps.push({ status:"warn", label:"Superimposed respiratory alkalosis", detail:`PaCO₂ ${v.paco2} < expected ${lo.toFixed(0)}–${hi.toFixed(0)} mmHg` });
        }

        if (isPrimaryMetAlk || isCompMetAlk) {
          const exp = 0.7 * hco3 + 21;
          const lo  = exp - 2, hi = exp + 2;
          if (v.paco2 >= lo && v.paco2 <= hi)
            comps.push({ status:"ok",   label:"Respiratory compensation: appropriate", detail:`Expected PaCO₂ ${lo.toFixed(0)}–${hi.toFixed(0)} mmHg · Measured ${v.paco2}` });
          else if (v.paco2 < lo)
            comps.push({ status:"warn", label:"Superimposed respiratory alkalosis", detail:`PaCO₂ ${v.paco2} < expected ${lo.toFixed(0)}–${hi.toFixed(0)} mmHg` });
          else
            comps.push({ status:"bad",  label:"Superimposed respiratory acidosis",  detail:`PaCO₂ ${v.paco2} > expected ${lo.toFixed(0)}–${hi.toFixed(0)} mmHg` });
        }

        if (isPrimaryRespAcid) {
          // Acute: ΔHCO₃ ≈ 1 per 10 rise. Chronic: ≈ 3.5 per 10 rise
          const deltaCO2  = v.paco2 - 40;
          const expAcute  = 24 + (deltaCO2 / 10) * 1;
          const expChronic = 24 + (deltaCO2 / 10) * 3.5;
          if (hco3 >= expAcute - 1 && hco3 <= expAcute + 1)
            comps.push({ status:"ok",   label:"Consistent with acute respiratory acidosis", detail:`Expected HCO₃ ≈ ${expAcute.toFixed(1)} mEq/L (acute) · Measured ${hco3.toFixed(1)}` });
          else if (hco3 >= expChronic - 2 && hco3 <= expChronic + 2)
            comps.push({ status:"ok",   label:"Consistent with chronic respiratory acidosis", detail:`Expected HCO₃ ≈ ${expChronic.toFixed(1)} mEq/L (chronic) · Measured ${hco3.toFixed(1)}` });
          else if (hco3 > expChronic + 2)
            comps.push({ status:"warn", label:"Superimposed metabolic alkalosis", detail:`HCO₃ ${hco3.toFixed(1)} > expected chronic response (${expChronic.toFixed(1)} mEq/L)` });
          else
            comps.push({ status:"warn", label:"Superimposed metabolic acidosis", detail:`HCO₃ ${hco3.toFixed(1)} < expected acute response (${expAcute.toFixed(1)} mEq/L)` });
        }

        if (isPrimaryRespAlk) {
          const deltaCO2  = 40 - v.paco2;
          const expAcute  = 24 - (deltaCO2 / 10) * 2;
          const expChronic = 24 - (deltaCO2 / 10) * 5;
          if (hco3 >= expAcute - 1 && hco3 <= expAcute + 1)
            comps.push({ status:"ok",   label:"Consistent with acute respiratory alkalosis", detail:`Expected HCO₃ ≈ ${expAcute.toFixed(1)} mEq/L · Measured ${hco3.toFixed(1)}` });
          else if (hco3 >= expChronic - 2 && hco3 <= expChronic + 2)
            comps.push({ status:"ok",   label:"Consistent with chronic respiratory alkalosis", detail:`Expected HCO₃ ≈ ${expChronic.toFixed(1)} mEq/L · Measured ${hco3.toFixed(1)}` });
          else
            comps.push({ status:"warn", label:"Compensation outside expected range", detail:`Acute expected: ${expAcute.toFixed(1)} · Chronic: ${expChronic.toFixed(1)} · Measured: ${hco3.toFixed(1)} mEq/L` });
        }

        // ── Step 4: AG (only if Na + Cl provided) ──
        let agData = null;
        if (v.na && v.cl) {
          const ag     = v.na - (v.cl + hco3);
          const agCorr = v.albumin ? ag + 2.5 * (4 - v.albumin) : null;
          const effAG  = agCorr ?? ag;
          const hagma  = effAG > 12;
          let dd = null;
          if (hagma) {
            const denom = 24 - hco3;
            dd = denom !== 0 ? parseFloat(((effAG - 12) / denom).toFixed(2)) : null;
          }
          agData = { ag: parseFloat(ag.toFixed(1)), agCorr, hagma, dd };
        }

        // ── Step 5: HCO₃ deficit (if metabolic acidosis + weight) ──
        let hco3Deficit = null;
        if (metAcid && v.weight) {
          const tbw = (v.female ? 0.5 : 0.6) * v.weight;
          hco3Deficit = Math.max(0, parseFloat((0.3 * v.weight * (24 - hco3)).toFixed(0)));
        }

        return { disorders, comps, agData, hco3Deficit, hco3, hco3Calc, overallStatus, v };
      }
    },

    winters: {
      label: "Winter's Formula", unit: "mmHg",
      note: "Expected PaCO₂ = 1.5 × HCO₃ + 8 (±2). Compare to measured PaCO₂.",
      fields: [
        { id:"hco3",  label:"HCO₃",        type:"number", placeholder:"mEq/L", min:5,  max:40  },
        { id:"paco2", label:"Measured PaCO₂", type:"number", placeholder:"mmHg",  min:10, max:100 }
      ],
      calculate: v => 1.5 * v.hco3 + 8,
      interpret: (r, v) => {
        const lo = r - 2, hi = r + 2;
        if (v.paco2 >= lo && v.paco2 <= hi) return { status:"ok",   label:"Appropriate respiratory compensation",   range:`Expected PaCO₂: ${lo.toFixed(0)}–${hi.toFixed(0)} · Measured: ${v.paco2}` };
        if (v.paco2 > hi)                    return { status:"bad",  label:"Superimposed respiratory acidosis",      range:`PaCO₂ ${v.paco2} > expected ${lo.toFixed(0)}–${hi.toFixed(0)} mmHg` };
                                             return { status:"warn", label:"Superimposed respiratory alkalosis",    range:`PaCO₂ ${v.paco2} < expected ${lo.toFixed(0)}–${hi.toFixed(0)} mmHg` };
      }
    },

    hco3_deficit: {
      label: "HCO₃ Deficit", unit: "mEq",
      note: "Deficit = 0.3 × weight × (24 − HCO₃). Give half over 4–6h; monitor pH.",
      fields: [
        { id:"weight", label:"Weight", type:"number", placeholder:"kg", min:1, max:400,
          unitToggle:{key:"wt", units:[{label:"kg",factor:1},{label:"lb",factor:0.453592}]} },
        { id:"hco3",   label:"HCO₃",  type:"number", placeholder:"mEq/L", min:2, max:24 }
      ],
      calculate: v => 0.3 * v.weight * (24 - v.hco3),
      interpret: (r, v) => {
        const half = (r / 2).toFixed(0);
        if (v.hco3 >= 18) return { status:"warn", label:"Mild deficit",     range:`Give ${half} mEq over 4–6h cautiously · Recheck ABG` };
        if (v.hco3 >= 12) return { status:"warn", label:"Moderate deficit", range:`${half} mEq first dose · Monitor pH & K⁺` };
                          return { status:"bad",  label:"Severe deficit",   range:`${half} mEq first dose · ICU monitoring · Watch K⁺ shift` };
      }
    },

    na_deficit: {
      label: "Sodium Deficit", unit: "mEq",
      note: "Na deficit = TBW × (target Na − actual Na). Max correction: 10–12 mEq/L/day.",
      fields: [
        { id:"weight",    label:"Weight",    type:"number", placeholder:"kg",    min:1,   max:400,
          unitToggle:{key:"wt", units:[{label:"kg",factor:1},{label:"lb",factor:0.453592}]} },
        { id:"na",        label:"Actual Na", type:"number", placeholder:"mEq/L", min:100, max:155 },
        { id:"target_na", label:"Target Na", type:"number", placeholder:"mEq/L", min:120, max:145 },
        { id:"female",    label:"Female sex", type:"checkbox" }
      ],
      calculate: v => (v.female ? 0.5 : 0.6) * v.weight * (v.target_na - v.na),
      interpret: (r, v) => {
        const dailyMax = (v.female ? 0.5 : 0.6) * v.weight * 10;
        if (v.target_na - v.na > 12) return { status:"bad",  label:"Target exceeds safe 24h correction", range:`Max: 10–12 mEq/L/day · ≈ ${dailyMax.toFixed(0)} mEq/day` };
        if (r < 0)                   return { status:"info", label:"Use Free Water Deficit calculator",  range:"For hypernatraemia, use the FWD formula" };
                                     return { status:"info", label:"Replace over 24–48h",               range:`Daily max ≈ ${dailyMax.toFixed(0)} mEq to avoid osmotic demyelination` };
      }
    },

    // ── Blood Gases ───────────────────────────────────────

    aa_grad: {
      label: "A-a Gradient", unit: "mmHg",
      note: "PAO₂ = FiO₂ × 713 − PaCO₂/0.8 · Normal ≈ age/4 + 4",
      fields: [
        { id:"pao2",  label:"PaO₂",  type:"number", placeholder:"mmHg",      min:20, max:700 },
        { id:"paco2", label:"PaCO₂", type:"number", placeholder:"mmHg",      min:10, max:100 },
        { id:"fio2",  label:"FiO₂",  type:"number", placeholder:"% (21–100)", min:21, max:100 },
        { id:"age",   label:"Age",   type:"number", placeholder:"years",     min:0,  max:120 }
      ],
      calculate: v => (v.fio2 / 100) * 713 - v.paco2 / 0.8 - v.pao2,
      interpret: (r, v) => {
        const exp  = v.age / 4 + 4;
        const diff = r - exp;
        if (r < 0)     return { status:"bad",  label:"Negative gradient — check values",  range:`Expected ≈ ${exp.toFixed(0)} mmHg (age ${v.age})` };
        if (diff <= 0) return { status:"ok",   label:"Normal A-a gradient",               range:`Expected ≈ ${exp.toFixed(0)} mmHg` };
        if (diff < 20) return { status:"warn", label:"Mildly elevated A-a gradient",      range:`Expected ≈ ${exp.toFixed(0)} · V/Q mismatch?` };
                       return { status:"bad",  label:"Markedly elevated A-a gradient",    range:`Expected ≈ ${exp.toFixed(0)} · Significant shunt or V/Q mismatch` };
      }
    },

    pf_ratio: {
      label: "P/F Ratio", unit: "",
      note: "ARDS Berlin: <300 mild · <200 moderate · <100 severe",
      fields: [
        { id:"pao2", label:"PaO₂", type:"number", placeholder:"mmHg",      min:20, max:700 },
        { id:"fio2", label:"FiO₂", type:"number", placeholder:"% (21–100)", min:21, max:100 }
      ],
      calculate: v => v.pao2 / (v.fio2 / 100),
      interpret: r => {
        if (r >= 400) return { status:"ok",   label:"Normal oxygenation",     range:"P/F ≥ 400" };
        if (r >= 300) return { status:"ok",   label:"Mild impairment",        range:"P/F 300 – 399" };
        if (r >= 200) return { status:"warn", label:"Mild ARDS (Berlin)",     range:"P/F 200 – 299" };
        if (r >= 100) return { status:"bad",  label:"Moderate ARDS (Berlin)", range:"P/F 100 – 199" };
                      return { status:"bad",  label:"Severe ARDS (Berlin)",   range:"P/F < 100" };
      }
    },

    // ── Hematology ────────────────────────────────────────

    anc: {
      label: "ANC", unit: "cells/µL",
      note: "ANC = WBC × (Neutrophils% + Bands%) / 100",
      fields: [
        { id:"wbc",   label:"WBC",         type:"number", placeholder:"×10³/µL", min:0.1, max:100 },
        { id:"neut",  label:"Neutrophils", type:"number", placeholder:"%",       min:0,   max:100 },
        { id:"bands", label:"Bands",       type:"number", placeholder:"% (0 if none)", min:0, max:50 }
      ],
      calculate: v => v.wbc * 1000 * (v.neut + v.bands) / 100,
      interpret: r => {
        if (r >= 1500) return { status:"ok",   label:"Normal ANC",           range:"ANC ≥ 1500 cells/µL" };
        if (r >= 1000) return { status:"warn", label:"Mild neutropenia",     range:"ANC 1000 – 1499 · Monitor for infection" };
        if (r >= 500)  return { status:"bad",  label:"Moderate neutropenia", range:"ANC 500 – 999 · Infection risk elevated" };
                       return { status:"bad",  label:"Severe neutropenia",   range:"ANC < 500 · High risk · Consider G-CSF, isolation" };
      }
    },

    retic_idx: {
      label: "Retic. Index", unit: "",
      note: "CRC = Retic% × (Hct/45). RPI = CRC / maturation factor. RPI < 2 = hypoproliferative.",
      fields: [
        { id:"retic", label:"Reticulocytes", type:"number", placeholder:"%", min:0, max:20 },
        { id:"hct",   label:"Haematocrit",   type:"number", placeholder:"%", min:5, max:70 }
      ],
      calculate: v => {
        const crc = v.retic * (v.hct / 45);
        const mf  = v.hct < 15 ? 2.5 : v.hct < 25 ? 2.0 : v.hct < 35 ? 1.5 : 1.0;
        return crc / mf;
      },
      interpret: r => {
        if (r >= 3)  return { status:"ok",   label:"Adequate marrow response",   range:"RPI ≥ 3: appropriate (blood loss / haemolysis)" };
        if (r >= 2)  return { status:"warn", label:"Borderline response",        range:"RPI 2–3: borderline — correlate clinically" };
                     return { status:"bad",  label:"Hypoproliferative anaemia",  range:"RPI < 2: iron deficiency, renal failure, aplasia, B12/folate" };
      }
    },

    wbc_corrected: {
      label: "Corrected WBC", unit: "×10³/µL",
      note: "True WBC = (Reported WBC × 100) / (100 + NRBC per 100 WBC)",
      fields: [
        { id:"wbc",  label:"Reported WBC", type:"number", placeholder:"×10³/µL",      min:0.1, max:200 },
        { id:"nrbc", label:"NRBCs",        type:"number", placeholder:"per 100 WBCs", min:0,   max:200 }
      ],
      calculate: v => (v.wbc * 100) / (100 + v.nrbc),
      interpret: (r, v) => {
        if (v.nrbc === 0) return { status:"info", label:"No NRBCs — no correction needed", range:"Reported WBC = True WBC" };
        return { status:"info", label:`WBC overcounted by ${(v.wbc - r).toFixed(1)} ×10³/µL`, range:"NRBCs counted as WBCs by automated analysers" };
      }
    },

    // ── Fluids & Burns ────────────────────────────────────

    parkland: {
      label: "Parkland (Burns)", unit: "mL / 24h",
      note: "4 mL × weight × TBSA%. Give 50% in first 8h from burn time, 50% over next 16h.",
      fields: [
        { id:"weight", label:"Weight", type:"number", placeholder:"kg", min:1, max:400,
          unitToggle:{key:"wt", units:[{label:"kg",factor:1},{label:"lb",factor:0.453592}]} },
        { id:"tbsa",   label:"TBSA Burned", type:"number", placeholder:"%", min:1, max:100 }
      ],
      calculate: v => 4 * v.weight * v.tbsa,
      interpret: (r, v) => ({
        status: v.tbsa >= 20 ? "bad" : v.tbsa >= 10 ? "warn" : "info",
        label:  `First 8h: ${(r/2).toFixed(0)} mL (${(r/2/8).toFixed(0)} mL/h) · Next 16h: ${(r/2).toFixed(0)} mL`,
        range:  "Add maintenance fluids separately · Titrate to UO 0.5–1 mL/kg/h"
      })
    },

    holliday: {
      label: "Maintenance IV", unit: "mL/day",
      note: "Holliday-Segar: 100 mL/kg (≤10 kg) + 50 mL/kg (10–20 kg) + 20 mL/kg (>20 kg)",
      fields: [
        { id:"weight", label:"Weight", type:"number", placeholder:"kg", min:1, max:150,
          unitToggle:{key:"wt", units:[{label:"kg",factor:1},{label:"lb",factor:0.453592}]} }
      ],
      calculate: v => {
        if (v.weight <= 10)  return v.weight * 100;
        if (v.weight <= 20)  return 1000 + (v.weight - 10) * 50;
                             return 1500 + (v.weight - 20) * 20;
      },
      interpret: r => ({
        status: "info",
        label:  `${(r / 24).toFixed(0)} mL/hour`,
        range:  "Adjust for fever (+10%/°C), insensible losses, clinical status"
      })
    },

    // ── Pulmonology ───────────────────────────────────────

    tidal_vol: {
      label: "Tidal Volume", unit: "mL",
      note: "Lung-protective: 6–8 mL/kg IBW. Always use IBW (not actual weight).",
      fields: [
        { id:"height", label:"Height", type:"number", placeholder:"cm", min:100, max:250,
          unitToggle:{key:"ht", units:[{label:"cm",factor:1},{label:"in",factor:2.54}]} },
        { id:"female", label:"Female sex", type:"checkbox" },
        { id:"tv_per_kg", label:"Target Vt (mL/kg)", type:"select",
          options:[{value:"6",label:"6 mL/kg (ARDS)"},{value:"7",label:"7 mL/kg (standard)"},{value:"8",label:"8 mL/kg (max protective)"}] }
      ],
      calculate: v => ((v.female ? 45.5 : 50.0) + 2.3 * (v.height / 2.54 - 60)) * parseFloat(v.tv_per_kg),
      interpret: (r, v) => {
        const ibw = (v.female ? 45.5 : 50.0) + 2.3 * (v.height / 2.54 - 60);
        return { status:"info", label:`Based on IBW ${ibw.toFixed(1)} kg`, range:`Set Vt ${r.toFixed(0)} mL · Plateau pressure < 30 cmH₂O · PEEP per ARDSNet table` };
      }
    },

    min_vent: {
      label: "Minute Ventilation", unit: "L/min",
      note: "MV = RR × Tidal Volume. Normal: 5–8 L/min at rest.",
      fields: [
        { id:"rr", label:"Respiratory Rate", type:"number", placeholder:"/min", min:1,  max:60   },
        { id:"vt", label:"Tidal Volume",     type:"number", placeholder:"mL",   min:50, max:1500 }
      ],
      calculate: v => (v.rr * v.vt) / 1000,
      interpret: r => {
        if (r < 3)   return { status:"bad",  label:"Severe hypoventilation",          range:"Normal: 5 – 8 L/min · < 3 = respiratory failure imminent" };
        if (r < 5)   return { status:"warn", label:"Hypoventilation",                 range:"Normal: 5 – 8 L/min" };
        if (r <= 8)  return { status:"ok",   label:"Normal minute ventilation",       range:"Normal: 5 – 8 L/min" };
        if (r <= 12) return { status:"warn", label:"Elevated — possible hyperventilation", range:"Pain, anxiety, metabolic acidosis compensation?" };
                     return { status:"bad",  label:"Severe hyperventilation",         range:"Respiratory alkalosis risk" };
      }
    },

    // ── Obstetrics ────────────────────────────────────────

    ob: {
      label: "EDD / GA", unit: "",
      isOb: true,
      fields: [{ id:"lmp", label:"Last Menstrual Period", type:"date" }],
      calculate: v => {
        const lmp = new Date(v.lmp + "T00:00:00"), now = new Date();
        if (lmp > now) return { error: "LMP cannot be in the future" };
        const days = Math.floor((now - lmp) / 86400000);
        const weeks = Math.floor(days / 7), rem = days % 7;
        if (weeks > 45) return { error: "Gestational age > 45 weeks — verify LMP" };
        const edd = new Date(lmp); edd.setDate(edd.getDate() + 280);
        const daysToEdd = Math.ceil((edd - now) / 86400000);
        const conception = new Date(lmp); conception.setDate(conception.getDate() + 14);
        let trimester = 1, trimClass = "t1";
        if (weeks >= 14 && weeks < 28) { trimester = 2; trimClass = "t2"; }
        if (weeks >= 28)               { trimester = 3; trimClass = "t3"; }
        return { weeks, rem, edd, daysToEdd, conception, trimester, trimClass, pctComplete: Math.min(100, (days/280)*100), days };
      }
    },


    // ── Ventilator ────────────────────────────────────────

    vent_setup: {
      label: "Vent Setup / IBW", isVentCard: true,
      note: "Calculate IBW, target tidal volume, minute ventilation, and I:E ratio.",
      fields: [
        { id:"height", label:"Height", type:"number", placeholder:"cm", min:100, max:250,
          unitToggle:{key:"ht", units:[{label:"cm",factor:1},{label:"in",factor:2.54}]} },
        { id:"female", label:"Female sex", type:"checkbox" },
        { id:"vt_ml",  label:"Set Tidal Volume", type:"number", placeholder:"mL", min:50, max:1500 },
        { id:"rr",     label:"Set RR", type:"number", placeholder:"breaths/min", min:4, max:60 },
        { id:"peep",   label:"PEEP", type:"number", placeholder:"cmH₂O", min:0, max:30 },
        { id:"fio2",   label:"FiO₂", type:"number", placeholder:"% (21–100)", min:21, max:100 },
        { id:"ti",     label:"Inspiratory Time (Ti)", type:"number", placeholder:"sec e.g. 1.0", min:0.2, max:3, optional:true }
      ],
      calculate: v => {
        const ibw = (v.female ? 45.5 : 50.0) + 2.3 * (v.height / 2.54 - 60);
        const vt_per_ibw = v.vt_ml / ibw;
        const mv = (v.vt_ml * v.rr) / 1000;
        const ttot = 60 / v.rr;
        let ti = v.ti || null, te = null, ie_ratio = null;
        if (ti) { te = ttot - ti; ie_ratio = ti / te; }
        return { ibw: parseFloat(ibw.toFixed(1)), vt_per_ibw: parseFloat(vt_per_ibw.toFixed(2)),
                 mv: parseFloat(mv.toFixed(2)), ttot: parseFloat(ttot.toFixed(2)),
                 ti, te: te ? parseFloat(te.toFixed(2)) : null,
                 ie_ratio: ie_ratio ? parseFloat(ie_ratio.toFixed(3)) : null,
                 vt_ml: v.vt_ml, rr: v.rr, peep: v.peep, fio2: v.fio2, female: v.female };
      }
    },

    vent_mechanics: {
      label: "Vent Mechanics", isVentCard: true,
      note: "Lung mechanics: compliance, resistance, driving pressure, mechanical power, time constant.",
      fields: [
        { id:"vt_ml",      label:"Tidal Volume",       type:"number", placeholder:"mL",          min:50,  max:1500 },
        { id:"rr",         label:"RR",                  type:"number", placeholder:"breaths/min",  min:4,   max:60   },
        { id:"ppeak",      label:"Peak Pressure",       type:"number", placeholder:"cmH₂O",        min:1,   max:80   },
        { id:"pplat",      label:"Plateau Pressure",    type:"number", placeholder:"cmH₂O",        min:1,   max:60   },
        { id:"peep",       label:"PEEP",                type:"number", placeholder:"cmH₂O",        min:0,   max:30   },
        { id:"flow_L_s",   label:"Insp. Flow",          type:"number", placeholder:"L/min (e.g. 60)", min:6, max:120 }
      ],
      validate: v => v.pplat > v.ppeak ? "Pplat cannot exceed Ppeak" : null,
      calculate: v => {
        const vt_L     = v.vt_ml / 1000;
        const flow_Ls  = v.flow_L_s / 60;     // convert L/min → L/s for physics
        const dp       = v.pplat - v.peep;    // driving pressure
        const c_stat   = dp > 0 ? v.vt_ml / dp : null;
        const c_dyn    = (v.ppeak - v.peep) > 0 ? v.vt_ml / (v.ppeak - v.peep) : null;
        const rrs      = (v.ppeak - v.pplat) / flow_Ls;   // cmH₂O / (L/s)
        const ecrs     = c_stat ? 1000 / c_stat : null;   // elastance cmH₂O/L
        // Mechanical Power (Becher formula, J/min)
        const mp = (ecrs !== null)
          ? parseFloat((0.098 * v.rr * vt_L * ((vt_L * ecrs / 2) + v.peep + (rrs * flow_Ls))).toFixed(1))
          : null;
        // Time constant τ = Crs(L) × Rrs
        const tau = c_stat ? parseFloat((c_stat / 1000 * rrs).toFixed(2)) : null;
        return {
          c_stat: c_stat ? parseFloat(c_stat.toFixed(1)) : null,
          c_dyn:  c_dyn  ? parseFloat(c_dyn.toFixed(1))  : null,
          rrs:    parseFloat(rrs.toFixed(1)),
          dp:     parseFloat(dp.toFixed(1)),
          mp, tau,
          vt_ml: v.vt_ml, rr: v.rr, ppeak: v.ppeak, pplat: v.pplat, peep: v.peep
        };
      }
    },

    vent_gas: {
      label: "Gas Exchange", isVentCard: true,
      note: "Oxygenation & ventilation indices. PeCO₂ optional for dead space.",
      fields: [
        { id:"pao2",  label:"PaO₂",  type:"number", placeholder:"mmHg",      min:20,  max:700 },
        { id:"paco2", label:"PaCO₂", type:"number", placeholder:"mmHg",      min:10,  max:120 },
        { id:"fio2",  label:"FiO₂",  type:"number", placeholder:"% (21–100)", min:21,  max:100 },
        { id:"map_aw",label:"Mean Airway Pressure", type:"number", placeholder:"cmH₂O (for OI)", min:1, max:40 },
        { id:"age",   label:"Patient Age", type:"number", placeholder:"years (for A-a norm)", min:0, max:120, optional:true },
        { id:"peco2", label:"PeCO₂/EtCO₂", type:"number", placeholder:"mmHg (for Vd/Vt)", min:5, max:80, optional:true }
      ],
      calculate: v => {
        const fio2_dec = v.fio2 / 100;
        const pf = v.pao2 / fio2_dec;
        const oi = (v.map_aw * v.fio2) / v.pao2 * 100;
        const pao2_alv = fio2_dec * 713 - v.paco2 / 0.8;
        const aa = pao2_alv - v.pao2;
        const aa_norm = v.age ? (v.age / 4 + 4) : 10;
        const vd_vt = v.peco2 ? (v.paco2 - v.peco2) / v.paco2 : null;
        return { pf: parseFloat(pf.toFixed(0)), oi: parseFloat(oi.toFixed(1)),
                 aa: parseFloat(aa.toFixed(0)), aa_norm: parseFloat(aa_norm.toFixed(0)),
                 vd_vt: vd_vt ? parseFloat(vd_vt.toFixed(2)) : null,
                 fio2: v.fio2, pao2: v.pao2, paco2: v.paco2 };
      }
    },

    vent_weaning: {
      label: "Weaning Readiness", isVentCard: true,
      note: "RSBI, P0.1, NIF, and SBT checklist to assess extubation readiness.",
      fields: [
        { id:"rr",   label:"Spontaneous RR",    type:"number", placeholder:"breaths/min", min:4,  max:60   },
        { id:"vt_ml",label:"Spontaneous VT",    type:"number", placeholder:"mL",          min:50, max:1200 },
        { id:"p01",  label:"P0.1",              type:"number", placeholder:"cmH₂O",       min:0,  max:20   },
        { id:"nif",  label:"NIF / MIP",         type:"number", placeholder:"cmH₂O (abs val)", min:0, max:100, optional:true },
        { id:"fio2", label:"Current FiO₂",      type:"number", placeholder:"% (21–100)",  min:21, max:100  },
        { id:"peep", label:"Current PEEP",       type:"number", placeholder:"cmH₂O",       min:0,  max:20   },
        { id:"pao2", label:"PaO₂",              type:"number", placeholder:"mmHg (for P/F check)", min:20, max:700, optional:true }
      ],
      calculate: v => {
        const rsbi = v.rr / (v.vt_ml / 1000);
        const pf   = v.pao2 ? v.pao2 / (v.fio2 / 100) : null;
        return { rsbi: parseFloat(rsbi.toFixed(0)), p01: v.p01, nif: v.nif || null, pf, v };
      }
    },

    // ── Vasopressors ──────────────────────────────────────

    norepi: {
      label: "Norepinephrine", isDrugCard: true,
      drugInfo: {
        name: "Norepinephrine (Levophed)", drugClass: "Vasopressor  α₁ >> β₁",
        classColor: "#fee2e2", classText: "#9f1239",
        calcType: "weight_min", doseUnit: "mcg/kg/min", concUnit: "mcg/mL",
        stdConc: [
          { label: "Standard",  prep: "4 mg / 250 mL NS",  conc: 16  },
          { label: "Double",    prep: "8 mg / 250 mL NS",  conc: 32  },
          { label: "Quad",      prep: "16 mg / 250 mL NS", conc: 64  },
        ],
        ranges: [
          { label:"Low / Starting",  min:0.01, max:0.1,  color:"#d1fae5", text:"#065f46" },
          { label:"Moderate",        min:0.1,  max:0.5,  color:"#fef3c7", text:"#92400e" },
          { label:"High / Refractory", min:0.5, max:3,  color:"#fee2e2", text:"#9f1239" },
        ],
        note: "1st-line vasopressor in septic shock. Titrate to MAP ≥ 65 mmHg. Central line preferred.",
        prepUnit: "mg", prepFactor: 1000
      },
      fields: [
        { id:"weight", label:"Weight", type:"number", placeholder:"kg", min:1, max:400,
          unitToggle:{key:"wt", units:[{label:"kg",factor:1},{label:"lb",factor:0.453592}]} },
        { id:"dose",   label:"Dose (mcg/kg/min)", type:"number", placeholder:"e.g. 0.05", min:0.001, max:10 },
        { id:"conc",   label:"Concentration (mcg/mL)", type:"number", optional:true, placeholder:"e.g. 16", min:0.1, max:5000 },
        { id:"pump_rate", label:"Pump Rate (reverse calc)", type:"number", placeholder:"mL/hr → shows dose", optional:true }
      ],
      calculate: v => {
        const rate = (v.dose * v.weight * 60) / v.conc;
        const rev  = v.pump_rate ? (v.pump_rate * v.conc) / (v.weight * 60) : null;
        return { rate: parseFloat(rate.toFixed(2)), rev: rev ? parseFloat(rev.toFixed(4)) : null,
                 dose:v.dose, weight:v.weight, conc:v.conc, pumpRate:v.pump_rate };
      }
    },

    epi: {
      label: "Epinephrine", isDrugCard: true,
      drugInfo: {
        name: "Epinephrine (Adrenaline)", drugClass: "Vasopressor / Inotrope  α+β",
        classColor: "#fee2e2", classText: "#9f1239",
        calcType: "weight_min", doseUnit: "mcg/kg/min", concUnit: "mcg/mL",
        stdConc: [
          { label: "Standard", prep: "2 mg / 250 mL NS",  conc: 8  },
          { label: "Double",   prep: "4 mg / 250 mL NS",  conc: 16 },
        ],
        ranges: [
          { label:"Low (inotrope)",    min:0.01, max:0.1,  color:"#d1fae5", text:"#065f46" },
          { label:"Moderate (mixed)",  min:0.1,  max:0.5,  color:"#fef3c7", text:"#92400e" },
          { label:"High (vasopressor)", min:0.5, max:1,    color:"#fee2e2", text:"#9f1239" },
        ],
        note: "1st-line in anaphylaxis and cardiac arrest. Low dose → β1/β2 (inotrope), high dose → α1 (vasoconstrict). Risk of tachyarrhythmia.",
        prepUnit: "mg", prepFactor: 1000
      },
      fields: [
        { id:"weight", label:"Weight", type:"number", placeholder:"kg", min:1, max:400,
          unitToggle:{key:"wt", units:[{label:"kg",factor:1},{label:"lb",factor:0.453592}]} },
        { id:"dose", label:"Dose (mcg/kg/min)", type:"number", placeholder:"e.g. 0.05", min:0.001, max:5 },
        { id:"conc", label:"Concentration (mcg/mL)", type:"number", optional:true, placeholder:"e.g. 8", min:0.1, max:1000 },
        { id:"pump_rate", label:"Pump Rate (reverse)", type:"number", placeholder:"mL/hr → shows dose", optional:true }
      ],
      calculate: v => {
        const rate = (v.dose * v.weight * 60) / v.conc;
        const rev  = v.pump_rate ? (v.pump_rate * v.conc) / (v.weight * 60) : null;
        return { rate:parseFloat(rate.toFixed(2)), rev:rev?parseFloat(rev.toFixed(4)):null,
                 dose:v.dose, weight:v.weight, conc:v.conc, pumpRate:v.pump_rate };
      }
    },

    dopamine: {
      label: "Dopamine", isDrugCard: true,
      drugInfo: {
        name: "Dopamine", drugClass: "Inotrope / Vasopressor  (dose-dependent)",
        classColor: "#fef3c7", classText: "#92400e",
        calcType: "weight_min", doseUnit: "mcg/kg/min", concUnit: "mcg/mL",
        stdConc: [
          { label: "Standard", prep: "400 mg / 250 mL D5W", conc: 1600 },
          { label: "Double",   prep: "800 mg / 250 mL D5W", conc: 3200 },
        ],
        ranges: [
          { label:"Renal (DA)",   min:1, max:3,  color:"#dbeafe", text:"#1e40af" },
          { label:"Inotrope (β1)", min:3, max:10, color:"#d1fae5", text:"#065f46" },
          { label:"Vasopressor (α1)", min:10, max:20, color:"#fee2e2", text:"#9f1239" },
        ],
        note: "Low 1–3: dopaminergic (splanchnic). Mid 3–10: β1 inotrope. High >10: α1 vasoconstriction. Rarely used in modern ICU.",
        prepUnit: "mg", prepFactor: 1000
      },
      fields: [
        { id:"weight", label:"Weight", type:"number", placeholder:"kg", min:1, max:400,
          unitToggle:{key:"wt", units:[{label:"kg",factor:1},{label:"lb",factor:0.453592}]} },
        { id:"dose", label:"Dose (mcg/kg/min)", type:"number", placeholder:"e.g. 5", min:0.5, max:25 },
        { id:"conc", label:"Concentration (mcg/mL)", type:"number", optional:true, placeholder:"e.g. 1600", min:100, max:10000 },
        { id:"pump_rate", label:"Pump Rate (reverse)", type:"number", placeholder:"mL/hr", optional:true }
      ],
      calculate: v => {
        const rate = (v.dose * v.weight * 60) / v.conc;
        const rev  = v.pump_rate ? (v.pump_rate * v.conc) / (v.weight * 60) : null;
        return { rate:parseFloat(rate.toFixed(2)), rev:rev?parseFloat(rev.toFixed(2)):null,
                 dose:v.dose, weight:v.weight, conc:v.conc, pumpRate:v.pump_rate };
      }
    },

    dobutamine: {
      label: "Dobutamine", isDrugCard: true,
      drugInfo: {
        name: "Dobutamine", drugClass: "Inotrope  β1 >> β2",
        classColor: "#dbeafe", classText: "#1e40af",
        calcType: "weight_min", doseUnit: "mcg/kg/min", concUnit: "mcg/mL",
        stdConc: [
          { label: "Standard", prep: "250 mg / 250 mL D5W", conc: 1000 },
          { label: "Double",   prep: "500 mg / 250 mL D5W", conc: 2000 },
        ],
        ranges: [
          { label:"Low / Starting",    min:2.5, max:5,  color:"#d1fae5", text:"#065f46" },
          { label:"Moderate inotrope", min:5,   max:15, color:"#fef3c7", text:"#92400e" },
          { label:"High",              min:15,  max:20, color:"#fee2e2", text:"#9f1239" },
        ],
        note: "Positive inotrope in cardiogenic shock. May worsen hypotension via β2 vasodilation. Monitor for tachyarrhythmia.",
        prepUnit: "mg", prepFactor: 1000
      },
      fields: [
        { id:"weight", label:"Weight", type:"number", placeholder:"kg", min:1, max:400,
          unitToggle:{key:"wt", units:[{label:"kg",factor:1},{label:"lb",factor:0.453592}]} },
        { id:"dose", label:"Dose (mcg/kg/min)", type:"number", placeholder:"e.g. 5", min:0.5, max:40 },
        { id:"conc", label:"Concentration (mcg/mL)", type:"number", optional:true, placeholder:"e.g. 1000", min:100, max:5000 },
        { id:"pump_rate", label:"Pump Rate (reverse)", type:"number", placeholder:"mL/hr", optional:true }
      ],
      calculate: v => {
        const rate = (v.dose * v.weight * 60) / v.conc;
        const rev  = v.pump_rate ? (v.pump_rate * v.conc) / (v.weight * 60) : null;
        return { rate:parseFloat(rate.toFixed(2)), rev:rev?parseFloat(rev.toFixed(2)):null,
                 dose:v.dose, weight:v.weight, conc:v.conc, pumpRate:v.pump_rate };
      }
    },

    vasopressin: {
      label: "Vasopressin", isDrugCard: true,
      drugInfo: {
        name: "Vasopressin (ADH)", drugClass: "Vasopressor  V1 receptor",
        classColor: "#f5f3ff", classText: "#5b21b6",
        calcType: "flat_hr", doseUnit: "units/hr", concUnit: "units/mL",
        stdConc: [
          { label: "Standard", prep: "20 units / 100 mL NS", conc: 0.2 },
          { label: "Concentrated", prep: "40 units / 100 mL NS", conc: 0.4 },
        ],
        ranges: [
          { label:"Standard fixed dose", min:1.2, max:2.4, color:"#d1fae5", text:"#065f46" },
          { label:"High (adjunct)",      min:2.4, max:3.6, color:"#fef3c7", text:"#92400e" },
        ],
        note: "Usually dosed at 0.03–0.04 units/min (1.8–2.4 units/hr) — not titrated. Add as adjunct to NE in refractory septic shock. No weight adjustment.",
        prepUnit: "units", prepFactor: 1
      },
      fields: [
        { id:"dose", label:"Dose (units/hr)", type:"number", placeholder:"e.g. 2.4 (= 0.04 u/min)", min:0.1, max:10 },
        { id:"conc", label:"Concentration (units/mL)", type:"number", optional:true, placeholder:"e.g. 0.2", min:0.01, max:2 },
        { id:"pump_rate", label:"Pump Rate (reverse)", type:"number", placeholder:"mL/hr", optional:true }
      ],
      calculate: v => {
        const rate = v.dose / v.conc;
        const rev  = v.pump_rate ? v.pump_rate * v.conc : null;
        return { rate:parseFloat(rate.toFixed(1)), rev:rev?parseFloat(rev.toFixed(3)):null,
                 dose:v.dose, conc:v.conc, pumpRate:v.pump_rate };
      }
    },

    phenylephrine: {
      label: "Phenylephrine", isDrugCard: true,
      drugInfo: {
        name: "Phenylephrine (Neo-Synephrine)", drugClass: "Vasopressor  pure α₁",
        classColor: "#fee2e2", classText: "#9f1239",
        calcType: "weight_min", doseUnit: "mcg/kg/min", concUnit: "mcg/mL",
        stdConc: [
          { label: "Standard", prep: "20 mg / 250 mL NS",  conc: 80  },
          { label: "Double",   prep: "100 mg / 250 mL NS", conc: 400 },
        ],
        ranges: [
          { label:"Starting",   min:0.5, max:1.5, color:"#d1fae5", text:"#065f46" },
          { label:"Moderate",   min:1.5, max:4,   color:"#fef3c7", text:"#92400e" },
          { label:"High",       min:4,   max:9,   color:"#fee2e2", text:"#9f1239" },
        ],
        note: "Pure α1 vasoconstrictor. No β effect → may cause reflex bradycardia. Use in distributive shock with tachyarrhythmia; avoid in cardiogenic shock.",
        prepUnit: "mg", prepFactor: 1000
      },
      fields: [
        { id:"weight", label:"Weight", type:"number", placeholder:"kg", min:1, max:400,
          unitToggle:{key:"wt", units:[{label:"kg",factor:1},{label:"lb",factor:0.453592}]} },
        { id:"dose", label:"Dose (mcg/kg/min)", type:"number", placeholder:"e.g. 1", min:0.1, max:15 },
        { id:"conc", label:"Concentration (mcg/mL)", type:"number", optional:true, placeholder:"e.g. 80", min:1, max:2000 },
        { id:"pump_rate", label:"Pump Rate (reverse)", type:"number", placeholder:"mL/hr", optional:true }
      ],
      calculate: v => {
        const rate = (v.dose * v.weight * 60) / v.conc;
        const rev  = v.pump_rate ? (v.pump_rate * v.conc) / (v.weight * 60) : null;
        return { rate:parseFloat(rate.toFixed(2)), rev:rev?parseFloat(rev.toFixed(2)):null,
                 dose:v.dose, weight:v.weight, conc:v.conc, pumpRate:v.pump_rate };
      }
    },

    milrinone: {
      label: "Milrinone", isDrugCard: true,
      drugInfo: {
        name: "Milrinone (Primacor)", drugClass: "Inodilator  PDE-3 inhibitor",
        classColor: "#dbeafe", classText: "#1e40af",
        calcType: "weight_min", doseUnit: "mcg/kg/min", concUnit: "mcg/mL",
        stdConc: [
          { label: "Standard", prep: "20 mg / 100 mL NS", conc: 200 },
          { label: "Diluted",  prep: "20 mg / 200 mL NS", conc: 100 },
        ],
        ranges: [
          { label:"Low",      min:0.375, max:0.5,  color:"#d1fae5", text:"#065f46" },
          { label:"Standard", min:0.5,   max:0.625, color:"#fef3c7", text:"#92400e" },
          { label:"High",     min:0.625, max:0.75, color:"#fee2e2", text:"#9f1239" },
        ],
        note: "Positive inotrope + vasodilator. Useful in pulmonary hypertension and RV failure. Dose-reduce in renal impairment (CrCl <50). Loading dose optional: 50 mcg/kg over 10 min.",
        prepUnit: "mg", prepFactor: 1000
      },
      fields: [
        { id:"weight", label:"Weight", type:"number", placeholder:"kg", min:1, max:400,
          unitToggle:{key:"wt", units:[{label:"kg",factor:1},{label:"lb",factor:0.453592}]} },
        { id:"dose", label:"Dose (mcg/kg/min)", type:"number", placeholder:"e.g. 0.5", min:0.1, max:1.5 },
        { id:"conc", label:"Concentration (mcg/mL)", type:"number", optional:true, placeholder:"e.g. 200", min:10, max:1000 },
        { id:"pump_rate", label:"Pump Rate (reverse)", type:"number", placeholder:"mL/hr", optional:true }
      ],
      calculate: v => {
        const rate = (v.dose * v.weight * 60) / v.conc;
        const rev  = v.pump_rate ? (v.pump_rate * v.conc) / (v.weight * 60) : null;
        return { rate:parseFloat(rate.toFixed(2)), rev:rev?parseFloat(rev.toFixed(4)):null,
                 dose:v.dose, weight:v.weight, conc:v.conc, pumpRate:v.pump_rate };
      }
    },

    // ── Sedation & Analgesia ──────────────────────────────

    propofol: {
      label: "Propofol", isDrugCard: true,
      drugInfo: {
        name: "Propofol (Diprivan)", drugClass: "Sedative  GABA-A agonist",
        classColor: "#fdf2f8", classText: "#86198f",
        calcType: "weight_min", doseUnit: "mcg/kg/min", concUnit: "mcg/mL",
        stdConc: [
          { label: "Standard 1%",  prep: "10 mg/mL (premix)",   conc: 10000 },
          { label: "Standard 2%",  prep: "20 mg/mL (premix)",   conc: 20000 },
        ],
        ranges: [
          { label:"Light sedation (RASS -1 to -2)", min:5,  max:25, color:"#d1fae5", text:"#065f46" },
          { label:"Moderate (RASS -2 to -3)",        min:25, max:50, color:"#fef3c7", text:"#92400e" },
          { label:"Deep / procedural",               min:50, max:80, color:"#fee2e2", text:"#9f1239" },
        ],
        note: "Monitor for PRIS (propofol infusion syndrome) with doses >4 mg/kg/hr (≈67 mcg/kg/min) beyond 48h. Contains 1.1 kcal/mL — adjust nutrition. Triglycerides if infusion >48h.",
        prepUnit: "mg", prepFactor: 1000
      },
      fields: [
        { id:"weight", label:"Weight", type:"number", placeholder:"kg", min:1, max:400,
          unitToggle:{key:"wt", units:[{label:"kg",factor:1},{label:"lb",factor:0.453592}]} },
        { id:"dose", label:"Dose (mcg/kg/min)", type:"number", placeholder:"e.g. 20", min:1, max:200 },
        { id:"conc", label:"Concentration (mcg/mL)", type:"number", optional:true, placeholder:"e.g. 10000 for 1%", min:1000, max:25000 },
        { id:"pump_rate", label:"Pump Rate (reverse)", type:"number", placeholder:"mL/hr", optional:true }
      ],
      calculate: v => {
        const rate = (v.dose * v.weight * 60) / v.conc;
        const rev  = v.pump_rate ? (v.pump_rate * v.conc) / (v.weight * 60) : null;
        // Lipid calories: 1.1 kcal/mL
        const kcal_hr = parseFloat((rate * 1.1).toFixed(1));
        return { rate:parseFloat(rate.toFixed(2)), rev:rev?parseFloat(rev.toFixed(2)):null,
                 dose:v.dose, weight:v.weight, conc:v.conc, pumpRate:v.pump_rate,
                 extra: `Lipid load: ${kcal_hr} kcal/hr (${parseFloat((kcal_hr*24).toFixed(0))} kcal/day)` };
      }
    },

    midazolam: {
      label: "Midazolam", isDrugCard: true,
      drugInfo: {
        name: "Midazolam (Versed)", drugClass: "Benzodiazepine  GABA-A agonist",
        classColor: "#fdf2f8", classText: "#86198f",
        calcType: "weight_hr", doseUnit: "mcg/kg/hr", concUnit: "mcg/mL",
        stdConc: [
          { label: "Standard",    prep: "50 mg / 50 mL NS",  conc: 1000 },
          { label: "Concentrated", prep: "100 mg / 50 mL NS", conc: 2000 },
        ],
        ranges: [
          { label:"Low",      min:20, max:60,  color:"#d1fae5", text:"#065f46" },
          { label:"Moderate", min:60, max:120, color:"#fef3c7", text:"#92400e" },
          { label:"High",     min:120, max:200, color:"#fee2e2", text:"#9f1239" },
        ],
        note: "Active metabolite accumulates in renal failure. Risk of delirium — prefer propofol/dexmed. Avoid prolonged use (>48–72h) due to tolerance and withdrawal.",
        prepUnit: "mg", prepFactor: 1000
      },
      fields: [
        { id:"weight", label:"Weight", type:"number", placeholder:"kg", min:1, max:400,
          unitToggle:{key:"wt", units:[{label:"kg",factor:1},{label:"lb",factor:0.453592}]} },
        { id:"dose", label:"Dose (mcg/kg/hr)", type:"number", placeholder:"e.g. 50", min:5, max:400 },
        { id:"conc", label:"Concentration (mcg/mL)", type:"number", optional:true, placeholder:"e.g. 1000", min:100, max:5000 },
        { id:"pump_rate", label:"Pump Rate (reverse)", type:"number", placeholder:"mL/hr", optional:true }
      ],
      calculate: v => {
        const rate = (v.dose * v.weight) / v.conc;
        const rev  = v.pump_rate ? (v.pump_rate * v.conc) / v.weight : null;
        return { rate:parseFloat(rate.toFixed(2)), rev:rev?parseFloat(rev.toFixed(1)):null,
                 dose:v.dose, weight:v.weight, conc:v.conc, pumpRate:v.pump_rate };
      }
    },

    dexmed: {
      label: "Dexmedetomidine", isDrugCard: true,
      drugInfo: {
        name: "Dexmedetomidine (Precedex)", drugClass: "α₂ agonist  Sedative/Analgesic",
        classColor: "#ecfdf5", classText: "#065f46",
        calcType: "weight_hr", doseUnit: "mcg/kg/hr", concUnit: "mcg/mL",
        stdConc: [
          { label: "Standard",     prep: "200 mcg / 50 mL NS", conc: 4 },
          { label: "Concentrated", prep: "400 mcg / 50 mL NS", conc: 8 },
        ],
        ranges: [
          { label:"Low (light sedation)", min:0.2, max:0.7, color:"#d1fae5", text:"#065f46" },
          { label:"Standard",             min:0.7, max:1.0, color:"#fef3c7", text:"#92400e" },
          { label:"High",                 min:1.0, max:1.5, color:"#fee2e2", text:"#9f1239" },
        ],
        note: "Allows cooperative sedation — patient arousable. No respiratory depression. Analgesic-sparing. Useful for weaning, delirium prevention. Watch for bradycardia/hypotension.",
        prepUnit: "mcg", prepFactor: 1
      },
      fields: [
        { id:"weight", label:"Weight", type:"number", placeholder:"kg", min:1, max:400,
          unitToggle:{key:"wt", units:[{label:"kg",factor:1},{label:"lb",factor:0.453592}]} },
        { id:"dose", label:"Dose (mcg/kg/hr)", type:"number", placeholder:"e.g. 0.5", min:0.05, max:2 },
        { id:"conc", label:"Concentration (mcg/mL)", type:"number", optional:true, placeholder:"e.g. 4", min:0.5, max:20 },
        { id:"pump_rate", label:"Pump Rate (reverse)", type:"number", placeholder:"mL/hr", optional:true }
      ],
      calculate: v => {
        const rate = (v.dose * v.weight) / v.conc;
        const rev  = v.pump_rate ? (v.pump_rate * v.conc) / v.weight : null;
        return { rate:parseFloat(rate.toFixed(2)), rev:rev?parseFloat(rev.toFixed(4)):null,
                 dose:v.dose, weight:v.weight, conc:v.conc, pumpRate:v.pump_rate };
      }
    },

    fentanyl: {
      label: "Fentanyl", isDrugCard: true,
      drugInfo: {
        name: "Fentanyl", drugClass: "Opioid  μ-receptor agonist",
        classColor: "#fff7ed", classText: "#9a3412",
        calcType: "flat_hr", doseUnit: "mcg/hr", concUnit: "mcg/mL",
        stdConc: [
          { label: "Standard",     prep: "500 mcg / 100 mL NS", conc: 5  },
          { label: "Concentrated", prep: "2500 mcg / 250 mL NS", conc: 10 },
        ],
        ranges: [
          { label:"Low",      min:25,  max:100, color:"#d1fae5", text:"#065f46" },
          { label:"Moderate", min:100, max:200, color:"#fef3c7", text:"#92400e" },
          { label:"High",     min:200, max:500, color:"#fee2e2", text:"#9f1239" },
        ],
        note: "Preferred opioid in ICU: rapid onset, titratable, minimal histamine release. Accumulates in obesity/renal failure. Dose in mcg/hr (not weight-based infusion).",
        prepUnit: "mcg", prepFactor: 1
      },
      fields: [
        { id:"dose", label:"Dose (mcg/hr)", type:"number", placeholder:"e.g. 50", min:5, max:2000 },
        { id:"conc", label:"Concentration (mcg/mL)", type:"number", optional:true, placeholder:"e.g. 10", min:1, max:100 },
        { id:"pump_rate", label:"Pump Rate (reverse)", type:"number", placeholder:"mL/hr", optional:true }
      ],
      calculate: v => {
        const rate = v.dose / v.conc;
        const rev  = v.pump_rate ? v.pump_rate * v.conc : null;
        return { rate:parseFloat(rate.toFixed(2)), rev:rev?parseFloat(rev.toFixed(1)):null,
                 dose:v.dose, conc:v.conc, pumpRate:v.pump_rate };
      }
    },

    morphine: {
      label: "Morphine", isDrugCard: true,
      drugInfo: {
        name: "Morphine Sulphate", drugClass: "Opioid  μ-receptor agonist",
        classColor: "#fff7ed", classText: "#9a3412",
        calcType: "flat_hr", doseUnit: "mg/hr", concUnit: "mg/mL",
        stdConc: [
          { label: "Standard", prep: "50 mg / 50 mL NS", conc: 1 },
          { label: "Diluted",  prep: "20 mg / 100 mL NS", conc: 0.2 },
        ],
        ranges: [
          { label:"Low",      min:1,  max:3,  color:"#d1fae5", text:"#065f46" },
          { label:"Moderate", min:3,  max:7,  color:"#fef3c7", text:"#92400e" },
          { label:"High",     min:7,  max:15, color:"#fee2e2", text:"#9f1239" },
        ],
        note: "Active metabolite (M6G) accumulates in renal failure → prolonged respiratory depression. Causes histamine release → bronchospasm risk. Prefer fentanyl in renal impairment.",
        prepUnit: "mg", prepFactor: 1
      },
      fields: [
        { id:"dose", label:"Dose (mg/hr)", type:"number", placeholder:"e.g. 2", min:0.1, max:50 },
        { id:"conc", label:"Concentration (mg/mL)", type:"number", optional:true, placeholder:"e.g. 1", min:0.05, max:10 },
        { id:"pump_rate", label:"Pump Rate (reverse)", type:"number", placeholder:"mL/hr", optional:true }
      ],
      calculate: v => {
        const rate = v.dose / v.conc;
        const rev  = v.pump_rate ? v.pump_rate * v.conc : null;
        return { rate:parseFloat(rate.toFixed(2)), rev:rev?parseFloat(rev.toFixed(2)):null,
                 dose:v.dose, conc:v.conc, pumpRate:v.pump_rate };
      }
    },

    ketamine: {
      label: "Ketamine", isDrugCard: true,
      drugInfo: {
        name: "Ketamine", drugClass: "Dissociative  NMDA antagonist",
        classColor: "#f5f3ff", classText: "#5b21b6",
        calcType: "weight_hr", doseUnit: "mg/kg/hr", concUnit: "mg/mL",
        stdConc: [
          { label: "Standard",   prep: "500 mg / 500 mL NS", conc: 1 },
          { label: "Concentrated", prep: "500 mg / 250 mL NS", conc: 2 },
        ],
        ranges: [
          { label:"Analgesia sub-dissociative", min:0.1, max:0.3,  color:"#d1fae5", text:"#065f46" },
          { label:"Sedation",                    min:0.3, max:0.8,  color:"#fef3c7", text:"#92400e" },
          { label:"Procedural dissociation",     min:1.0, max:2.0,  color:"#fee2e2", text:"#9f1239" },
        ],
        note: "Bronchodilator — excellent in asthma/bronchospasm. Preserves airway reflexes and BP. Use with benzodiazepine to prevent emergence reactions. Increases secretions.",
        prepUnit: "mg", prepFactor: 1
      },
      fields: [
        { id:"weight", label:"Weight", type:"number", placeholder:"kg", min:1, max:400,
          unitToggle:{key:"wt", units:[{label:"kg",factor:1},{label:"lb",factor:0.453592}]} },
        { id:"dose", label:"Dose (mg/kg/hr)", type:"number", placeholder:"e.g. 0.2", min:0.05, max:5 },
        { id:"conc", label:"Concentration (mg/mL)", type:"number", optional:true, placeholder:"e.g. 1", min:0.1, max:10 },
        { id:"pump_rate", label:"Pump Rate (reverse)", type:"number", placeholder:"mL/hr", optional:true }
      ],
      calculate: v => {
        const rate = (v.dose * v.weight) / v.conc;
        const rev  = v.pump_rate ? (v.pump_rate * v.conc) / v.weight : null;
        return { rate:parseFloat(rate.toFixed(2)), rev:rev?parseFloat(rev.toFixed(3)):null,
                 dose:v.dose, weight:v.weight, conc:v.conc, pumpRate:v.pump_rate };
      }
    },

    // ── ICU Infusions ─────────────────────────────────────

    insulin_inf: {
      label: "Insulin Infusion", isDrugCard: true,
      drugInfo: {
        name: "Regular Insulin Infusion", drugClass: "Insulin  Glycaemic control",
        classColor: "#fefce8", classText: "#713f12",
        calcType: "flat_hr", doseUnit: "units/hr", concUnit: "units/mL",
        stdConc: [
          { label: "Standard", prep: "100 units / 100 mL NS", conc: 1 },
          { label: "Diluted",  prep: "50 units / 100 mL NS",  conc: 0.5 },
        ],
        ranges: [
          { label:"Low",      min:0.5, max:3,  color:"#d1fae5", text:"#065f46" },
          { label:"Moderate", min:3,   max:8,  color:"#fef3c7", text:"#92400e" },
          { label:"High",     min:8,   max:20, color:"#fee2e2", text:"#9f1239" },
        ],
        note: "Titrate per local glucose protocol. Target 140–180 mg/dL (7.8–10 mmol/L) in most ICU patients. Adsorbs to IV tubing — flush before use. Check BG 1–2 hourly until stable.",
        prepUnit: "units", prepFactor: 1
      },
      fields: [
        { id:"dose", label:"Dose (units/hr)", type:"number", placeholder:"e.g. 2", min:0.1, max:50 },
        { id:"conc", label:"Concentration (units/mL)", type:"number", optional:true, placeholder:"e.g. 1", min:0.1, max:5 },
        { id:"pump_rate", label:"Pump Rate (reverse)", type:"number", placeholder:"mL/hr", optional:true }
      ],
      calculate: v => {
        const rate = v.dose / v.conc;
        const rev  = v.pump_rate ? v.pump_rate * v.conc : null;
        return { rate:parseFloat(rate.toFixed(2)), rev:rev?parseFloat(rev.toFixed(1)):null,
                 dose:v.dose, conc:v.conc, pumpRate:v.pump_rate };
      }
    },

    heparin_inf: {
      label: "Heparin Infusion", isDrugCard: true,
      drugInfo: {
        name: "Unfractionated Heparin", drugClass: "Anticoagulant  Anti-Xa / IIa",
        classColor: "#fef2f2", classText: "#991b1b",
        calcType: "flat_hr", doseUnit: "units/hr", concUnit: "units/mL",
        stdConc: [
          { label: "Standard",     prep: "25,000 units / 250 mL NS", conc: 100 },
          { label: "Concentrated", prep: "25,000 units / 125 mL NS", conc: 200 },
        ],
        ranges: [
          { label:"DVT/PE prophylaxis", min:500,  max:1000,  color:"#d1fae5", text:"#065f46" },
          { label:"Therapeutic",        min:1000, max:2000,  color:"#fef3c7", text:"#92400e" },
          { label:"High / ECMO",        min:2000, max:3000,  color:"#fee2e2", text:"#9f1239" },
        ],
        note: "Titrate to aPTT 60–100s or anti-Xa 0.3–0.7 u/mL per protocol. Loading dose: 60–80 units/kg (max 5000 units). Monitor platelets for HIT (days 5–10).",
        prepUnit: "units", prepFactor: 1
      },
      fields: [
        { id:"dose", label:"Dose (units/hr)", type:"number", placeholder:"e.g. 1200", min:100, max:5000 },
        { id:"conc", label:"Concentration (units/mL)", type:"number", optional:true, placeholder:"e.g. 100", min:10, max:500 },
        { id:"pump_rate", label:"Pump Rate (reverse)", type:"number", placeholder:"mL/hr", optional:true }
      ],
      calculate: v => {
        const rate = v.dose / v.conc;
        const rev  = v.pump_rate ? v.pump_rate * v.conc : null;
        return { rate:parseFloat(rate.toFixed(1)), rev:rev?parseFloat(rev.toFixed(0)):null,
                 dose:v.dose, conc:v.conc, pumpRate:v.pump_rate };
      }
    },

    labetalol_inf: {
      label: "Labetalol", isDrugCard: true,
      drugInfo: {
        name: "Labetalol", drugClass: "α₁ + β blocker  Antihypertensive",
        classColor: "#eff6ff", classText: "#1e40af",
        calcType: "flat_hr", doseUnit: "mg/hr", concUnit: "mg/mL",
        stdConc: [
          { label: "Standard", prep: "200 mg / 200 mL NS", conc: 1 },
        ],
        ranges: [
          { label:"Low",    min:20,  max:60,  color:"#d1fae5", text:"#065f46" },
          { label:"Moderate", min:60, max:120, color:"#fef3c7", text:"#92400e" },
          { label:"High",   min:120, max:300, color:"#fee2e2", text:"#9f1239" },
        ],
        note: "α:β block ratio ≈ 1:7. Excellent in hypertensive emergency with preserved cardiac output. Avoid in asthma, bradycardia, decompensated HF, cocaine OD.",
        prepUnit: "mg", prepFactor: 1
      },
      fields: [
        { id:"dose", label:"Dose (mg/hr)", type:"number", placeholder:"e.g. 60", min:5, max:600 },
        { id:"conc", label:"Concentration (mg/mL)", type:"number", optional:true, placeholder:"e.g. 1", min:0.1, max:5 },
        { id:"pump_rate", label:"Pump Rate (reverse)", type:"number", placeholder:"mL/hr", optional:true }
      ],
      calculate: v => {
        const rate = v.dose / v.conc;
        const rev  = v.pump_rate ? v.pump_rate * v.conc : null;
        return { rate:parseFloat(rate.toFixed(1)), rev:rev?parseFloat(rev.toFixed(1)):null,
                 dose:v.dose, conc:v.conc, pumpRate:v.pump_rate };
      }
    },

    nicardipine_inf: {
      label: "Nicardipine", isDrugCard: true,
      drugInfo: {
        name: "Nicardipine", drugClass: "Calcium Channel Blocker  DHP",
        classColor: "#eff6ff", classText: "#1e40af",
        calcType: "flat_hr", doseUnit: "mg/hr", concUnit: "mg/mL",
        stdConc: [
          { label: "Standard",  prep: "20 mg / 200 mL NS", conc: 0.1 },
          { label: "Premix",    prep: "40 mg / 200 mL NS", conc: 0.2 },
        ],
        ranges: [
          { label:"Starting",   min:5,  max:7.5, color:"#d1fae5", text:"#065f46" },
          { label:"Moderate",   min:7.5, max:12, color:"#fef3c7", text:"#92400e" },
          { label:"Maximum",    min:12,  max:15, color:"#fee2e2", text:"#9f1239" },
        ],
        note: "Smooth, predictable BP lowering. Good for neurological emergencies (CVA, SAH). Titrate q15 min. May cause reflex tachycardia. Max 15 mg/hr.",
        prepUnit: "mg", prepFactor: 1
      },
      fields: [
        { id:"dose", label:"Dose (mg/hr)", type:"number", placeholder:"e.g. 5", min:1, max:20 },
        { id:"conc", label:"Concentration (mg/mL)", type:"number", optional:true, placeholder:"e.g. 0.1", min:0.05, max:1 },
        { id:"pump_rate", label:"Pump Rate (reverse)", type:"number", placeholder:"mL/hr", optional:true }
      ],
      calculate: v => {
        const rate = v.dose / v.conc;
        const rev  = v.pump_rate ? v.pump_rate * v.conc : null;
        return { rate:parseFloat(rate.toFixed(1)), rev:rev?parseFloat(rev.toFixed(2)):null,
                 dose:v.dose, conc:v.conc, pumpRate:v.pump_rate };
      }
    },

    nitroprusside_inf: {
      label: "Nitroprusside", isDrugCard: true,
      drugInfo: {
        name: "Sodium Nitroprusside", drugClass: "Vasodilator  NO donor",
        classColor: "#fefce8", classText: "#713f12",
        calcType: "weight_min", doseUnit: "mcg/kg/min", concUnit: "mcg/mL",
        stdConc: [
          { label: "Standard", prep: "50 mg / 250 mL D5W", conc: 200 },
        ],
        ranges: [
          { label:"Starting",   min:0.3, max:1,  color:"#d1fae5", text:"#065f46" },
          { label:"Moderate",   min:1,   max:4,  color:"#fef3c7", text:"#92400e" },
          { label:"High — cyanide risk", min:4, max:10, color:"#fee2e2", text:"#9f1239" },
        ],
        note: "⚠️ Cyanide toxicity risk >4 mcg/kg/min or >48h. Monitor for metabolic acidosis, elevated lactate. Light-sensitive — wrap bag. Rarely first choice; prefer nicardipine/clevidipine.",
        prepUnit: "mg", prepFactor: 1000
      },
      fields: [
        { id:"weight", label:"Weight", type:"number", placeholder:"kg", min:1, max:400,
          unitToggle:{key:"wt", units:[{label:"kg",factor:1},{label:"lb",factor:0.453592}]} },
        { id:"dose", label:"Dose (mcg/kg/min)", type:"number", placeholder:"e.g. 0.5", min:0.1, max:15 },
        { id:"conc", label:"Concentration (mcg/mL)", type:"number", optional:true, placeholder:"e.g. 200", min:10, max:1000 },
        { id:"pump_rate", label:"Pump Rate (reverse)", type:"number", placeholder:"mL/hr", optional:true }
      ],
      calculate: v => {
        const rate = (v.dose * v.weight * 60) / v.conc;
        const rev  = v.pump_rate ? (v.pump_rate * v.conc) / (v.weight * 60) : null;
        return { rate:parseFloat(rate.toFixed(2)), rev:rev?parseFloat(rev.toFixed(3)):null,
                 dose:v.dose, weight:v.weight, conc:v.conc, pumpRate:v.pump_rate };
      }
    },

    furosemide_inf: {
      label: "Furosemide Infusion", isDrugCard: true,
      drugInfo: {
        name: "Furosemide (Lasix) Infusion", drugClass: "Loop Diuretic  Na/K/2Cl inhibitor",
        classColor: "#ecfdf5", classText: "#065f46",
        calcType: "flat_hr", doseUnit: "mg/hr", concUnit: "mg/mL",
        stdConc: [
          { label: "Standard",  prep: "100 mg / 100 mL NS", conc: 1 },
          { label: "Double",    prep: "200 mg / 100 mL NS", conc: 2 },
        ],
        ranges: [
          { label:"Low",      min:1,  max:5,  color:"#d1fae5", text:"#065f46" },
          { label:"Moderate", min:5,  max:20, color:"#fef3c7", text:"#92400e" },
          { label:"High",     min:20, max:40, color:"#fee2e2", text:"#9f1239" },
        ],
        note: "Continuous infusion > repeated boluses for diuresis in volume overload. Monitor K⁺, Mg²⁺, Cl⁻. Infuse at ≤ 4 mg/min to avoid ototoxicity. Target: 0.5–1 mL/kg/hr urine output.",
        prepUnit: "mg", prepFactor: 1
      },
      fields: [
        { id:"dose", label:"Dose (mg/hr)", type:"number", placeholder:"e.g. 10", min:0.5, max:80 },
        { id:"conc", label:"Concentration (mg/mL)", type:"number", optional:true, placeholder:"e.g. 1", min:0.1, max:5 },
        { id:"pump_rate", label:"Pump Rate (reverse)", type:"number", placeholder:"mL/hr", optional:true }
      ],
      calculate: v => {
        const rate = v.dose / v.conc;
        const rev  = v.pump_rate ? v.pump_rate * v.conc : null;
        return { rate:parseFloat(rate.toFixed(1)), rev:rev?parseFloat(rev.toFixed(1)):null,
                 dose:v.dose, conc:v.conc, pumpRate:v.pump_rate };
      }
    },

  }; // end FORMULAS


  /* ═══════════════════════════════════════════════════════════
     3.  DOM REFERENCES  +  NULL GUARD
  ═══════════════════════════════════════════════════════════ */

  const elDisplay     = document.getElementById("calc-display");
  const elLabel       = document.getElementById("calc-label");
  const elInterpret   = document.getElementById("calc-interpret");
  const elObCard      = document.getElementById("calc-ob-card");
  const elAbCard      = document.getElementById("calc-ab-card");
  const elVentCard    = document.getElementById("calc-vent-card");
  const elDrugCard    = document.getElementById("calc-drug-card");
  const elSubtext     = document.getElementById("calc-display-subtext");
  const elFields      = document.getElementById("formula-fields");
  const elNote        = document.getElementById("formula-note");
  const elFormulaList = document.getElementById("formula-list");
  const elCalcBtn     = document.getElementById("btn-calc-formula");
  const elCopyBtn     = document.getElementById("btn-copy-result");
  const elHistList    = document.getElementById("calc-history-list");

  if (!elDisplay || !elLabel || !elInterpret || !elObCard || !elFields || !elFormulaList || !elCalcBtn) {
    console.warn("ClinCalc: required DOM elements not found.");
    return;
  }

  const setClass = (el, cls)  => { if (el) el.className   = cls;  };
  const setHTML  = (el, html) => { if (el) el.innerHTML   = html; };
  const setText  = (el, txt)  => { if (el) el.textContent = txt;  };


  /* ═══════════════════════════════════════════════════════════
     4.  STATE
  ═══════════════════════════════════════════════════════════ */

  let currentFormula = "bmi";
  const sharedValues  = {};
  const sharedChecked = {};
  const unitState     = {};
  const calcHistory   = [];


  /* ═══════════════════════════════════════════════════════════
     5.  BUILD FORMULA SIDEBAR
     Category headers → .border-dashed-primary (project class)
     Formula items    → custom CSS giving .border-dashed-success colours
  ═══════════════════════════════════════════════════════════ */

  Object.entries(FORMULA_CATEGORIES).forEach(([cat, keys]) => {
    // Main category header
    const hdr = document.createElement("div");
    hdr.className   = "formula-cat-hdr border-dashed-primary";
    hdr.textContent = cat;
    elFormulaList.appendChild(hdr);

    keys.forEach(key => {
      // Sub-header: keys starting with "—" are section dividers, not formulas
      if (key.startsWith("—")) {
        const sub = document.createElement("div");
        sub.className   = "formula-sub-hdr";
        sub.textContent = key.slice(1); // strip the "—" prefix
        elFormulaList.appendChild(sub);
        return;
      }
      const btn = document.createElement("button");
      btn.className       = "list-group-item list-group-item-action";
      btn.dataset.formula = key;
      btn.textContent     = FORMULAS[key].label;
      btn.addEventListener("click", () => switchFormula(key));
      elFormulaList.appendChild(btn);
    });
  });


  /* ═══════════════════════════════════════════════════════════
     6.  SWITCH FORMULA  (auto-calculates if fields are prefilled)
  ═══════════════════════════════════════════════════════════ */

  function switchFormula(key) {
    persistCurrentValues();
    currentFormula = key;
    document.querySelectorAll("#formula-list .list-group-item").forEach(b =>
      b.classList.toggle("active", b.dataset.formula === key)
    );
    clearDisplay();
    renderFields(key);
    doCalculate(); // fires silently if any required field is empty
  }

  // Fields that should NEVER carry over between different drug formulas.
  // Only weight (shared: true) should persist across drug cards.
  const DRUG_LOCAL_FIELDS = new Set(["dose", "conc", "pump_rate"]);

  function persistCurrentValues() {
    const isDrug = !!FORMULAS[currentFormula].isDrugCard;
    FORMULAS[currentFormula].fields.forEach(field => {
      const el = document.getElementById(`field-${field.id}`);
      if (!el) return;
      // Drug-specific fields: save to a separate drug-local store, not sharedValues
      if (isDrug && DRUG_LOCAL_FIELDS.has(field.id)) return;
      if (field.type === "checkbox") {
        sharedChecked[field.id] = el.checked;
      } else if (field.type !== "date" && field.type !== "select" && el.value !== "") {
        sharedValues[field.id] = {
          displayValue: el.value,
          unitKey:  field.unitToggle?.key ?? null,
          unitIdx:  field.unitToggle ? (unitState[field.unitToggle.key] ?? 0) : 0
        };
      }
    });
  }


  /* ═══════════════════════════════════════════════════════════
     7.  RENDER FIELDS
  ═══════════════════════════════════════════════════════════ */

  function renderFields(key) {
    const fm = FORMULAS[key];
    elFields.innerHTML = "";
    setText(elNote, fm.note || "");

    fm.fields.forEach(field => {
      const wrap = document.createElement("div");
      wrap.className = "field-wrap";

      if (field.type === "checkbox") {
        wrap.innerHTML = `
          <div class="form-check form-switch mt-1">
            <input class="form-check-input" type="checkbox" id="field-${field.id}">
            <label class="form-check-label" for="field-${field.id}">${field.label}</label>
          </div>`;
        elFields.appendChild(wrap);
        const el = document.getElementById(`field-${field.id}`);
        if (sharedChecked[field.id] !== undefined) el.checked = sharedChecked[field.id];
        el.addEventListener("change", debounce(doCalculate, 300));
        return;
      }

      if (field.type === "date") {
        const today = new Date().toISOString().split("T")[0];
        wrap.innerHTML = `
          <label>${field.label}</label>
          <input type="date" class="form-control" id="field-${field.id}" max="${today}">`;
        elFields.appendChild(wrap);
        document.getElementById(`field-${field.id}`).addEventListener("change", debounce(doCalculate, 300));
        return;
      }

      if (field.type === "select") {
        const opts = field.options.map(o => `<option value="${o.value}">${o.label}</option>`).join("");
        wrap.innerHTML = `
          <label>${field.label}</label>
          <select class="form-select" id="field-${field.id}">${opts}</select>`;
        elFields.appendChild(wrap);
        document.getElementById(`field-${field.id}`).addEventListener("change", debounce(doCalculate, 300));
        return;
      }

      // Number field
      const uKey  = field.unitToggle?.key;
      const units = field.unitToggle?.units;
      const uIdx  = uKey !== undefined ? (unitState[uKey] ?? 0) : 0;
      const uLabel = units ? units[uIdx].label : (field.placeholder || "");
      const optBadge = field.optional ? `<span class="field-optional-lbl">optional</span>` : "";
      const carrBadge = `<span class="field-prefilled-badge d-none" id="badge-${field.id}">carried over</span>`;

      if (units) {
        wrap.innerHTML = `
          <label>${field.label} ${optBadge}${carrBadge}</label>
          <div class="field-unit-wrap">
            <input type="number" class="form-control" id="field-${field.id}"
                   placeholder="${uLabel}" step="any" autocomplete="off">
            <button type="button" class="unit-toggle-btn" id="utbtn-${field.id}">${uLabel}</button>
          </div>`;
      } else {
        wrap.innerHTML = `
          <label>${field.label} ${optBadge}${carrBadge}</label>
          <input type="number" class="form-control" id="field-${field.id}"
                 placeholder="${field.placeholder || field.label}" step="any" autocomplete="off">`;
      }

      elFields.appendChild(wrap);
      const el = document.getElementById(`field-${field.id}`);

      // Restore shared value with unit conversion.
      // Drug-specific fields (dose/conc/pump_rate) are never restored from shared store.
      const skipRestore = fm.isDrugCard && DRUG_LOCAL_FIELDS.has(field.id);
      const stored = skipRestore ? null : sharedValues[field.id];
      if (stored && stored.displayValue !== "") {
        if (units && stored.unitKey === uKey) {
          const si  = stored.unitIdx ?? 0;
          const base = parseFloat(stored.displayValue) * units[si].factor;
          el.value = si === uIdx ? stored.displayValue : (base / units[uIdx].factor).toFixed(units[uIdx].decimals ?? 2);
        } else if (!units) {
          el.value = stored.displayValue;
        }
        const badge = document.getElementById(`badge-${field.id}`);
        if (badge) badge.classList.remove("d-none");
        wrap.classList.add("field-prefilled");
      }

      el.addEventListener("input", () => {
        document.getElementById(`badge-${field.id}`)?.classList.add("d-none");
        wrap.classList.remove("field-prefilled");
      }, { once: true });

      document.getElementById(`utbtn-${field.id}`)?.addEventListener("click", () => toggleUnit(field, el, document.getElementById(`utbtn-${field.id}`)));
      el.addEventListener("input", debounce(doCalculate, 350));
    });

    // ── Prep calculator for drug cards ──
    if (fm.isDrugCard && fm.drugInfo) {
      const di   = fm.drugInfo;
      const unit = di.prepUnit || "mg";
      const sep  = document.createElement("div");
      sep.className = "prep-sep";
      sep.innerHTML = `<div class="prep-sep-label">
        <span>— or build concentration —</span>
      </div>`;
      elFields.appendChild(sep);

      // Amount field
      const wrapAmt = document.createElement("div");
      wrapAmt.className = "field-wrap";
      wrapAmt.innerHTML = `
        <label>Amount in bag <span class="field-optional-lbl">optional</span></label>
        <div class="field-unit-wrap">
          <input type="number" class="form-control" id="field-prep_amount"
                 placeholder="e.g. ${unit === 'mg' ? '4' : unit === 'mcg' ? '200' : '20'}" step="any" autocomplete="off">
          <button type="button" class="unit-toggle-btn" id="prep-unit-btn"
            data-units='["mg","mcg","units","g"]' data-idx="0">${unit}</button>
        </div>`;
      elFields.appendChild(wrapAmt);

      // Volume field
      const wrapVol = document.createElement("div");
      wrapVol.className = "field-wrap";
      wrapVol.innerHTML = `
        <label>Volume in bag (mL) <span class="field-optional-lbl">optional</span></label>
        <input type="number" class="form-control" id="field-prep_vol"
               placeholder="e.g. 250" step="any" min="1" max="9999" autocomplete="off">`;
      elFields.appendChild(wrapVol);

      // Computed conc display
      const wrapCalc = document.createElement("div");
      wrapCalc.className = "field-wrap";
      wrapCalc.innerHTML = `<div class="prep-calc-result d-none" id="prep-calc-result"></div>`;
      elFields.appendChild(wrapCalc);

      // Unit toggle on prep_amount button
      const prepUnitBtn = document.getElementById("prep-unit-btn");
      const prepAmtEl   = document.getElementById("field-prep_amount");
      const prepVolEl   = document.getElementById("field-prep_vol");
      const prepResult  = document.getElementById("prep-calc-result");
      const concEl      = document.getElementById("field-conc");

      function updatePrepCalc() {
        const amt = parseFloat(prepAmtEl.value);
        const vol = parseFloat(prepVolEl.value);
        const rawUnit = prepUnitBtn.textContent.trim();
        if (!isNaN(amt) && !isNaN(vol) && vol > 0) {
          // Convert to conc unit
          let factor = 1;
          const concUnit = di.concUnit || "";
          if      (rawUnit === "mg"    && concUnit.includes("mcg")) factor = 1000;
          else if (rawUnit === "mcg"   && concUnit.includes("mg"))  factor = 0.001;
          else if (rawUnit === "g"     && concUnit.includes("mg"))  factor = 1000;
          else if (rawUnit === "g"     && concUnit.includes("mcg")) factor = 1000000;
          const computed = (amt * factor) / vol;
          // Fill conc field
          if (concEl) { concEl.value = computed.toFixed(4); }
          const dispConc = computed < 1 ? computed.toFixed(4) : computed < 10 ? computed.toFixed(2) : computed.toFixed(1);
          prepResult.innerHTML = `<i class="bi bi-check-circle-fill me-1" style="color:#198754"></i>` +
            `Concentration: <strong>${dispConc} ${di.concUnit}</strong>`;
          prepResult.classList.remove("d-none");
          doCalculate();
        } else {
          prepResult.classList.add("d-none");
          if (concEl) concEl.value = "";
        }
      }

      if (prepUnitBtn) {
        prepUnitBtn.addEventListener("click", function() {
          const units = JSON.parse(this.dataset.units);
          let idx = parseInt(this.dataset.idx);
          idx = (idx + 1) % units.length;
          this.dataset.idx = idx;
          this.textContent = units[idx];
          if (prepAmtEl.value) updatePrepCalc();
        });
      }
      if (prepAmtEl) prepAmtEl.addEventListener("input", debounce(updatePrepCalc, 300));
      if (prepVolEl) prepVolEl.addEventListener("input", debounce(updatePrepCalc, 300));
    }
  }


  /* ═══════════════════════════════════════════════════════════
     8.  UNIT TOGGLE
  ═══════════════════════════════════════════════════════════ */

  function toggleUnit(field, el, btn) {
    const key = field.unitToggle.key, units = field.unitToggle.units;
    const prev = unitState[key] ?? 0, next = (prev + 1) % units.length;
    unitState[key] = next;
    if (el.value !== "") {
      const base = parseFloat(el.value) * units[prev].factor;
      el.value = (base / units[next].factor).toFixed(units[next].decimals ?? 2);
    }
    btn.textContent = units[next].label;
    el.placeholder  = units[next].label;
    if (sharedValues[field.id]) { sharedValues[field.id].displayValue = el.value; sharedValues[field.id].unitIdx = next; }
    doCalculate();
  }

  function getBaseValue(field, el) {
    const raw = parseFloat(el.value);
    if (!field.unitToggle) return raw;
    return raw * field.unitToggle.units[unitState[field.unitToggle.key] ?? 0].factor;
  }


  /* ═══════════════════════════════════════════════════════════
     9.  CALCULATE
  ═══════════════════════════════════════════════════════════ */

  elCalcBtn.addEventListener("click", doCalculate);

  // ── Clear all fields in current formula ──
  const elClearBtn = document.getElementById("btn-clear-fields");
  if (elClearBtn) {
    elClearBtn.addEventListener("click", function() {
      const fm = FORMULAS[currentFormula];
      fm.fields.forEach(field => {
        const el = document.getElementById("field-" + field.id);
        if (!el) return;
        if (field.type === "checkbox") { el.checked = false; }
        else { el.value = ""; }
        // Remove prefilled badge and style
        const badge = document.getElementById("badge-" + field.id);
        if (badge) badge.classList.add("d-none");
        el.closest(".field-wrap")?.classList.remove("field-prefilled");
        // Remove from shared store so it doesn't restore on next switch
        delete sharedValues[field.id];
        if (field.type === "checkbox") delete sharedChecked[field.id];
      });
      // Also clear the display
      clearDisplay();
    });
  }

  function doCalculate() {
    const fm = FORMULAS[currentFormula];
    const values = {};
    let incomplete = false;

    // Drug card: if prep fields are filled, auto-inject conc before main field loop
    if (fm.isDrugCard) {
      const prepAmtEl = document.getElementById("field-prep_amount");
      const prepVolEl = document.getElementById("field-prep_vol");
      const concEl    = document.getElementById("field-conc");
      if (prepAmtEl && prepAmtEl.value && prepVolEl && prepVolEl.value && concEl) {
        const amt    = parseFloat(prepAmtEl.value);
        const vol    = parseFloat(prepVolEl.value);
        const rawUnit = document.getElementById("prep-unit-btn")?.textContent?.trim() || fm.drugInfo?.prepUnit || "mg";
        const concUnit = fm.drugInfo?.concUnit || "";
        let factor = 1;
        if      (rawUnit === "mg"  && concUnit.includes("mcg")) factor = 1000;
        else if (rawUnit === "mcg" && concUnit.includes("mg"))  factor = 0.001;
        else if (rawUnit === "g"   && concUnit.includes("mg"))  factor = 1000;
        else if (rawUnit === "g"   && concUnit.includes("mcg")) factor = 1000000;
        if (!isNaN(amt) && !isNaN(vol) && vol > 0) {
          const computed = (amt * factor) / vol;
          concEl.value = computed.toFixed(4);
        }
      }
      // Validate: must have conc (either manual or computed from prep)
      const concEl2 = document.getElementById("field-conc");
      if (concEl2 && !concEl2.value) {
        // Neither manual conc nor prep provided — show hint and return
        return showError("Enter concentration directly or use 'Amount in bag' + 'Volume'");
      }
    }

    // Drug reverse-only mode: pump_rate filled, dose empty → treat dose as optional
    const pumpRateEl = fm.isDrugCard ? document.getElementById("field-pump_rate") : null;
    const doseEl     = fm.isDrugCard ? document.getElementById("field-dose")      : null;
    const reverseOnly = fm.isDrugCard && pumpRateEl?.value && !doseEl?.value;

    for (const field of fm.fields) {
      const el = document.getElementById(`field-${field.id}`);
      if (!el) continue;

      if (field.type === "checkbox") { values[field.id] = el.checked; continue; }
      if (field.optional && !el.value) { values[field.id] = null; continue; }
      // In reverse-only mode, dose is allowed to be blank
      if (reverseOnly && field.id === "dose") { values[field.id] = null; continue; }
      if (!el.value) { incomplete = true; continue; }
      if (field.type === "date")   { values[field.id] = el.value; continue; }
      if (field.type === "select") { values[field.id] = el.value; continue; }

      const v = getBaseValue(field, el);
      if (field.min !== undefined && v < field.min) return showError(`${field.label}: ${v.toFixed(2)} below min (${field.min})`);
      if (field.max !== undefined && v > field.max) return showError(`${field.label}: ${v.toFixed(2)} above max (${field.max})`);
      values[field.id] = v;
    }

    if (incomplete) return;

    // Central reverse calculation — avoids updating every drug formula
    if (reverseOnly && fm.isDrugCard) {
      const di   = fm.drugInfo;
      const pr   = values.pump_rate;
      const conc = values.conc;
      const wt   = values.weight || null;
      let rev = null;
      if      (di.calcType === "flat_hr")    rev = pr * conc;
      else if (di.calcType === "weight_hr")  rev = wt ? (pr * conc) / wt : null;
      else                                   rev = wt ? (pr * conc) / (wt * 60) : null; // weight_min
      if (rev === null) return showError("Weight required for reverse calculation");
      const decimals = di.calcType === "flat_hr" ? 3 : rev < 0.1 ? 5 : rev < 1 ? 4 : 2;
      renderDrugCard({ rate: null, rev: parseFloat(rev.toFixed(decimals)),
                       dose: null, conc: conc, weight: wt, pumpRate: pr }, fm);
      return;
    }

    if (fm.validate) { const err = fm.validate(values); if (err) return showError(err); }

    try {
      const result = fm.calculate(values);
      if      (fm.isAcidBase)              renderAcidBaseCard(result);
      else if (fm.isOb)                    renderObCard(result);
      else if (fm.isVentCard)              renderVentCard(result, fm);
      else if (fm.isDrugCard)              renderDrugCard(result, fm);
      else if (typeof result === "string") showText(result, fm.label);
      else                                 showNumeric(result, values, fm);
    } catch (e) { showError(e.message || "Calculation error"); }
  }


  /* ═══════════════════════════════════════════════════════════
     10.  DISPLAY HELPERS
     interpret strips use STATUS_CLASS → project border-dashed classes
  ═══════════════════════════════════════════════════════════ */

  function clearDisplay() {
    setText(elDisplay,    "—");
    setClass(elDisplay,   "");
    setText(elLabel,      "Ready");
    setText(elSubtext,    "");
    setClass(elInterpret, "calc-interpret");
    setHTML(elInterpret,  "");
    setClass(elObCard,    "");
    setHTML(elObCard,     "");
    if (elAbCard)   { setClass(elAbCard, "");   setHTML(elAbCard, "");   }
    if (elVentCard) { setClass(elVentCard, ""); setHTML(elVentCard, ""); }
    if (elDrugCard) { setClass(elDrugCard, ""); setHTML(elDrugCard, ""); }
    if (elCopyBtn) elCopyBtn.dataset.copy = "";
  }

  function showError(msg) {
    setText(elDisplay,    msg);
    setClass(elDisplay,   "is-error");
    setText(elLabel,      "Error");
    setClass(elInterpret, "calc-interpret");
    setHTML(elInterpret,  "");
    setClass(elObCard, ""); setHTML(elObCard, "");
    if (elAbCard)   { setClass(elAbCard, "");   setHTML(elAbCard, "");   }
    if (elVentCard) { setClass(elVentCard, ""); setHTML(elVentCard, ""); }
    if (elDrugCard) { setClass(elDrugCard, ""); setHTML(elDrugCard, ""); }
  }

  function showText(text, label) {
    setText(elDisplay, text); setClass(elDisplay, ""); setText(elLabel, label);
    if (elCopyBtn) elCopyBtn.dataset.copy = text;
  }

  function showNumeric(result, values, fm) {
    const noDecimals = ["kcal/day","mL/day","mEq","cells/µL",""].includes(fm.unit);
    const formatted  = parseFloat(result).toFixed(noDecimals ? 0 : 2);
    const withUnit   = fm.unit ? `${formatted} ${fm.unit}` : formatted;

    setText(elDisplay,  withUnit);
    setClass(elDisplay, "");
    setText(elLabel,    fm.label);
    setText(elSubtext,  "");
    if (elCopyBtn) elCopyBtn.dataset.copy = withUnit;
    setClass(elObCard, ""); setHTML(elObCard, "");
    if (elAbCard)   { setClass(elAbCard, "");   setHTML(elAbCard, "");   }
    if (elVentCard) { setClass(elVentCard, ""); setHTML(elVentCard, ""); }
    if (elDrugCard) { setClass(elDrugCard, ""); setHTML(elDrugCard, ""); }

    if (fm.interpret) {
      const hint = fm.interpret(result, values);
      if (hint) {
        // project class for colour + calc-interpret for structure
        setClass(elInterpret, `calc-interpret show ${STATUS_CLASS[hint.status] || ""}`);
        setHTML(elInterpret, `<div class="interp-label">${hint.label}</div><div class="interp-range">${hint.range}</div>`);
      } else {
        setClass(elInterpret, "calc-interpret");
      }
    } else {
      setClass(elInterpret, "calc-interpret");
    }

    addHistory(fm.label, withUnit);
  }


  /* ═══════════════════════════════════════════════════════════
     11.  ACID-BASE CARD RENDERER
  ═══════════════════════════════════════════════════════════ */

  function renderAcidBaseCard(res) {
    setClass(elInterpret, "calc-interpret"); setHTML(elInterpret, "");
    setClass(elObCard, ""); setHTML(elObCard, "");
    if (!elAbCard) return;

    const { disorders, comps, agData, hco3Deficit, hco3, hco3Calc, overallStatus } = res;

    // Display summary
    const primaryLabel = disorders[0]?.label || "Analysis";
    setText(elDisplay,  primaryLabel);
    setClass(elDisplay, "");
    setText(elLabel,    "Acid-Base");
    if (elCopyBtn) elCopyBtn.dataset.copy = primaryLabel;

    // Helper: status → project class
    const sc = s => STATUS_CLASS[s] || "border-dashed-muted";
    // Badge colours
    const badgeStyle = {
      ok:   "background:#d1fae5;color:#065f46;",
      warn: "background:#fef3c7;color:#92400e;",
      bad:  "background:#fee2e2;color:#9f1239;",
      info: "background:#dbeafe;color:#1e40af;"
    };

    let html = "";

    // ── Section 1: Primary disorder ──
    html += `<div class="ab-section ${sc(disorders[0]?.status || "info")}">
      <div class="ab-section-title">Primary Disorder</div>`;
    disorders.forEach(d => {
      html += `<div>
        <span class="ab-primary-badge" style="${badgeStyle[d.status]||badgeStyle.info}">${d.label}</span>
        <div class="interp-range">${d.sub}</div>
      </div>`;
    });
    html += `<hr class="ab-divider">
      <div class="ab-row">
        <span class="ab-row-lbl">pH</span>
        <span class="ab-row-val">${res.v.ph}</span>
      </div>
      <div class="ab-row">
        <span class="ab-row-lbl">PaCO₂</span>
        <span class="ab-row-val">${res.v.paco2} mmHg</span>
      </div>
      <div class="ab-row">
        <span class="ab-row-lbl">HCO₃</span>
        <span class="ab-row-val">${hco3.toFixed(1)} mEq/L ${hco3Calc ? '<span class="ab-calc-badge">calculated</span>' : ''}</span>
      </div>
    </div>`;

    // ── Section 2: Compensation ──
    if (comps.length) {
      comps.forEach(c => {
        html += `<div class="ab-section ${sc(c.status)}">
          <div class="ab-section-title">Compensation</div>
          <div class="interp-label">${c.label}</div>
          <div class="interp-range">${c.detail}</div>
        </div>`;
      });
    }

    // ── Section 3: AG analysis ──
    if (agData) {
      const agStatus = agData.hagma ? (agData.ag > 20 ? "bad" : "warn") : "ok";
      html += `<div class="ab-section ${sc(agStatus)}">
        <div class="ab-section-title">Anion Gap Analysis</div>
        <div class="ab-row">
          <span class="ab-row-lbl">Anion Gap</span>
          <span class="ab-row-val">${agData.ag.toFixed(1)} mEq/L</span>
        </div>`;
      if (agData.agCorr !== null) {
        html += `<div class="ab-row">
          <span class="ab-row-lbl">Corrected AG</span>
          <span class="ab-row-val">${agData.agCorr.toFixed(1)} mEq/L <span class="ab-calc-badge">alb-adj</span></span>
        </div>`;
      }
      const agLabel = agData.hagma ? "High AG Metabolic Acidosis (HAGMA)" : "Normal AG Metabolic Acidosis (NAGMA)";
      html += `<div class="interp-label" style="margin-top:4px">${agLabel}</div>`;

      // Delta-delta
      if (agData.dd !== null) {
        let ddLabel = "", ddStatus = "info";
        if (agData.dd < 0.4)      { ddLabel = "Pure NAGMA";                       ddStatus = "info"; }
        else if (agData.dd < 1.0) { ddLabel = "Mixed NAGMA + HAGMA";              ddStatus = "warn"; }
        else if (agData.dd <= 2)  { ddLabel = "Pure HAGMA";                       ddStatus = "ok";   }
        else                      { ddLabel = "HAGMA + metabolic alkalosis";       ddStatus = "warn"; }

        html += `<hr class="ab-divider">
          <div class="ab-section-title">Δ-Δ Ratio</div>
          <div class="ab-row">
            <span class="ab-row-lbl">Delta-Delta</span>
            <span class="ab-row-val">${agData.dd}</span>
          </div>
          <div class="interp-label">${ddLabel}</div>`;
      }
      html += `</div>`;
    }

    // ── Section 4: HCO₃ deficit ──
    if (hco3Deficit !== null) {
      html += `<div class="ab-section ${sc("warn")}">
        <div class="ab-section-title">HCO₃ Deficit</div>
        <div class="ab-row">
          <span class="ab-row-lbl">Total deficit</span>
          <span class="ab-row-val">${hco3Deficit} mEq</span>
        </div>
        <div class="interp-range">Give ${Math.round(hco3Deficit/2)} mEq (50%) over first 4–6h · Recheck ABG · Monitor K⁺</div>
      </div>`;
    }

    setClass(elAbCard, "show");
    setHTML(elAbCard, html);
    addHistory("Acid-Base", disorders[0]?.label || "Analysis");
  }



  /* ═══════════════════════════════════════════════════════════
     11b.  VENTILATOR CARD RENDERER
  ═══════════════════════════════════════════════════════════ */

  const ARDSNET_TABLE = [
    // [FiO2_pct, PEEP]
    [30,5],[40,5],[40,8],[50,8],[50,10],[60,10],[70,10],[70,12],
    [70,14],[80,14],[90,14],[90,16],[90,18],[100,18],[100,20],[100,22],[100,24]
  ];

  function ardsnetRow(fio2, peep) {
    // Find closest ARDSNet row for given FiO2%
    const matches = ARDSNET_TABLE.filter(r => r[0] === Math.round(fio2 / 10) * 10);
    return matches.length ? matches : null;
  }

  function ventBadge(val, ok_fn, warn_fn) {
    // ok_fn and warn_fn are functions(val) -> bool
    if (ok_fn(val))   return `<span class="vent-badge vent-badge-ok">✓ OK</span>`;
    if (warn_fn(val)) return `<span class="vent-badge vent-badge-warn">⚠ Watch</span>`;
                      return `<span class="vent-badge vent-badge-bad">✕ Critical</span>`;
  }

  function renderVentCard(result, fm) {
    setClass(elInterpret, "calc-interpret"); setHTML(elInterpret, "");
    setClass(elObCard, ""); setHTML(elObCard, "");
    if (elAbCard)   { setClass(elAbCard, "");   setHTML(elAbCard, ""); }
    if (elDrugCard) { setClass(elDrugCard, ""); setHTML(elDrugCard, ""); }
    if (!elVentCard) return;

    const sc = s => STATUS_CLASS[s] || "border-dashed-muted";
    let html = "", title = fm.label, displayVal = "", displayUnit = "";

    // ── VENT SETUP ──
    if (fm === FORMULAS.vent_setup) {
      const { ibw, vt_per_ibw, mv, ttot, ti, te, ie_ratio, vt_ml, rr, peep, fio2 } = result;
      displayVal = `${ibw} kg IBW`;
      title = "Vent Setup";

      const vtStatus = vt_per_ibw <= 6 ? "ok" : vt_per_ibw <= 8 ? "warn" : "bad";
      const mvStatus = mv >= 5 && mv <= 8 ? "ok" : mv < 3 || mv > 12 ? "bad" : "warn";

      html += `<div class="vent-section ${sc(vtStatus)}">
        <div class="vent-section-title">Tidal Volume Protection</div>
        <div class="vent-row"><span class="vent-row-lbl">IBW</span>
          <span class="vent-row-val">${ibw} kg</span></div>
        <div class="vent-row"><span class="vent-row-lbl">Vt/IBW</span>
          <span class="vent-row-val">${vt_per_ibw} mL/kg
            ${ventBadge(vt_per_ibw, v=>v<=6, v=>v<=8)}</span></div>
        <div class="vent-row"><span class="vent-row-lbl">Set Vt</span>
          <span class="vent-row-val">${vt_ml} mL</span></div>
        <div class="vent-row"><span class="vent-row-lbl">Target 6 mL/kg</span>
          <span class="vent-row-val">${(ibw*6).toFixed(0)} mL</span></div>
        <div class="vent-row"><span class="vent-row-lbl">Target 8 mL/kg</span>
          <span class="vent-row-val">${(ibw*8).toFixed(0)} mL</span></div>
      </div>`;

      html += `<div class="vent-section ${sc(mvStatus)}">
        <div class="vent-section-title">Minute Ventilation</div>
        <div class="vent-row"><span class="vent-row-lbl">MV = Vt × RR</span>
          <span class="vent-row-val">${mv} L/min
            ${ventBadge(mv, v=>v>=5&&v<=8, v=>v>3&&v<12)}</span></div>
        <div class="vent-row"><span class="vent-row-lbl">RR</span>
          <span class="vent-row-val">${rr} /min</span></div>
        <div class="vent-row"><span class="vent-row-lbl">Breath cycle (Ttot)</span>
          <span class="vent-row-val">${ttot} s</span></div>
        ${ie_ratio !== null ? `
        <hr class="vent-divider">
        <div class="vent-row"><span class="vent-row-lbl">Ti / Te</span>
          <span class="vent-row-val">${ti}s / ${te}s</span></div>
        <div class="vent-row"><span class="vent-row-lbl">I:E ratio</span>
          <span class="vent-row-val">1 : ${(1/ie_ratio).toFixed(2)}</span></div>` : ""}
      </div>`;

      // ARDSNet PEEP/FiO2 suggestion
      const fio2pct = Math.round(fio2 / 10) * 10;
      const aNets   = ARDSNET_TABLE.filter(r => r[0] === fio2pct);
      if (aNets.length) {
        html += `<div class="vent-section border-dashed-info">
          <div class="vent-section-title">ARDSNet PEEP/FiO₂ (Low PEEP table)</div>
          <div class="vent-row"><span class="vent-row-lbl">For FiO₂ ${fio2}%</span>
            <span class="vent-row-val">PEEP ${aNets.map(r=>r[1]).join(' or ')} cmH₂O</span></div>
          <div class="vent-row"><span class="vent-row-lbl">Current PEEP</span>
            <span class="vent-row-val">${peep} cmH₂O</span></div>
        </div>`;
      }
    }

    // ── VENT MECHANICS ──
    else if (fm === FORMULAS.vent_mechanics) {
      const { c_stat, c_dyn, rrs, dp, mp, tau, vt_ml, ppeak, pplat, peep } = result;
      displayVal = `ΔP ${dp} cmH₂O`;

      const dpStatus  = dp < 14 ? "ok" : dp < 17 ? "warn" : "bad";
      const cstStatus = !c_stat ? "info" : c_stat >= 50 ? "ok" : c_stat >= 30 ? "warn" : "bad";
      const rawStatus = rrs <= 10 ? "ok" : rrs <= 15 ? "warn" : "bad";
      const mpStatus  = !mp ? "info" : mp < 12 ? "ok" : mp < 17 ? "warn" : "bad";

      html += `<div class="vent-section ${sc(dpStatus)}">
        <div class="vent-section-title">Driving Pressure (Key VILI Index)</div>
        <div class="vent-row"><span class="vent-row-lbl">ΔP = Pplat − PEEP</span>
          <span class="vent-row-val">${dp} cmH₂O ${ventBadge(dp, v=>v<14, v=>v<17)}</span></div>
        <div class="vent-row"><span class="vent-row-lbl">Pplat</span>
          <span class="vent-row-val">${pplat} cmH₂O ${pplat<=30?'<span class="vent-badge vent-badge-ok">✓ &lt;30</span>':'<span class="vent-badge vent-badge-bad">✕ &gt;30</span>'}</span></div>
        <div class="vent-row"><span class="vent-row-lbl">PEEP</span>
          <span class="vent-row-val">${peep} cmH₂O</span></div>
      </div>`;

      html += `<div class="vent-section ${sc(cstStatus)}">
        <div class="vent-section-title">Compliance</div>
        <div class="vent-row"><span class="vent-row-lbl">Static Crs</span>
          <span class="vent-row-val">${c_stat ?? "—"} mL/cmH₂O ${c_stat?ventBadge(c_stat,v=>v>=50,v=>v>=30):""}</span></div>
        <div class="vent-row"><span class="vent-row-lbl">Dynamic Cdyn</span>
          <span class="vent-row-val">${c_dyn ?? "—"} mL/cmH₂O</span></div>
        ${tau ? `<div class="vent-row"><span class="vent-row-lbl">Time constant τ</span>
          <span class="vent-row-val">${tau} s <span class="vent-badge vent-badge-info">5τ = ${(tau*5).toFixed(1)}s</span></span></div>` : ""}
      </div>`;

      html += `<div class="vent-section ${sc(rawStatus)}">
        <div class="vent-section-title">Airway Resistance</div>
        <div class="vent-row"><span class="vent-row-lbl">Raw = (Ppeak−Pplat)/Flow</span>
          <span class="vent-row-val">${rrs} cmH₂O/L/s ${ventBadge(rrs,v=>v<=10,v=>v<=15)}</span></div>
        <div class="vent-row"><span class="vent-row-lbl">Ppeak</span>
          <span class="vent-row-val">${ppeak} cmH₂O</span></div>
      </div>`;

      html += `<div class="vent-section ${sc(mpStatus)}">
        <div class="vent-section-title">Mechanical Power</div>
        <div class="vent-row"><span class="vent-row-lbl">MP (Becher formula)</span>
          <span class="vent-row-val">${mp ?? "—"} J/min ${mp?ventBadge(mp,v=>v<12,v=>v<17):""}</span></div>
        <div style="font-size:.62rem;color:#64748b;margin-top:2px">MP &lt;12 J/min: safe · 12–17: elevated · &gt;17: high VILI risk</div>
      </div>`;
    }

    // ── GAS EXCHANGE ──
    else if (fm === FORMULAS.vent_gas) {
      const { pf, oi, aa, aa_norm, vd_vt, fio2, pao2 } = result;
      displayVal = `P/F ${pf}`;

      const pfStatus = pf >= 300 ? "ok" : pf >= 200 ? "warn" : "bad";
      const oiStatus = oi < 5 ? "ok" : oi < 15 ? "warn" : oi < 25 ? "bad" : "bad";
      const aaStatus = aa <= aa_norm + 5 ? "ok" : aa <= aa_norm + 25 ? "warn" : "bad";
      const vdStatus = !vd_vt ? "info" : vd_vt < 0.4 ? "ok" : vd_vt < 0.6 ? "warn" : "bad";

      // ARDS Berlin
      const ardsLabel = pf >= 400 ? "Normal" : pf >= 300 ? "Mild Impairment" :
                        pf >= 200 ? "Mild ARDS" : pf >= 100 ? "Moderate ARDS" : "Severe ARDS";

      html += `<div class="vent-section ${sc(pfStatus)}">
        <div class="vent-section-title">P/F Ratio — ARDS Berlin Classification</div>
        <div class="vent-row"><span class="vent-row-lbl">PaO₂/FiO₂</span>
          <span class="vent-row-val">${pf}</span></div>
        <div class="vent-row"><span class="vent-row-lbl">Classification</span>
          <span class="vent-row-val">${ardsLabel}</span></div>
        <div class="vent-row"><span class="vent-row-lbl">FiO₂</span>
          <span class="vent-row-val">${fio2}%</span></div>
        <div class="vent-row"><span class="vent-row-lbl">PaO₂</span>
          <span class="vent-row-val">${pao2} mmHg</span></div>
      </div>`;

      html += `<div class="vent-section ${sc(oiStatus)}">
        <div class="vent-section-title">Oxygenation Index</div>
        <div class="vent-row"><span class="vent-row-lbl">OI = (MAP×FiO₂)/PaO₂×100</span>
          <span class="vent-row-val">${oi} ${ventBadge(oi, v=>v<5, v=>v<15)}</span></div>
        <div style="font-size:.62rem;color:#64748b;margin-top:2px">&lt;5: normal · 5–15: mild · 15–25: moderate · &gt;25: severe</div>
      </div>`;

      html += `<div class="vent-section ${sc(aaStatus)}">
        <div class="vent-section-title">A-a Gradient</div>
        <div class="vent-row"><span class="vent-row-lbl">A-a gradient</span>
          <span class="vent-row-val">${aa} mmHg ${ventBadge(aa, v=>v<=aa_norm+5, v=>v<=aa_norm+25)}</span></div>
        <div class="vent-row"><span class="vent-row-lbl">Age-adjusted norm</span>
          <span class="vent-row-val">≤ ${aa_norm} mmHg</span></div>
      </div>`;

      if (vd_vt !== null) {
        html += `<div class="vent-section ${sc(vdStatus)}">
          <div class="vent-section-title">Dead Space (Vd/Vt)</div>
          <div class="vent-row"><span class="vent-row-lbl">Vd/Vt (Enghoff)</span>
            <span class="vent-row-val">${vd_vt} ${ventBadge(vd_vt, v=>v<0.4, v=>v<0.6)}</span></div>
          <div style="font-size:.62rem;color:#64748b;margin-top:2px">&lt;0.4: normal · 0.4–0.6: elevated · &gt;0.6: severe (PE, severe ARDS)</div>
        </div>`;
      }
    }

    // ── WEANING ──
    else if (fm === FORMULAS.vent_weaning) {
      const { rsbi, p01, nif, pf, v } = result;
      displayVal = `RSBI ${rsbi}`;

      const rsbiStatus = rsbi < 80 ? "ok" : rsbi < 105 ? "warn" : "bad";
      const p01Status  = p01 >= 1 && p01 <= 6 ? "ok" : "warn";
      const nifStatus  = !nif ? "info" : nif >= 20 ? "ok" : "bad";
      const pfStatus   = !pf ? "info" : pf >= 200 ? "ok" : pf >= 150 ? "warn" : "bad";
      const fioOk      = v.fio2 <= 50;
      const peepOk     = v.peep <= 8;

      // Weaning readiness score (simple checklist)
      const checks = [
        { label:"RSBI < 105",         pass: rsbi < 105 },
        { label:"RSBI < 80 (ideal)",  pass: rsbi < 80  },
        { label:"P0.1 1–6 cmH₂O",    pass: p01 >= 1 && p01 <= 6 },
        { label:"FiO₂ ≤ 50%",         pass: fioOk },
        { label:"PEEP ≤ 8 cmH₂O",    pass: peepOk },
        { label:"P/F ≥ 200",          pass: pf ? pf >= 200 : null },
        { label:"NIF ≤ −20 cmH₂O",   pass: nif ? nif >= 20 : null },
      ];
      const passed = checks.filter(c => c.pass === true).length;
      const total  = checks.filter(c => c.pass !== null).length;
      const score  = total > 0 ? Math.round((passed / total) * 100) : 0;
      const overallStatus = score >= 80 ? "ok" : score >= 60 ? "warn" : "bad";

      html += `<div class="vent-section ${sc(overallStatus)}">
        <div class="vent-section-title">Weaning Readiness Checklist</div>
        ${checks.map(ch => ch.pass === null
          ? `<div class="vent-row"><span class="vent-row-lbl">${ch.label}</span><span class="vent-badge vent-badge-info">not entered</span></div>`
          : `<div class="vent-row"><span class="vent-row-lbl">${ch.label}</span>
              <span class="${ch.pass ? 'vent-badge vent-badge-ok' : 'vent-badge vent-badge-bad'}">${ch.pass ? '✓' : '✕'}</span></div>`
        ).join('')}
        <hr class="vent-divider">
        <div class="vent-row"><span class="vent-row-lbl">Readiness score</span>
          <span class="vent-row-val">${passed}/${total} criteria met</span></div>
      </div>`;

      html += `<div class="vent-section ${sc(rsbiStatus)}">
        <div class="vent-section-title">RSBI (Yang-Tobin)</div>
        <div class="vent-row"><span class="vent-row-lbl">RSBI = RR / Vt(L)</span>
          <span class="vent-row-val">${rsbi} br/min/L ${ventBadge(rsbi, v=>v<80, v=>v<105)}</span></div>
        <div style="font-size:.62rem;color:#64748b;margin-top:2px">&lt;80: favourable · 80–105: borderline · &gt;105: predict failure</div>
      </div>`;

      html += `<div class="vent-section ${sc(p01Status)}">
        <div class="vent-section-title">P0.1 — Ventilatory Drive</div>
        <div class="vent-row"><span class="vent-row-lbl">P0.1</span>
          <span class="vent-row-val">${p01} cmH₂O ${ventBadge(p01, v=>v>=1&&v<=6, v=>v<1||v<=8)}</span></div>
        <div style="font-size:.62rem;color:#64748b;margin-top:2px">&lt;1: over-sedated · 1–6: adequate · &gt;6: high drive → fail risk</div>
      </div>`;

      if (nif !== null) {
        html += `<div class="vent-section ${sc(nifStatus)}">
          <div class="vent-section-title">NIF / MIP — Muscle Strength</div>
          <div class="vent-row"><span class="vent-row-lbl">NIF</span>
            <span class="vent-row-val">−${nif} cmH₂O ${ventBadge(nif, v=>v>=20, v=>v>=15)}</span></div>
          <div style="font-size:.62rem;color:#64748b;margin-top:2px">≤ −20 cmH₂O adequate for extubation · &gt; −15: high failure risk</div>
        </div>`;
      }
    }

    setText(elDisplay, displayVal || fm.label);
    setClass(elDisplay, "");
    setText(elLabel, title);
    if (elCopyBtn) elCopyBtn.dataset.copy = displayVal || fm.label;
    setClass(elInterpret, "calc-interpret");
    setClass(elVentCard, "show");
    setHTML(elVentCard, html);
    addHistory(title, displayVal);
  }


  /* ═══════════════════════════════════════════════════════════
     11c.  DRUG INFUSION CARD RENDERER
  ═══════════════════════════════════════════════════════════ */

  function renderDrugCard(result, fm) {
    setClass(elInterpret, "calc-interpret"); setHTML(elInterpret, "");
    setClass(elObCard, ""); setHTML(elObCard, "");
    if (elAbCard)   { setClass(elAbCard, "");   setHTML(elAbCard, ""); }
    if (elVentCard) { setClass(elVentCard, ""); setHTML(elVentCard, ""); }
    if (!elDrugCard) return;

    const di   = fm.drugInfo;
    const { rate, rev, extra } = result;
    const sc   = s => STATUS_CLASS[s] || "border-dashed-muted";

    // Determine which range the current dose falls in (forward mode only)
    const currentDose  = result.dose;
    const activeRange  = (di.ranges && currentDose !== null) ? di.ranges.find((r,i) => {
      const next = di.ranges[i+1];
      return currentDose >= r.min && (next ? currentDose < next.min : true);
    }) : null;

    const rStatus = !activeRange ? "info"
                  : di.ranges.indexOf(activeRange) === 0 ? "ok"
                  : di.ranges.indexOf(activeRange) === 1 ? "warn" : "bad";

    // Check if prep was used (prep fields filled)
    const prepAmtEl2 = document.getElementById("field-prep_amount");
    const prepVolEl2 = document.getElementById("field-prep_vol");
    const prepWasUsed = prepAmtEl2 && prepAmtEl2.value && prepVolEl2 && prepVolEl2.value;
    const prepUnitBtn2 = document.getElementById("prep-unit-btn");

    // Main rate display — or reverse-only header
    if (result.rate !== null) {
      setText(elDisplay,  `${result.rate} mL/hr`);
      setClass(elDisplay, "");
      setText(elLabel,    di.name);
      if (elCopyBtn) elCopyBtn.dataset.copy = `${di.name}: ${result.rate} mL/hr`;
    } else {
      // Reverse-only mode
      setText(elDisplay,  `${result.rev} ${di.doseUnit}`);
      setClass(elDisplay, "");
      setText(elLabel,    di.name + " — Reverse");
      if (elCopyBtn) elCopyBtn.dataset.copy = `${di.name} @ ${result.pumpRate} mL/hr = ${result.rev} ${di.doseUnit}`;
    }

    let html = "";

    // Drug class badge
    html += `<div class="drug-section border-dashed-primary">
      <div class="drug-section-title">Drug Profile</div>
      <span class="drug-class-badge" style="background:${di.classColor};color:${di.classText}">${di.drugClass}</span>
      ${prepWasUsed ? `<div class="prep-used-badge">
        <i class="bi bi-flask-fill me-1"></i>
        ${prepAmtEl2.value} ${prepUnitBtn2?.textContent?.trim() || di.prepUnit || ""}
        in ${prepVolEl2.value} mL
        = <strong>${parseFloat(document.getElementById("field-conc")?.value || 0).toFixed(result.conc < 1 ? 4 : 2)} ${di.concUnit}</strong>
      </div>` : ""}
      <div class="drug-note">${di.note ?? ""}</div>
    </div>`;

    // Infusion rate result (forward mode) OR reverse result prominently (reverse-only mode)
    if (result.rate !== null) {
      html += `<div class="drug-rate-box ${sc(rStatus)}">
        <div>
          <div class="drug-rate-label" style="color:#64748b">Pump Rate</div>
          <div class="drug-rate-value">${rate}</div>
          <div class="drug-rate-unit">mL / hour</div>
        </div>
        ${activeRange ? `<div style="text-align:right">
          <span class="drug-class-badge" style="background:${activeRange.color};color:${activeRange.text};margin-bottom:0">${activeRange.label}</span>
        </div>` : ""}
      </div>`;
    } else {
      // Reverse-only: show pump rate → dose prominently
      html += `<div class="drug-rate-box border-dashed-info">
        <div>
          <div class="drug-rate-label" style="color:#1e40af">↩ Pump ${result.pumpRate} mL/hr equals</div>
          <div class="drug-rate-value" style="color:#1e40af">${result.rev}</div>
          <div class="drug-rate-unit">${di.doseUnit}</div>
        </div>
      </div>`;
    }

    // Reverse calc box (forward mode only — shows alongside forward rate)
    if (result.rate !== null && rev !== null && rev !== undefined) {
      html += `<div class="drug-reverse-box border-dashed-info">
        <div class="drug-reverse-lbl">↩ Reverse: ${result.pumpRate} mL/hr =</div>
        <div class="drug-reverse-val">${rev} ${di.doseUnit}</div>
      </div>`;
    }

    // Extra info (e.g. propofol lipid calories)
    if (extra) {
      html += `<div class="drug-note" style="margin-top:6px;padding:8px;background:#f8faff;border-radius:7px">${extra}</div>`;
    }

    // Standard concentrations
    if (di.stdConc?.length) {
      html += `<div class="drug-section border-dashed-success">
        <div class="drug-section-title">Standard Preparations</div>
        ${di.stdConc.map(s => `
          <div class="drug-conc-row">
            <span class="drug-conc-lbl">${s.label}</span>
            <span class="drug-conc-val">${s.prep} = ${s.conc} ${di.concUnit}</span>
          </div>`).join("")}
      </div>`;
    }

    // Dose ranges
    if (di.ranges?.length) {
      html += `<div class="drug-section border-dashed-warning">
        <div class="drug-section-title">Dose Ranges</div>
        ${di.ranges.map((r, i) => {
          const isActive = r === activeRange;
          return `<div class="drug-range-row">
            <div class="drug-range-dot" style="background:${r.color};border:1.5px solid ${r.text}"></div>
            <span class="drug-range-txt">${r.label}</span>
            <span class="drug-range-val">${r.min}–${r.max} ${di.doseUnit}</span>
            ${isActive ? `<span class="drug-curr-indicator" style="background:${r.color};color:${r.text}">▶ current</span>` : ""}
          </div>`;
        }).join("")}
      </div>`;
    }

    setClass(elDrugCard, "show");
    setHTML(elDrugCard, html);
    addHistory(di.name, `${rate} mL/hr`);
  }


  /* ═══════════════════════════════════════════════════════════
     12.  OB CARD
  ═══════════════════════════════════════════════════════════ */

  function renderObCard(result) {
    setClass(elInterpret, "calc-interpret"); setHTML(elInterpret, "");
    if (elAbCard) { setClass(elAbCard, ""); setHTML(elAbCard, ""); }
    if (result.error) return showError(result.error);

    const { weeks, rem, edd, daysToEdd, conception, trimester, trimClass, pctComplete, days } = result;
    const fmt = d => d.toLocaleDateString(undefined, { day:"numeric", month:"short", year:"numeric" });

    setText(elDisplay, `${weeks}w ${rem}d`);
    setClass(elDisplay, "");
    setText(elLabel, "Gestational Age");
    if (elCopyBtn) elCopyBtn.dataset.copy = `GA: ${weeks}w ${rem}d · EDD: ${fmt(edd)}`;

    const remaining = daysToEdd > 0 ? `${daysToEdd} days remaining` : `Overdue by ${Math.abs(daysToEdd)} days`;
    // OB card uses .border-dashed-success via class (set in HTML #calc-ob-card → inherits project style)
    setClass(elObCard, "show border-dashed-success");
    setHTML(elObCard, `
      <span class="ob-trim-badge ${trimClass}">Trimester ${trimester}</span>
      <div class="ob-grid">
        <div class="ob-cell"><div class="ob-cell-lbl">EDD (Naegele)</div><div class="ob-cell-val">${fmt(edd)}</div></div>
        <div class="ob-cell"><div class="ob-cell-lbl">Status</div><div class="ob-cell-val">${remaining}</div></div>
        <div class="ob-cell"><div class="ob-cell-lbl">Conception (est.)</div><div class="ob-cell-val">${fmt(conception)}</div></div>
        <div class="ob-cell"><div class="ob-cell-lbl">Days elapsed</div><div class="ob-cell-val">${days} days</div></div>
      </div>
      <div style="margin-top:10px">
        <div style="display:flex;justify-content:space-between;font-size:.6rem;color:#6c757d;margin-bottom:3px">
          <span>LMP</span><span>${pctComplete.toFixed(0)}% of 40 weeks</span><span>EDD</span>
        </div>
        <div class="ob-prog-outer"><div class="ob-prog-inner" style="width:${pctComplete}%"></div></div>
      </div>`);

    addHistory("EDD / GA", `${weeks}w ${rem}d`);
  }


  /* ═══════════════════════════════════════════════════════════
     13.  COPY BUTTON
  ═══════════════════════════════════════════════════════════ */

  if (elCopyBtn) {
    elCopyBtn.addEventListener("click", () => {
      const text = elCopyBtn.dataset.copy;
      if (!text) return;
      navigator.clipboard?.writeText(text).then(() => {
        elCopyBtn.textContent = "✓ Copied";
        elCopyBtn.classList.add("copied");
        setTimeout(() => { elCopyBtn.textContent = "Copy"; elCopyBtn.classList.remove("copied"); }, 1500);
      });
    });
  }


  /* ═══════════════════════════════════════════════════════════
     14.  HISTORY
  ═══════════════════════════════════════════════════════════ */

  function addHistory(label, value) {
    const time = new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
    calcHistory.unshift({ label, value, time });
    if (calcHistory.length > 30) calcHistory.pop();
    renderHistory();
  }

  function renderHistory() {
    if (!elHistList) return;
    if (!calcHistory.length) { elHistList.innerHTML = `<div style="font-size:.72rem;color:#adb5bd;padding:6px 10px">No calculations yet</div>`; return; }
    elHistList.innerHTML = "";
    calcHistory.forEach(h => {
      const item = document.createElement("div");
      item.className = "hist-item";
      item.title = "Click to copy";
      item.innerHTML = `<div><div class="hist-label">${h.label}</div><div class="hist-value">${h.value}</div></div><div class="hist-time">${h.time}</div>`;
      item.addEventListener("click", () => navigator.clipboard?.writeText(`${h.label}: ${h.value}`));
      elHistList.appendChild(item);
    });
  }

  document.getElementById("history-toggle")?.addEventListener("click", () => {
    if (!elHistList) return;
    const visible = elHistList.style.display !== "none";
    elHistList.style.display = visible ? "none" : "block";
    const arrow = document.getElementById("history-arrow");
    if (arrow) arrow.textContent = visible ? "▸" : "▾";
    if (!visible && !calcHistory.length) renderHistory();
  });


  /* ═══════════════════════════════════════════════════════════
     15.  SCIENTIFIC CALCULATOR
  ═══════════════════════════════════════════════════════════ */

  const elSciDisplay = document.getElementById("sci-display");
  const elSciExpr    = document.getElementById("sci-expr-display");
  const elSciMemBar  = document.getElementById("sci-memory-bar");
  let sciExpr = "", sciResult = "", sciMemory = null;

  function updateSci() {
    setText(elSciExpr, sciExpr || "");
    setText(elSciDisplay, sciResult || sciExpr || "0");
    setText(elSciMemBar, sciMemory !== null ? `M: ${sciMemory}` : "M: —");
  }

  document.querySelectorAll("[data-sci-val]").forEach(btn => btn.addEventListener("click", () => {
    if (sciResult) { sciExpr = sciResult; sciResult = ""; }
    sciExpr += btn.dataset.sciVal; updateSci();
  }));

  document.querySelectorAll("[data-sci-fn]").forEach(btn => btn.addEventListener("click", () => {
    const base = sciExpr || sciResult, fn = btn.dataset.sciFn; sciResult = "";
    if      (fn === "sqrt")  sciExpr = `sqrt(${base})`;
    else if (fn === "sq")    sciExpr = `(${base})^2`;
    else if (fn === "log10") sciExpr = base + "log10(";
    else if (fn === "log")   sciExpr = base + "log(";
    updateSci();
  }));

  document.querySelectorAll("[data-sci]").forEach(btn => btn.addEventListener("click", () => {
    const cmd = btn.dataset.sci;
    try {
      const cur = (sciExpr || sciResult) ? parseFloat(window.math.evaluate(sciExpr || sciResult)) : 0;
      if      (cmd === "mc") sciMemory = null;
      else if (cmd === "mr") { if (sciMemory !== null) { sciExpr += sciMemory; sciResult = ""; } }
      else if (cmd === "m+") { sciMemory = (sciMemory ?? 0) + cur; sciExpr = ""; sciResult = ""; }
      else if (cmd === "m-") { sciMemory = (sciMemory ?? 0) - cur; sciExpr = ""; sciResult = ""; }
    } catch {}
    updateSci();
  }));

  document.getElementById("calc-clear")?.addEventListener("click",  () => { sciExpr = ""; sciResult = ""; updateSci(); });
  document.getElementById("calc-back")?.addEventListener("click",   () => { if (sciResult) { sciExpr = sciResult; sciResult = ""; } sciExpr = sciExpr.slice(0,-1); updateSci(); });
  document.getElementById("calc-equals")?.addEventListener("click", evaluateSci);

  function evaluateSci() {
    const expr = sciExpr || sciResult; if (!expr) return;
    try {
      const raw = window.math.evaluate(expr);
      const result = typeof raw === "number" ? raw : (raw.toNumber?.() ?? Number(raw));
      if (!isFinite(result)) throw new Error();
      sciResult = parseFloat(result.toFixed(12)).toString(); sciExpr = ""; updateSci();
      addHistory("Scientific", sciResult);
    } catch { sciExpr = ""; sciResult = ""; setText(elSciDisplay, "Error"); }
  }

  document.addEventListener("keydown", e => {
    if (!document.getElementById("tab-scientific")?.classList.contains("active")) return;
    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
    const k = e.key;
    if ("0123456789.()^%".includes(k)) { sciExpr += k; updateSci(); e.preventDefault(); }
    else if (["+","-","*"].includes(k)) { sciExpr += k; updateSci(); e.preventDefault(); }
    else if (k === "/")          { e.preventDefault(); sciExpr += "/"; updateSci(); }
    else if (k === "Enter" || k === "=") { evaluateSci(); e.preventDefault(); }
    else if (k === "Backspace")  { sciExpr = sciExpr.slice(0,-1); updateSci(); e.preventDefault(); }
    else if (k === "Escape")     { sciExpr = ""; sciResult = ""; updateSci(); e.preventDefault(); }
  });


  /* ═══════════════════════════════════════════════════════════
     16.  UTILITIES
  ═══════════════════════════════════════════════════════════ */

  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }


  /* ═══════════════════════════════════════════════════════════
     17.  INIT
  ═══════════════════════════════════════════════════════════ */

  switchFormula("bmi");

}); // end DOMContentLoaded

