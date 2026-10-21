# Clinical review record

Build 0.3 candidate · source checks performed October 20, 2026.

**Nurse-manager/educator approval has not been established.** This is a fictional,
unvalidated educational prototype. A source check is distinct from independent
clinical review, local scope approval or validation of the game as an assessment.

## Delta source checks

| Primary source | Material inspected | Application |
| --- | --- | --- |
| [Impella CP with SmartAssist US IFU](https://www.heartrecovery.com/en-us/resources/downloads/ifu-impella-cp-with-smartassist), V11.1, 2026 | Manufacturer-linked PDF: sections 4.10–4.11, 5.35, 7.17–7.19, and alarm table | Measured Ao versus calculated LV, motor-current interpretation, suction/position assessment, purge distinction, and hemolysis evaluation |
| [Impella 5.5 with SmartAssist Generation 2 US IFU](https://www.heartrecovery.com/en-us/resources/downloads/ifu-impella-55-with-smartassist-gen-2), 2026 | Manufacturer-linked PDF: sections 4.9–4.10, 7.12–7.16, and alarm table | LV estimate unavailable at P3 and below; position alarms, systemic perfusion and credentialed-operator correction |
| [FDA Automated Impella Controller recall](https://www.fda.gov/medical-devices/medical-device-recalls-and-early-alerts/heart-pump-controller-recall-abiomed-removes-automated-impella-controllers), updated September 24, 2026 | Device recognition failure and response recommendations | D6: purge disc check by the trained specialist, then coordinated backup-controller exchange if recognition remains absent |

The linked manufacturer PDFs were downloaded from their public resource pages and
inspected directly. They are not redistributed in this repository. Use the actual
device/software IFU and current safety notices in clinical practice.

## Case assumptions

- D1–D4 retain the original reduced-filling, RV dysfunction and two position cases.
  Their clinical orders and numerical responses are fictional teaching events.
- D5 adds new urine appearance, output, bleeding/access assessment, laboratory trends,
  a working-concern choice, specialist investigation and reassessment. Laboratory
  reference ranges are labelled as the fictional case laboratory's ranges. The first
  result event represents 20 compressed minutes. A later two-hour follow-up remains
  due; the case does not invent immediate urine clearing or normalized laboratory values.
- D6 models a particular purge-disc recognition failure. Blood-pump flow persists while
  the purge needs urgent attention. Disc handling and controller exchange are assigned
  to the trained specialist; the RN assesses, escalates, prepares and monitors.
- A wrong reasoning choice does not simulate an injury or certify incompetence. It
  fails to unlock cause-specific care and supplies feedback. Urgent notification is
  available before routine observations or the reasoning step.
- An unchanged early MAP or waveform does not rule out a complication. None of the
  scripted outcomes is a patient-specific prediction.

## Interface corrections and limits

The teaching display suppresses the calculated LV waveform and value below P4.
Recorded alarm-onset findings remain labelled separately. The motor-current drawing
is schematic, not a calibrated electrical signal. No exact controller interface,
continuous physiology or complete device troubleshooting algorithm is claimed.

Action responses persist in the case and timeline. Initial assessment cards retain
the starting findings and are labelled accordingly. Typed notes and progress remain
browser-local. The note checklist checks completeness, not clinical truth.

## Remaining review

Confirm local nursing authority, realistic alternatives, medication verification,
laboratory schedules, device/software versions and all debrief language with the
educator/device team. Add reviewer name, reviewed date, protocol version and scope
only after that review occurs. Source-checking by the developer does not fill those
fields. The Bravo cases and general pocket guide retain their prototype status;
this Delta review does not establish approval of either.

## Floor workflow review — 0.3 candidate

The first floor framework adds fifteen fictional patient profiles and three shift
formats. This is a source-informed draft, not a completed clinical curriculum or
validated continuous patient model. The separate focused-case engine is retained.

| Primary / organizational source | Scope checked | Game application / limit |
| --- | --- | --- |
| [AARC adult SBT guideline, 2024](https://www.aarc.org/wp-content/uploads/2023/11/CPG2024SpontaneousBreathingTrial.pdf) | Readiness, trial tolerance, airway protection and extubation distinction | Medical recovery and post-status-airway cases; RT / provider own the scripted trial / extubation events |
| [CDC catheter recommendations](https://www.cdc.gov/infection-control/hcp/intravascular-catheter-related-infections/summary-recommendations.html), current page dated 2024, guideline 2011 | Trained staff, maximal CVC barriers, skin antisepsis and closed sterile pressure systems | Arterial / CVC equipment preparation. No insertion, site-selection or catheter-use authorization is granted by a correct tray |
| [SNACC EVD / lumbar-drain guidance](https://snacc.org/wp-content/uploads/2016/11/SNACC_EVD_LD_Manuscript.pdf), 2017 | Reference level, drainage versus measurement state, inspection, movement and handoff | Explicit fictional 15 cmH₂O order; ICP / CPP readings identify a valid ordered measurement context. Invasive actions are restricted by this case, not by a universal assertion about RN scope |
| [EVD nursing guideline-development study](https://doi.org/10.3390/nursrep12040090), 2022 | Indexed abstract / sections on nursing observation and leveling | Supporting reference only; publisher full text was rate-limited. Does not establish an HCA protocol |
| [KDIGO AKI guideline / update page](https://kdigo.org/guidelines/acute-kidney-injury/) and final 2012 guideline section 5.6 | SLED / other RRT context, hemodynamic tolerance and current update status | Generic prescription / net-removal case. The official 2026 document remained a public-review draft / publication in preparation; it was not treated as final guidance. No machine IFU is assumed |
| [AHA special-circumstance resuscitation guidance](https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-and-pediatric-special-circumstances-of-resuscitation/), 2025 | Cardiac surgery, bleeding / tamponade, specialist response | CABG change recognition and escalation. No complete arrest / chest-reopening algorithm is implemented. The earlier STS consensus was also inspected as background |
| [AHA post–cardiac arrest care](https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/post-cardiac-arrest-care), 2025 | Receiving assessment of ventilation, circulation and diagnostic plan | Admission / infusion handoff; early exam and pressor count do not provide individual prognosis |
| [SCCM SSC adult guidance](https://www.sccm.org/clinical-resources/guidelines/guidelines/surviving-sepsis-campaign-international-guidelines-for-management-of-sepsis-and-septic-shock-2026), 2026 | Perfusion / congestion, reassessment and escalation | Stabilized Alpha transfer with renewed deterioration. No universal fluid or pressor order is inferred |
| [ADA / EASD collaborative crisis consensus](https://pmc.ncbi.nlm.nih.gov/articles/PMC11272983/), 2024, transition section | Resolution context, transition / last-dose handoff and nutrition | Alpha patient has already transitioned under a prescribed regimen. The meal / MAR discrepancy is reconciled rather than restarting an old infusion or diagnosing from glucose alone |
| [AHA / ASA spontaneous ICH summary](https://professional.heart.org/en/science-news/2022-guideline-for-the-management-of-patients-with-spontaneous-intracerebral-hemorrhage/top-things-to-know), 2022 | New neuro deficits and team / diagnostic management | Case explicitly has diagnosed spontaneous intraparenchymal hemorrhage. Its coincident fall does not make this a general traumatic-hemorrhage protocol |
| [AASLD variceal bleeding explanation](https://www.aasld.org/liver-fellow-network/core-series/why-series/why-do-we-use-early-tips-management-variceal-bleeding) and [current guidance index](https://www.aasld.org/practice-guidelines/portal-hypertension-bleeding-cirrhosis) | Resuscitation, prescribed vasoactive / antibiotic therapy and endoscopic pathway | No automatic CTA, transfusion threshold or drug-dose algorithm. The linked primary practice-guidance DOI was paywalled; full educator / GI review remains necessary |
| [SCCM ARDS neuromuscular-blockade guideline](https://www.sccm.org/clinical-resources/guidelines/guidelines/guidelines-for-the-administration-of-neuromuscular-blockade), 2026 | Conditional recommendations / uncertainty in NMBA, dosing and monitoring strategies | Team-selected readiness / TOF documentation exercise, not mandatory paralysis for every ventilated or proned patient; no universal TOF target / stimulus / titration method |
| [SCCM PADIS guidance and linked 2025 update](https://www.sccm.org/clinical-resources/guidelines/guidelines/guidelines-for-the-prevention-and-management-of-pa) and [rocuronium label](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=1543ea2b-54ab-4088-a72a-5d71854a2dce) | Distinct analgesia / sedation roles; adequate anesthesia / sedation with paralysis; respiratory support | No guessed fentanyl / propofol / midazolam / pressor bundle. TOF is not pain or awareness monitoring; movement-based RASS cannot establish sedation during paralysis. No prolonged ICU rocuronium regimen is supplied |

### Explicit fictional assumptions

- Numerical vitals, targets, lab reference intervals, collection schedules, room
  equipment, observed TOF current / site / counts and responses belong to each case.
- Fifteen-minute and hourly observations, two-hour positioning and laboratory
  schedules are game prescriptions. They do not define unit staffing, observation
  frequency or authority for every patient at that acuity.
- Net UF may be held by the trained RN only under the SLED case's explicit order.
  That does not stop the blood pump or authorize circuit disconnection, albumin,
  fluid loading, a new UF goal or a new modality.
- New instability never requires finishing the routine report / chart / assessment
  checklist before notifying the clinical team. Cause-specific responses need the
  relevant findings and order. A clinical positioning hold retains the unfinished
  task and a reassessment deadline rather than marking a turn complete.
- A plan does not instantly replace the current exam with improved findings.
  Response assessment waits for its displayed interval. The prior-hour urine value
  remains a prior measurement; no instant renal recovery is invented.
- The current laboratory engine provides case snapshots with collection / result
  timestamps; it is not a biochemical or treatment-kinetics model. A pre-change
  sample cannot turn into evidence of a later event.
- Flowsheets record observations obtained by the player, keeping performed time
  separate from charting time. Authored SBAR text is never automatically declared
  clinically correct. The checklist measures field completeness only.
- Admission screening and blood-bank identification depend on the actual orders
  and local process. The unclear dictated medication / band names are not guessed.
- The Expanse-style workspace is a fictional organization of orders, worklist,
  MAR, diagnostics and documentation. There is no hospital EHR connection or claim
  of an exact Meditech screen / configuration.

Clinical educator / manager / specialty review and actual phone / desktop browser
QA remain separate from the automated scenario checks. Source checking does not
fill a reviewer approval field. The offered SLED photograph, machine IFU and local
scope / charting examples are still needed before a facility-specific version.
