# LIFE-LINK 400-patient demo dataset

**Important:** All 400 records in this file are artificially generated demonstration records. They are not real people and must not be represented as real clinical records. Use only in a local/demo environment.

## Files
- `lifelink_400_synthetic_patients.csv` — 400 patient/person rows mapped to the LIFE-LINK `Person` and `Patient` tables.
- `import_400_patients.sql` — MySQL staging-table importer. Run after the existing schema and seed data.

## Import
1. Back up your database.
2. Run the existing `database/schema.sql` and `database/seed_data.sql`.
3. Update the CSV absolute path inside `import_400_patients.sql`.
4. Ensure your MySQL client permits `LOAD DATA LOCAL INFILE`.
5. Run the importer once. IDs use Person 10001–10400 and Patient 20001–20400.
6. Verify with:
   `SELECT COUNT(*) FROM Patient WHERE patient_id BETWEEN 20001 AND 20400;`

The generated dataset uses hospital IDs 1–5 and ward IDs already present in the project's seed data. It intentionally leaves attending_doctor_id NULL so it does not assume staff IDs that may differ in a local database.

## Source note
For a larger, externally generated healthcare dataset, use Synthea (MITRE), which produces realistic but synthetic patient histories and CSV exports: https://synthetichealth.github.io/synthea/ . The Synthea project explicitly states that records are synthetic, not real, and contain no individual-level data. This bundled 400-row file is a compact schema-mapped demo fixture, not a downloaded Synthea extract.
