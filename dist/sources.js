export const CLINICAL_SOURCES = [
  {
    id: 'impella-cp',
    title: 'Impella CP with SmartAssist — US IFU, V11.1 (2026)',
    url: 'https://www.heartrecovery.com/en-us/resources/downloads/ifu-impella-cp-with-smartassist',
    detail: 'Sections 4.10–4.11: measured Ao, calculated LV and motor current; 5.35: purge troubleshooting; 7.17–7.19: suction and hemolysis. The linked manufacturer PDF was inspected on October 20, 2026.'
  },
  {
    id: 'impella-55',
    title: 'Impella 5.5 with SmartAssist — Generation 2 US IFU (2026)',
    url: 'https://www.heartrecovery.com/en-us/resources/downloads/ifu-impella-55-with-smartassist-gen-2',
    detail: 'Sections 4.9–4.10: placement estimates and motor current; 7.12–7.16 and the alarm table: position concerns and trained-operator management. The linked manufacturer PDF was inspected on October 20, 2026.'
  },
  {
    id: 'purge-alert',
    title: 'FDA — Automated Impella Controller purge-disc recognition recall',
    url: 'https://www.fda.gov/medical-devices/medical-device-recalls-and-early-alerts/heart-pump-controller-recall-abiomed-removes-automated-impella-controllers',
    detail: 'Updated September 24, 2026; checked October 20, 2026. Persistent purge-disc recognition failure requires backup-controller preparation and the trained device team. Apply the actual device notice and local procedure.'
  },
  {
    id: 'aarc-sbt', title: 'AARC — Spontaneous breathing trials for adult ventilator liberation (2024)',
    url: 'https://www.aarc.org/wp-content/uploads/2023/11/CPG2024SpontaneousBreathingTrial.pdf',
    detail: 'Readiness, trial tolerance and extubation / airway protection are distinct. The floor cases use team-directed trials and case-specific support / reassessment orders.'
  },
  {
    id: 'cdc-lines', title: 'CDC — Intravascular catheter infection-prevention recommendations',
    url: 'https://www.cdc.gov/infection-control/hcp/intravascular-catheter-related-infections/summary-recommendations.html',
    detail: 'Current CDC summary of the 2011 guideline, dated February 28, 2024: trained personnel, sterile barriers, skin antisepsis and closed sterile pressure-monitoring systems. Equipment drills test preparation; no insertion authority is implied.'
  },
  {
    id: 'snacc-evd', title: 'SNACC — Perioperative management of external ventricular / lumbar drains (2017)',
    url: 'https://snacc.org/wp-content/uploads/2016/11/SNACC_EVD_LD_Manuscript.pdf',
    detail: 'Reference level, prescribed drainage / measurement configuration and careful movement / handoff. The fictional EVD order restricts flushing and invasive troubleshooting; it is not a universal statement about RN scope.'
  },
  {
    id: 'evd-nursing', title: 'External Ventricular Drains: Development and Evaluation of a Nursing Clinical Practice Guideline (2022)',
    url: 'https://doi.org/10.3390/nursrep12040090',
    detail: 'Original guideline-development study; abstract / indexed sections checked for nursing leveling, observations and movement documentation. Publisher full text was rate-limited. This is not an HCA protocol or local approval.'
  },
  {
    id: 'kdigo-aki', title: 'KDIGO — AKI guideline and update status',
    url: 'https://kdigo.org/guidelines/acute-kidney-injury/',
    detail: 'The official page still lists the 2012 final guideline and a 2026 update being prepared after public review. The 2026 draft is not used as final guidance. The SLED case tests prescribed fluid-removal tolerance / escalation, not a machine IFU or modality-selection algorithm.'
  },
  {
    id: 'aha-special', title: 'AHA — 2025 resuscitation guidance: special circumstances / cardiac surgery',
    url: 'https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-and-pediatric-special-circumstances-of-resuscitation/',
    detail: 'Cardiac-surgery deterioration can involve bleeding / tamponade and needs the trained cardiac team. The floor CABG cases do not teach a complete cardiac-arrest algorithm, independent drain manipulation or chest reopening.'
  },
  {
    id: 'aha-post', title: 'AHA — 2025 post–cardiac arrest care',
    url: 'https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/post-cardiac-arrest-care',
    detail: 'Receiving assessment of airway / ventilation, circulation and the diagnostic plan. The admission exercise is room / handoff readiness; it does not infer individual prognosis or model the full post-arrest pathway.'
  },
  {
    id: 'ssc-sepsis', title: 'SCCM — Surviving Sepsis Campaign adult guidelines (2026)',
    url: 'https://www.sccm.org/clinical-resources/guidelines/guidelines/surviving-sepsis-campaign-international-guidelines-for-management-of-sepsis-and-septic-shock-2026',
    detail: 'Perfusion, congestion, treatment response and urgent resuscitation / escalation. The step-down transfer has stabilized before Alpha admission; renewed instability requires review of treatment and care location.'
  },
  {
    id: 'dka-consensus', title: 'ADA / EASD and collaborating societies — Hyperglycemic crises consensus (2024)',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11272983/',
    detail: 'Transition and last-dose handoff, crisis-resolution context and avoiding glucose-only conclusions. The step-down case assumes documented resolution and an established prescribed subcutaneous regimen; it does not teach a new dosing algorithm.'
  },
  {
    id: 'aha-ich', title: 'AHA / ASA — Spontaneous intracerebral hemorrhage guideline (2022)',
    url: 'https://professional.heart.org/en/science-news/2022-guideline-for-the-management-of-patients-with-spontaneous-intracerebral-hemorrhage/top-things-to-know',
    detail: 'Recognition of neurologic deterioration and specialist / diagnostic management. The case has a diagnosed spontaneous intraparenchymal hemorrhage and an explicit fictional BP target; the fall does not establish a traumatic-bleed diagnosis.'
  },
  {
    id: 'aasld-varices', title: 'AASLD — Variceal bleeding: resuscitation, prescribed therapy and endoscopic management',
    url: 'https://www.aasld.org/liver-fellow-network/core-series/why-series/why-do-we-use-early-tips-management-variceal-bleeding',
    detail: 'Society educational explanation of the guideline pathway. The game emphasizes urgent airway / perfusion assessment and team-directed resuscitation / endoscopy. CT / CTA is not a universal first response or a substitute for stabilizing the patient.'
  },
  {
    id: 'sccm-nmba', title: 'SCCM — Neuromuscular blockade in adults with ARDS (2026)',
    url: 'https://www.sccm.org/clinical-resources/guidelines/guidelines/guidelines-for-the-administration-of-neuromuscular-blockade',
    detail: 'Conditional recommendations and uncertainty around dosing / monitoring strategies. The readiness / TOF task uses an explicit fictional order; no universal twitch target, stimulus current, titration method or requirement for one sedation-monitoring device is asserted.'
  },
  {
    id: 'sccm-padis', title: 'SCCM — PADIS guideline with linked 2025 focused update',
    url: 'https://www.sccm.org/clinical-resources/guidelines/guidelines/guidelines-for-the-prevention-and-management-of-pa',
    detail: 'Separate pain assessment / analgesia from sedation and review the indication / goal. The medication workspace teaches roles and order verification, not interchangeable first-line drugs or an administration protocol.'
  },
  {
    id: 'rocuronium-label', title: 'DailyMed — Rocuronium bromide prescribing information',
    url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=1543ea2b-54ab-4088-a72a-5d71854a2dce',
    detail: 'Warnings on paralysis / respiratory support and adequate anesthesia / sedation; rocuronium does not provide pain relief or unconsciousness. The game does not recommend it as a universal ARDS agent or supply a prolonged ICU infusion regimen.'
  }
  ,{id:'shm-ultrasound',title:'Society of Hospital Medicine — Ultrasound-guided vascular access position statement (2019)',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC10193861/',detail:'Vessel identification, real-time tip tracking and structured procedural training. The arcade image is an abstract phantom puzzle, not clinical sonography or proof of IV competence.'},
  {id:'edwards-pressure',title:'Edwards — VolumeView set IFU, DOC-0259128A',url:'https://eifu.edwards.com/eifu/5970f1b346e0fb00015e5f4d/DOC-0259128A.pdf',detail:'Sections 10.2–10.3: priming away from the patient, removing air, pressure-system configuration, reference level / zeroing. The arcade setup uses a case-specific 300 mmHg pressure-bag target; actual equipment and IFU govern practice.'},
  {id:'bicarbonate-purge',title:'Abiomed / HeartRecovery — Heparin-free purge',url:'https://www.heartrecovery.com/en-us/education/heparin-free-purge',detail:'Bicarbonate purge as an alternative with heparin intolerance / contraindication. The arcade pharmacy quest adds an explicit fictional device-team order; it does not prescribe bicarbonate for every Impella patient.'},
  {id:'scai-purge',title:'SCAI — Impella anticoagulation management in the CCU (2022)',url:'https://www.scai.org/quality-improvement-tools/qi-tips/impella-anticoagulation-management-ccu',detail:'Purge versus systemic anticoagulation and the 25 mEq/L bicarbonate / D5W example. The fictional 500 mL bag contains 12.5 mEq total. Pharmacy preparation, label verification and device-team handoff are separate game events.'}
,{id:'aha-rhythm',title:'AHA — 2025 Adult Advanced Life Support: tachyarrhythmia assessment',url:'https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-advanced-life-support',detail:'Clinical stability, symptoms and context direct care; no diagnosis from a monitor label or independent antiarrhythmic order. Quick-shift follow-up is scripted, not a treatment-effect prediction.'}
,{id:'af-postop',title:'ACC/AHA/ACCP/HRS — 2023 atrial fibrillation guideline',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11095842/',detail:'Sections 4.2.2 and 10.9.2: clinician interpretation of ECG signals and individualized postoperative management. This game teaches assessment, coordination, reassessment and handoff; it imports no drug regimen.'}
];
