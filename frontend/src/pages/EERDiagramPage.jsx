import React, { useState } from 'react';
import PageHeader from '../components/common/PageHeader';
import Tabs from '../components/common/Tabs';
import Button from '../components/common/Button';
import { Download, ExternalLink, Network, FileText, Code2 } from 'lucide-react';

const EERDiagramPage = () => {
  const [activeTab, setActiveTab] = useState('diagram');

  const tabs = [
    { id: 'diagram', label: 'Visual Diagram (eer_diagram.png)' },
    { id: 'concepts', label: 'Schema Architecture & Justifications' },
    { id: 'mermaid', label: 'Mermaid Source (eer_diagram.mmd)' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={['10 ARCHITECTURE', 'EER SPECIFICATION']}
        title="Enhanced Entity-Relationship (EER) Architecture"
        description="Conceptual data model, specialization hierarchies, aggregation modeling, and relational constraints."
        action={
          <a
            href="/api/database-artifacts/eer_diagram.png"
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="secondary" size="sm" icon={ExternalLink}>
              Open High-Res PNG
            </Button>
          </a>
        }
      />

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Visual Diagram */}
      {activeTab === 'diagram' && (
        <div className="space-y-6">
          <figure className="border border-rule bg-surface p-4 flex flex-col items-center">
            <div className="w-full overflow-x-auto flex justify-center bg-paper p-2 border border-rule">
              <img
                src="/api/database-artifacts/eer_diagram.png"
                alt="LIFE-LINK Enhanced Entity-Relationship Architecture Diagram"
                className="w-full h-auto border border-rule max-h-[850px] object-contain mx-auto"
                loading="lazy"
                onError={(e) => {
                  if (!e.target.dataset.triedFallback) {
                    e.target.dataset.triedFallback = 'true';
                    e.target.src = 'http://localhost:5000/database-artifacts/eer_diagram.png';
                  }
                }}
              />
            </div>
            <figcaption className="text-center mt-3 text-xs text-muted font-mono">
              Figure 1.1: LIFE-LINK Normalized Relational Schema & Overlapping Specialization Hierarchy (300 DPI)
            </figcaption>
          </figure>

          {/* Core EER Concepts Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-rule bg-surface p-4 space-y-2 font-sans">
              <div className="font-mono text-[10px] text-muted uppercase tracking-wider font-semibold">
                Pattern 01
              </div>
              <h3 className="font-serif text-base font-semibold text-ink">
                Overlapping Specialization
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                <code className="font-mono text-ink">Person</code> serves as the supertype entity. 
                <code className="font-mono text-ink">Donor</code>, <code className="font-mono text-ink">Patient</code>, and 
                <code className="font-mono text-ink">Staff</code> inherit through 1:0..1 foreign keys. 
                A single person can hold multiple roles simultaneously without duplicating demographic data.
              </p>
            </div>

            <div className="border border-rule bg-surface p-4 space-y-2 font-sans">
              <div className="font-mono text-[10px] text-muted uppercase tracking-wider font-semibold">
                Pattern 02
              </div>
              <h3 className="font-serif text-base font-semibold text-ink">
                EER Aggregation Modeling
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                <code className="font-mono text-ink">DonationCamp</code> aggregated with participants 
                via <code className="font-mono text-ink">CampDonorRegistration</code> forms a higher-level 
                organizational drive entity that directly yields batch collection activities.
              </p>
            </div>

            <div className="border border-rule bg-surface p-4 space-y-2 font-sans">
              <div className="font-mono text-[10px] text-muted uppercase tracking-wider font-semibold">
                Pattern 03
              </div>
              <h3 className="font-serif text-base font-semibold text-ink">
                M:N Junction & Row Locking
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                <code className="font-mono text-ink">BloodAllocation</code> resolves the M:N relationship between 
                requests and units. Enforces <code className="font-mono text-ink">UNIQUE(unit_id)</code> so a bag 
                cannot be double-allocated, secured by ACID row locking.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Schema Documentation & Justifications */}
      {activeTab === 'concepts' && (
        <div className="border border-rule bg-surface p-6 space-y-6 text-xs text-ink leading-relaxed font-sans">
          <div className="pb-3 border-b border-rule">
            <h2 className="font-serif text-lg font-semibold text-ink">
              Relational Schema Architecture & Design Justifications
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Academic rationale for normalization, table structures, and integrity constraints.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-serif text-sm font-semibold text-blood">
              1. Person Specialization Hierarchy
            </h3>
            <p className="text-muted">
              In healthcare management, modeling human actors requires balancing strict normalization with clinical reality.
              LIFE-LINK implements <strong>Overlapping Specialization</strong> using subtype extension tables:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-muted">
              <li>
                <strong className="text-ink">Person Supertype:</strong> Houses immutable demographics (name, DOB, gender, phone, email, address, confirmed ABO/Rh group).
              </li>
              <li>
                <strong className="text-ink">Donor Subtype:</strong> References <code className="font-mono text-ink">Person(person_id)</code> with <code className="font-mono text-ink">UNIQUE</code> constraint; tracks donor type, availability, deferral reasons.
              </li>
              <li>
                <strong className="text-ink">Patient Subtype:</strong> References <code className="font-mono text-ink">Person(person_id)</code> with <code className="font-mono text-ink">UNIQUE</code> constraint; tracks admission date, assigned ward, and medical status.
              </li>
              <li>
                <strong className="text-ink">Staff Subtype:</strong> References <code className="font-mono text-ink">Person(person_id)</code> with <code className="font-mono text-ink">UNIQUE</code> constraint; tracks hospital employment, department, and supervisory hierarchy.
              </li>
            </ul>
            <div className="p-3 border border-rule bg-paper text-muted">
              <strong className="text-ink">Design Justification:</strong> Enforcing disjoint specialization would make it impossible for a hospital doctor to donate blood, or for a voluntary donor to be treated as an admitted patient, without creating duplicate person rows. Overlapping specialization via subtype tables eliminates redundancy while preserving referential integrity.
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-rule">
            <h3 className="font-serif text-sm font-semibold text-blood">
              2. Donation Camp Aggregation
            </h3>
            <p className="text-muted">
              Aggregation is an abstraction where an entire relationship is treated as a higher-level composite object:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-muted">
              <li>
                The relationship between <code className="font-mono text-ink">DonationCamp</code> and <code className="font-mono text-ink">Donor</code> (resolved by <code className="font-mono text-ink">CampDonorRegistration</code>) constitutes a <strong>Donation Drive Aggregation</strong>.
              </li>
              <li>
                This aggregated drive object directly generates collection activities (<code className="font-mono text-ink">BloodDonation</code> where <code className="font-mono text-ink">donation_camp_id</code> is linked), which generate stored inventory bags (<code className="font-mono text-ink">BloodUnit</code>).
              </li>
            </ul>
          </div>

          <div className="space-y-3 pt-4 border-t border-rule">
            <h3 className="font-serif text-sm font-semibold text-blood">
              3. Integrity Constraints & Concurrency Control
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-muted">
              <li>
                <strong className="text-ink">CHECK (occupied_beds &le; total_beds):</strong> Prevents ward overcrowding. Managed via automated database triggers on patient admission and discharge.
              </li>
              <li>
                <strong className="text-ink">CHECK (expiry_date &ge; donation_date):</strong> Enforces temporal validity on perishable blood components.
              </li>
              <li>
                <strong className="text-ink">UNIQUE (unit_id) on BloodAllocation:</strong> Strictly ensures that an available blood unit is allocated at most once.
              </li>
              <li>
                <strong className="text-ink">Row-Level Locking (SELECT ... FOR UPDATE):</strong> In <code className="font-mono text-ink">sp_allocate_blood_unit</code>, concurrent allocations acquire exclusive row locks on the unit and request rows, eliminating double-allocation race conditions.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 3: Mermaid Source */}
      {activeTab === 'mermaid' && (
        <div className="border border-rule bg-paper p-4 font-mono text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-rule text-muted text-[11px]">
            <span>database/eer_diagram.mmd</span>
            <span className="text-moss">Mermaid Schema Source</span>
          </div>
          <pre className="mt-3 text-ink overflow-x-auto leading-relaxed text-[11px]">
{`erDiagram
    PERSON ||--o| DONOR : "specializes to (0..1)"
    PERSON ||--o| PATIENT : "specializes to (0..1)"
    PERSON ||--o| STAFF : "specializes to (0..1)"

    HOSPITAL ||--|{ WARD : "houses (1:N)"
    HOSPITAL ||--|{ STAFF : "employs (1:N)"
    HOSPITAL ||--|{ PATIENT : "admits (1:N)"
    HOSPITAL ||--|{ BLOOD_UNIT : "stores (1:N)"
    HOSPITAL ||--|{ BLOOD_REQUEST : "originates (1:N)"
    HOSPITAL ||--|{ DONATION_CAMP : "organizes (1:N)"

    DONATION_CAMP ||--|{ CAMP_DONOR_REGISTRATION : "aggregates (1:N)"
    DONOR ||--o{ CAMP_DONOR_REGISTRATION : "participates (1:N)"
    DONATION_CAMP ||--o{ BLOOD_DONATION : "yields (1:N)"

    DONOR ||--o{ BLOOD_DONATION : "donates (1:N)"
    BLOOD_DONATION ||--|{ BLOOD_UNIT : "generates (1:N components)"
    PATIENT ||--o{ BLOOD_REQUEST : "requests (1:N)"
    BLOOD_REQUEST ||--o{ BLOOD_ALLOCATION : "fulfilled by (1:N)"
    BLOOD_UNIT ||--o| BLOOD_ALLOCATION : "allocated in (0..1 / 1:1)"
    STAFF ||--o{ BLOOD_ALLOCATION : "authorizes (1:N)"

    DONOR ||--o{ ORGAN_DONATION : "pledges (1:N)"
    PATIENT ||--o{ ORGAN_REQUEST : "awaits (1:N)"
    ORGAN_DONATION ||--o{ ORGAN_MATCH : "candidate for (1:N)"
    ORGAN_REQUEST ||--o{ ORGAN_MATCH : "paired in (1:N)"
    STAFF ||--o{ ORGAN_MATCH : "verifies (1:N)"`}
          </pre>
        </div>
      )}
    </div>
  );
};

export default EERDiagramPage;
