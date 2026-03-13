import { z } from "zod";

export const consentPurposeSchema = z.enum([
    "dental_treatment",
    "patient_records",
    "cross_border_processing",
    "communication",
]);

export const consentRecordSchema = z.object({
    consentVersion: z.string().min(1),
    consentTextSnapshot: z.string().min(10),
    purposes: z.array(consentPurposeSchema).min(1),
});

export type ConsentPurpose = z.infer<typeof consentPurposeSchema>;
export type ConsentRecord = z.infer<typeof consentRecordSchema>;

export const DEFAULT_PIPA_CONSENT_TEXT = `CONSENT FOR COLLECTION, USE, AND DISCLOSURE OF PERSONAL INFORMATION

By submitting this form, I consent to the collection, use, and disclosure of my personal information, including personal health information, by this dental clinic for the following purposes:

1. **Dental Treatment**: To provide dental care and treatment, including diagnosis, treatment planning, and follow-up care.

2. **Patient Records**: To create and maintain patient records as required by the College of Dental Surgeons of British Columbia and applicable regulations.

3. **Cross-Border Data Processing**: I understand that my information may be processed using servers located outside of Canada (United States). My personal health information is encrypted before being transmitted and stored, meaning the service provider cannot access the content of my information.

**Your Rights Under PIPA (Personal Information Protection Act, BC)**:
- You have the right to access your personal information held by the clinic.
- You have the right to request correction of your personal information.
- You may withdraw your consent at any time by contacting the clinic, subject to legal or contractual restrictions.
- Withdrawal of consent may affect our ability to provide dental services.

**Retention**: Your information will be retained in accordance with the clinic's retention policy and applicable regulations.

**Contact**: For questions about our privacy practices or to exercise your rights, please contact the clinic's Privacy Officer.`;

export const DEFAULT_CONSENT_VERSION = "1.0";
