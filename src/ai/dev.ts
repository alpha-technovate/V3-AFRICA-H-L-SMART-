import { config } from 'dotenv';
config();

import '@/ai/flows/automatic-icd10-coding.ts';
import '@/ai/flows/ai-message-thread-summarization.ts';
import '@/ai/flows/smart-summaries.ts';
import '@/ai/flows/specialist-referral-letter.ts';
import '@/ai/flows/ai-audit-trail.ts';
import '@/ai/flows/per-patient-intelligent-context.ts';
import '@/ai/flows/new-patient-autofill-from-id-photo.ts';
import '@/ai/flows/consultation-auto-note-generator.ts';
import '@/ai/flows/ai-patient-progress-summary.ts';
import '@/ai/flows/medical-scan-ai-interpretation.ts';
import '@/ai/flows/report-generation.ts';
import '@/ai/flows/global-voice-ai-assistant.ts';
import '@/ai/flows/ai-document-enhancement.ts';
import '@/ai/flows/one-click-clinical-letter-generation.ts';