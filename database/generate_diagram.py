"""
LIFE-LINK: EER Diagram Generator
Generates database/eer_diagram.png using Pillow with high-resolution visual layout.
"""

import os
from PIL import Image, ImageDraw, ImageFont

def generate_eer_diagram():
    width = 2400
    height = 1800
    bg_color = (248, 250, 252) # Slate-50
    image = Image.new("RGB", (width, height), bg_color)
    draw = ImageDraw.Draw(image)

    # Use default bitmap font or truetype
    try:
        title_font = ImageFont.truetype("arial.ttf", 34)
        subtitle_font = ImageFont.truetype("arial.ttf", 20)
        header_font = ImageFont.truetype("arialbd.ttf", 18)
        body_font = ImageFont.truetype("arial.ttf", 15)
        badge_font = ImageFont.truetype("arialbd.ttf", 13)
        legend_font = ImageFont.truetype("arial.ttf", 14)
    except Exception:
        title_font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()
        header_font = ImageFont.load_default()
        body_font = ImageFont.load_default()
        badge_font = ImageFont.load_default()
        legend_font = ImageFont.load_default()

    # Draw Header Banner
    draw.rectangle([(0, 0), (width, 100)], fill=(15, 23, 42)) # Slate-900
    draw.text((50, 20), "LIFE-LINK: Blood Bank & Organ Donor Network Management System", fill=(255, 255, 255), font=title_font)
    draw.text((50, 65), "Enhanced Entity-Relationship (EER) Conceptual Architecture  |  MySQL 8.0 Relational Model", fill=(148, 163, 184), font=subtitle_font)

    # Draw Aggregation Box (Donation Camp Drive Aggregate)
    agg_rect = [(920, 1080), (1680, 1680)]
    draw.rectangle(agg_rect, fill=(241, 245, 249), outline=(100, 116, 139), width=2)
    draw.text((940, 1095), "[AGGREGATION OBJECT: Donation Camp Drive & Participation]", fill=(71, 85, 105), font=header_font)

    # Entity definition helper
    def draw_entity(x, y, w, h, title, category, pk_list, attr_list, fk_list=None):
        header_colors = {
            "supertype": (79, 70, 229),   # Indigo
            "subtype": (14, 165, 233),     # Sky
            "infrastructure": (16, 185, 129), # Emerald
            "blood": (225, 29, 72),        # Rose
            "organ": (168, 85, 247),       # Purple
            "junction": (245, 158, 11),    # Amber
            "camp": (20, 184, 166),        # Teal
        }
        color = header_colors.get(category, (100, 116, 139))
        
        # Shadow & Box
        draw.rectangle([(x+4, y+4), (x+w+4, y+h+4)], fill=(226, 232, 240))
        draw.rectangle([(x, y), (x+w, y+h)], fill=(255, 255, 255), outline=(203, 213, 225), width=2)
        
        # Header
        draw.rectangle([(x, y), (x+w, y+40)], fill=color)
        draw.text((x+15, y+10), title, fill=(255, 255, 255), font=header_font)
        
        # Category Badge
        badge_text = category.upper()
        draw.rectangle([(x+w-105, y+8), (x+w-15, y+32)], fill=(255, 255, 255))
        draw.text((x+w-95, y+12), badge_text[:11], fill=color, font=badge_font)

        # Content
        cur_y = y + 50
        for pk in pk_list:
            draw.text((x+15, cur_y), f"[PK] {pk}", fill=(185, 28, 28), font=body_font)
            cur_y += 20
        
        if fk_list:
            for fk in fk_list:
                draw.text((x+15, cur_y), f"[FK] {fk}", fill=(3, 105, 161), font=body_font)
                cur_y += 20
                
        for attr in attr_list:
            draw.text((x+15, cur_y), f"  {attr}", fill=(51, 65, 85), font=body_font)
            cur_y += 19

    # 1. PERSON (Supertype)
    draw_entity(950, 130, 380, 240, "PERSON", "supertype", 
                ["person_id: INT"],
                ["first_name, last_name: VARCHAR",
                 "date_of_birth: DATE, gender: ENUM",
                 "phone, email: VARCHAR (UNIQUE)",
                 "address, city, state, pincode",
                 "blood_group: ENUM (ABO-Rh)",
                 "created_at: DATETIME"])

    # Specialization Circle
    draw.ellipse([(1115, 390), (1165, 440)], fill=(79, 70, 229), outline=(30, 27, 75), width=2)
    draw.text((1133, 400), "d,o", fill=(255, 255, 255), font=header_font)
    draw.line([(1140, 370), (1140, 390)], fill=(79, 70, 229), width=3) # from Person to circle
    draw.text((1180, 405), "(Overlapping Specialization)", fill=(79, 70, 229), font=legend_font)

    # 2. SUBTYPES: STAFF, PATIENT, DONOR
    # Staff
    draw.line([(1115, 415), (750, 470)], fill=(14, 165, 233), width=2)
    draw_entity(550, 470, 340, 200, "STAFF", "subtype",
                ["staff_id: INT"],
                ["job_title, department: VARCHAR",
                 "system_role: ENUM (ADMIN, DOC, etc.)",
                 "hire_date: DATE, is_active: BOOL"],
                ["person_id (FK->Person, UK)",
                 "hospital_id (FK->Hospital)",
                 "ward_id (FK->Ward), supervisor_staff_id"])

    # Patient
    draw.line([(1140, 440), (1140, 470)], fill=(14, 165, 233), width=2)
    draw_entity(970, 470, 340, 200, "PATIENT", "subtype",
                ["patient_id: INT"],
                ["admission_date, discharge_date: DATE",
                 "medical_status: ENUM (CRITICAL, etc.)",
                 "medical_notes: TEXT"],
                ["person_id (FK->Person, UK)",
                 "hospital_id (FK->Hospital)",
                 "ward_id (FK->Ward)",
                 "attending_doctor_id (FK->Staff)"])

    # Donor
    draw.line([(1165, 415), (1550, 470)], fill=(14, 165, 233), width=2)
    draw_entity(1390, 470, 340, 200, "DONOR", "subtype",
                ["donor_id: INT"],
                ["donor_type: ENUM (BLOOD, ORGAN, BOTH)",
                 "blood_group: ENUM (ABO-Rh)",
                 "registration_date, last_donation_date",
                 "availability_status: ENUM",
                 "deferral_reason: VARCHAR"],
                ["person_id (FK->Person, UK)"])

    # 3. HOSPITAL INFRASTRUCTURE
    # Hospital
    draw_entity(80, 200, 350, 220, "HOSPITAL", "infrastructure",
                ["hospital_id: INT"],
                ["hospital_name: VARCHAR",
                 "license_number: VARCHAR (UK)",
                 "address, city, state, pincode",
                 "contact_phone, contact_email (UK)",
                 "emergency_helpline: VARCHAR",
                 "established_year: INT"])

    # Ward
    draw_entity(80, 480, 350, 190, "WARD", "infrastructure",
                ["ward_id: INT"],
                ["ward_name: VARCHAR",
                 "ward_type: ENUM (ICU, SURGICAL, etc.)",
                 "floor_number: INT",
                 "total_beds: INT (CHECK > 0)",
                 "occupied_beds: INT (CHECK <= total)"],
                ["hospital_id (FK->Hospital)"])

    # 4. BLOOD BANK & INVENTORY
    # BloodDonation
    draw_entity(1400, 750, 350, 200, "BLOOD_DONATION", "blood",
                ["donation_id: INT"],
                ["donation_date: DATE",
                 "quantity_ml: INT (300-550)",
                 "hemoglobin_level: DECIMAL (>= 10.0)",
                 "screening_status: ENUM (PASSED, etc.)",
                 "remarks: VARCHAR"],
                ["donor_id (FK->Donor)",
                 "hospital_id (FK->Hospital)",
                 "donation_camp_id (FK->Camp)"])

    # BloodUnit
    draw_entity(1830, 750, 360, 220, "BLOOD_UNIT", "blood",
                ["unit_id: INT"],
                ["blood_group: ENUM (Indexed)",
                 "component_type: ENUM (RBC, PLT, etc.)",
                 "donation_date, expiry_date: DATE",
                 "storage_status: ENUM (AVAILABLE, etc.)",
                 "storage_location: VARCHAR"],
                ["donation_id (FK->BloodDonation)",
                 "donor_id (FK->Donor)",
                 "hospital_id (FK->Hospital)"])

    # BloodRequest
    draw_entity(970, 750, 340, 220, "BLOOD_REQUEST", "blood",
                ["request_id: INT"],
                ["blood_group: ENUM",
                 "component_type: ENUM",
                 "units_required: INT (CHECK > 0)",
                 "urgency_level: ENUM (Indexed)",
                 "request_date: DATETIME (Indexed)",
                 "request_status: ENUM"],
                ["patient_id (FK->Patient)",
                 "hospital_id (FK->Hospital)"])

    # BloodAllocation (Junction Table M:N)
    draw_entity(1400, 1020, 360, 180, "BLOOD_ALLOCATION", "junction",
                ["allocation_id: INT"],
                ["allocated_date: DATETIME",
                 "allocation_status: ENUM",
                 "notes: VARCHAR"],
                ["request_id (FK->BloodRequest)",
                 "unit_id (FK->BloodUnit, UNIQUE)",
                 "allocated_by_staff_id (FK->Staff)"])

    # BloodCompatibility Reference Table
    draw_entity(1830, 1050, 360, 150, "BLOOD_COMPATIBILITY", "blood",
                ["compatibility_id: INT"],
                ["donor_blood_group: ENUM",
                 "recipient_blood_group: ENUM",
                 "is_compatible: BOOLEAN",
                 "UNIQUE (donor_bg, recipient_bg)"])

    # 5. ORGAN DONATION NETWORK
    # OrganDonation
    draw_entity(1900, 220, 340, 180, "ORGAN_DONATION", "organ",
                ["organ_donation_id: INT"],
                ["organ_type: ENUM (KIDNEY, etc.)",
                 "donation_status: ENUM",
                 "registration_date: DATE",
                 "hla_type: VARCHAR",
                 "medical_clearance: BOOLEAN"],
                ["donor_id (FK->Donor)"])

    # OrganRequest
    draw_entity(1900, 450, 340, 200, "ORGAN_REQUEST", "organ",
                ["organ_request_id: INT"],
                ["organ_type: ENUM",
                 "recipient_blood_group: ENUM",
                 "urgency_level: ENUM",
                 "medical_urgency_score: INT (1-100)",
                 "request_status: ENUM"],
                ["patient_id (FK->Patient)",
                 "hospital_id (FK->Hospital)"])

    # OrganMatch
    draw_entity(1900, 1260, 360, 220, "ORGAN_MATCH", "organ",
                ["match_id: INT"],
                ["match_date: DATETIME",
                 "compatibility_status: ENUM",
                 "verification_status: ENUM (PENDING)",
                 "match_score: DECIMAL (0-100)",
                 "medical_notes: TEXT"],
                ["organ_donation_id (FK->OrganDonation)",
                 "organ_request_id (FK->OrganRequest)",
                 "verified_by_staff_id (FK->Staff)"])

    # 6. DONATION CAMP & CAMP PARTICIPATION (Inside Aggregation)
    draw_entity(950, 1140, 330, 210, "DONATION_CAMP", "camp",
                ["camp_id: INT"],
                ["camp_name, organizer: VARCHAR",
                 "location, city: VARCHAR",
                 "start_date, end_date: DATETIME",
                 "capacity: INT (CHECK > 0)",
                 "camp_status: ENUM"],
                ["hospital_id (FK->Hospital)"])

    draw_entity(1320, 1140, 330, 190, "CAMP_DONOR_REG", "junction",
                ["registration_id: INT"],
                ["registration_time: DATETIME",
                 "attended: BOOLEAN",
                 "units_donated: INT (>= 0)",
                 "UNIQUE (camp_id, donor_id)"],
                ["camp_id (FK->DonationCamp)",
                 "donor_id (FK->Donor)"])

    # Connecting Lines & Cardinalities
    def draw_rel(p1, p2, color, label=""):
        draw.line([p1, p2], fill=color, width=2)
        if label:
            mx = (p1[0] + p2[0]) // 2
            my = (p1[1] + p2[1]) // 2
            draw.text((mx+5, my-10), label, fill=color, font=legend_font)

    # Hospital -> Ward
    draw_rel((250, 420), (250, 480), (16, 185, 129), "1 : N")
    # Hospital -> Staff
    draw_rel((430, 310), (550, 500), (16, 185, 129), "1 : N")
    # Donor -> BloodDonation
    draw_rel((1560, 670), (1560, 750), (225, 29, 72), "1 : N")
    # BloodDonation -> BloodUnit
    draw_rel((1750, 830), (1830, 830), (225, 29, 72), "1 : N (Components)")
    # Patient -> BloodRequest
    draw_rel((1140, 670), (1140, 750), (225, 29, 72), "1 : N")
    # BloodRequest & BloodUnit -> BloodAllocation
    draw_rel((1140, 970), (1400, 1080), (245, 158, 11), "1 : N (Request)")
    draw_rel((1830, 930), (1760, 1080), (245, 158, 11), "0..1 : 1 (Unit UK)")
    # Donor -> OrganDonation
    draw_rel((1730, 520), (1900, 310), (168, 85, 247), "1 : N")
    # Patient -> OrganRequest
    draw_rel((1310, 520), (1900, 520), (168, 85, 247), "1 : N")
    # OrganDonation & Request -> OrganMatch
    draw_rel((2070, 400), (2070, 1260), (168, 85, 247), "Candidate Pair (M:N)")
    # DonationCamp -> CampDonorRegistration
    draw_rel((1280, 1230), (1320, 1230), (20, 184, 166), "1 : N")
    # Donor -> CampDonorRegistration
    draw_rel((1600, 670), (1500, 1140), (20, 184, 166), "1 : N")

    # Legend / Key Block
    draw.rectangle([(80, 720), (450, 1020)], fill=(255, 255, 255), outline=(203, 213, 225), width=2)
    draw.text((100, 735), "EER Notation & Conventions", fill=(15, 23, 42), font=header_font)
    draw.text((100, 770), "[PK] Primary Key", fill=(185, 28, 28), font=body_font)
    draw.text((100, 795), "[FK] Foreign Key (Referential Action)", fill=(3, 105, 161), font=body_font)
    draw.text((100, 820), "[UK] Unique Constraint", fill=(100, 116, 139), font=body_font)
    draw.text((100, 845), "d,o : Overlapping Specialization", fill=(79, 70, 229), font=body_font)
    draw.text((100, 870), "Shaded Box : Aggregation Object", fill=(100, 116, 139), font=body_font)
    draw.text((100, 895), "1 : N : One-to-Many Relationship", fill=(51, 65, 85), font=body_font)
    draw.text((100, 920), "M : N : Many-to-Many via Junction", fill=(245, 158, 11), font=body_font)
    draw.text((100, 945), "0..1 : 1 : Single active unit allocation", fill=(225, 29, 72), font=body_font)
    draw.text((100, 970), "Strict ACID Locking: SELECT ... FOR UPDATE", fill=(15, 23, 42), font=body_font)

    # Save to file
    out_dir = os.path.dirname(os.path.abspath(__file__))
    out_path = os.path.join(out_dir, "eer_diagram.png")
    image.save(out_path, "PNG", quality=95)
    print(f"EER Diagram generated successfully: {out_path}")

if __name__ == "__main__":
    generate_eer_diagram()

