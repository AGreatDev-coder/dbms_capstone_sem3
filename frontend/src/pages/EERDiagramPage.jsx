import React, { useState } from 'react';
import { Network, FileText, Code, CheckCircle2, ShieldCheck, Layers, GitMerge, Download, ExternalLink } from 'lucide-react';

const EERDiagramPage = () => {
  const [activeTab, setActiveTab] = useState('diagram');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Network className="w-7 h-7 text-indigo-600" />
            <span>Enhanced Entity-Relationship (EER) Architecture</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete conceptual data model, specialization hierarchies, aggregation modeling, and relational constraints.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="http://localhost:5000/database-artifacts/eer_diagram.png"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-900 text-white hover:bg-black transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Open Full-Res PNG</span>
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs">
        <button
          onClick={() => setActiveTab('diagram')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold border-b-2 transition-all ${
            activeTab === 'diagram'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>High-Resolution Visual Diagram (eer_diagram.png)</span>
        </button>

        <button
          onClick={() => setActiveTab('concepts')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold border-b-2 transition-all ${
            activeTab === 'concepts'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Schema Documentation & Justification</span>
        </button>

        <button
          onClick={() => setActiveTab('mermaid')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold border-b-2 transition-all ${
            activeTab === 'mermaid'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Mermaid Source (eer_diagram.mmd)</span>
        </button>
      </div>

      {/* TAB 1: VISUAL EER DIAGRAM */}
      {activeTab === 'diagram' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm overflow-hidden text-center">
            <img
              src="http://localhost:5000/database-artifacts/eer_diagram.png"
              alt="LIFE-LINK EER Diagram"
              className="w-full h-auto rounded-xl shadow-inner border border-slate-100 max-h-[850px] object-contain mx-auto"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/database-artifacts/eer_diagram.png';
              }}
            />
            <p className="text-[11px] text-slate-400 mt-3 font-mono">
              Rendered from database/eer_diagram.png | Resolution: 2400 x 1800 px (300 DPI layout)
            </p>
          </div>

          {/* Core EER Concepts Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
                <Layers className="w-4 h-4" />
                <span>Overlapping Specialization</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">Person Supertype & Subtypes</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                `Person` serves as the supertype entity. `Donor`, `Patient`, and `Staff` inherit through 1:0..1 foreign keys.
                A single person can simultaneously hold multiple roles without duplicating demographic data.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-teal-600 font-bold text-xs uppercase tracking-wider">
                <Network className="w-4 h-4" />
                <span>EER Aggregation Modeling</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">Donation Camp Drive Object</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                `DonationCamp` aggregated with registered participants (`CampDonorRegistration`) forms a higher-level organizational entity
                that directly yields batch collection activities (`BloodDonation`).
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider">
                <GitMerge className="w-4 h-4" />
                <span>M:N Junction & Row Locking</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">BloodAllocation Junction</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Resolves the M:N relationship between `BloodRequest` and `BloodUnit`.
                Enforces `UNIQUE(unit_id)` so a bag cannot be double-allocated, secured by ACID row locking.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCHEMA DOCUMENTATION & JUSTIFICATIONS */}
      {activeTab === 'concepts' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 text-xs leading-relaxed text-slate-700">
          <div>
            <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              Relational Schema Architecture & Design Justifications
            </h2>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-indigo-700">1. Person Specialization Hierarchy</h3>
            <p>
              In healthcare management, modeling human actors requires balancing strict normalization with clinical reality.
              LIFE-LINK implements <strong>Overlapping Specialization</strong> using subtype extension tables:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Person Supertype:</strong> Houses immutable demographics (name, DOB, gender, phone, email, address, confirmed ABO/Rh group).</li>
              <li><strong>Donor Subtype:</strong> References `Person(person_id)` with `UNIQUE` constraint; tracks donor type, availability status, deferral reasons.</li>
              <li><strong>Patient Subtype:</strong> References `Person(person_id)` with `UNIQUE` constraint; tracks admission date, assigned ward, and medical status.</li>
              <li><strong>Staff Subtype:</strong> References `Person(person_id)` with `UNIQUE` constraint; tracks hospital employment, department, and supervisory hierarchy.</li>
            </ul>
            <p className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600">
              <strong>Justification:</strong> Enforcing disjoint specialization would make it impossible for a hospital doctor to donate blood, or for a voluntary donor to be treated as an admitted patient, without creating duplicate person rows. Overlapping specialization via subtype tables eliminates redundancy while preserving referential integrity.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-teal-700">2. Donation Camp Aggregation</h3>
            <p>
              Aggregation is an abstraction where an entire relationship is treated as a higher-level composite object:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>The relationship between `DonationCamp` and `Donor` (resolved by `CampDonorRegistration`) constitutes a <strong>Donation Drive Aggregation</strong>.</li>
              <li>This aggregated drive object directly generates collection activities (`BloodDonation` where `donation_camp_id` is linked), which generate stored inventory bags (`BloodUnit`).</li>
            </ul>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-rose-700">3. Integrity Constraints & Concurrency Control</h3>
            <p>
              The relational schema strictly enforces integrity through database-level constraints:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>CHECK (occupied_beds &le; total_beds):</strong> Prevents ward overcrowding. Managed via automated database triggers on patient admission/discharge.</li>
              <li><strong>CHECK (expiry_date &ge; donation_date):</strong> Enforces temporal validity on perishable blood components.</li>
              <li><strong>UNIQUE (unit_id) on BloodAllocation:</strong> Strictly ensures that an available blood unit is allocated at most once.</li>
              <li><strong>Row-Level Locking (`SELECT ... FOR UPDATE`):</strong> In `sp_allocate_blood_unit`, concurrent allocations acquire exclusive row locks on the unit and request rows, eliminating double-allocation race conditions.</li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 3: MERMAID CODE VIEWER */}
      {activeTab === 'mermaid' && (
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono text-slate-400">
            <span>database/eer_diagram.mmd</span>
            <span className="text-emerald-400">Mermaid ER Diagram Source</span>
          </div>
          <pre className="mt-4 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
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

