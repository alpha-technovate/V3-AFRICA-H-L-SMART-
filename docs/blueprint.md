# **App Name**: SmartBridge Care Revitalized

## Core Features:

- Main Layout with Sidebar: Create a consistent navigation experience with a sidebar.
- Dashboard Page: Display key metrics and data visualizations.
- Patient Management: Manage and display a list of patients with search, filtering, and add functionality.
- AI Assistant (Core): Recreate the AI assistant page with a modern chat interface using ShadCN components.
- Homepage Redirect: Automatically redirect users to the /dashboard route upon landing.
- Consultations System: Implement a system for managing patient consultations, including listing, detail pages, and creation forms. Includes an AI Summary button that uses DrBotUK.
- Full Patient Profile System: Develop a comprehensive patient profile system with overview, clinical notes (including AI notes from DrBotUK), consultations, attachments, and embedded AI assistant.
- Documentation Page: Create a documentation page with a markdown or rich text editor and an 'AI Enhance Document' button using DrBotUK.
- AI Assistant Page (Complete): Implement a full chat interface using shadcn/ui, scrollable history, message bubbles, microphone button, voice dictation, and calls to askDrBotUK().
- Charts & Analytics: Add Recharts components to the dashboard for bar charts, line charts, patient metrics, and activity feed.
- Components Library: Generate all missing UI components, including SummaryCard, PatientCard, ConsultationCard, PatientTable, FileUploader, Chart components, PageWrapper, Header component, and Sidebar component.
- Firestore Integration: Integrate Firestore with collections for patients, consultations, notes, documents, and ai_logs.
- Utils: Implement utility functions, including src/utils/drbotService.ts (fetch DrBotUK), src/utils/voice.ts (voice dictation API), and src/utils/formatting.ts.
- API Routes: Create API routes for /api/drbot (calls Cloud Function), /api/patients, /api/consultations, and /api/notes.
- Global Voice AI Assistant: Implement a floating global microphone button that is available on every page.  When the doctor presses the mic, the AI listens, transcribes, and intelligently updates the appropriate fields across the app.  This AI assistant must work globally and contextually.  This is a system-wide voice-driven AI assistant tool.
- New Patient Auto-Fill: Add a feature on the New Patient form where the doctor can upload an ID photo.  The AI automatically extracts and fills patient information to drastically speed up patient onboarding tool.
- Consultation Auto-Note Generator: When the doctor records audio (or types text), the AI should automatically generate notes for the consultation tool.
- Per-Patient Intelligent Context: Inside /patients/[id], the AI must have access to that patient’s history so the AI can update the correct section automatically without the doctor specifying.
- Report Generation: AI must generate reports (Summary Report PDF, Motivational Letter, Referral Letter, Discharge Summary, Admission Note). Implement UI buttons for each.
- Full Care Team Management: Add a “Care Team” page to view clinicians (e.g., Dr Pillay, Dr Sanjay Maharaj, Dr Ayaanda). Enable assigning clinicians to a patient profile. AI must be aware of the logged-in doctor and use this context in summaries and notes.
- Smart Summaries: Add a “Smart Summaries” section that can generate AI summaries for all patients, grouped by condition or recent activity. Include buttons such as “Generate System Summary,” “Generate Condition Summary,” and “Generate Patient Summary.
- Specialists Directory: Add a “Specialists” page listing all specialists with contact info, specialties, and availability. Include an “AI Auto-Generate Referral Letter” button using the patient’s data.
- Internal Messaging System: Add a “Messages” page allowing doctors and staff to chat. AI can summarize message threads or highlight clinical decisions from the convo.
- Visit History + Patient Timeline: Recreate the “Visit History” tab from the original system with chronological entries. AI should be able to summarize trends or generate a “Patient Progress Summary.”
- Automatic ICD-10 Coding: AI must auto-generate ICD-10 codes from the doctor’s dictation or typed notes and attach them to diagnoses.
- Medical Scan & Document AI Interpretation: Allow uploading scans like chest X-rays, ECGs, PDFs, and images. AI must interpret these and generate findings.
- AI Audit Trail: Log EVERY AI action in a Firestore collection including: what the AI changed, previous value, new value, which doctor triggered it, timestamp. Show this under a “AI Activity Log” page.
- Referrals & Clinical Letters: Add 1-click AI generation for: Referral letters, Discharge summaries, Admission notes, Motivational letters, Summary reports. Use the patient’s structured data where applicable.

## Style Guidelines:

- Primary color: Deep teal (#008080) to provide a sense of calmness and reliability, appropriate for a healthcare setting.
- Background color: Light teal (#E0F8F7), creating a clean and soothing backdrop that reduces visual fatigue.
- Accent color: Vibrant yellow-orange (#FFB347) for CTAs and highlights, drawing user attention to important actions without being overwhelming.
- Body font: 'Alegreya', a serif, giving an elegant, intellectual, contemporary feel.
- Headline font: 'Belleza', a sans-serif, lending personality and aligning to modern design principles.
- Implement a sidebar navigation for easy access to key areas like Dashboard, Patients, and AI Assistant.
- Use ShadCN components for the AI assistant's chat interface to ensure a clean, modern, and functional design.
- UI MUST MATCH THE PREVIOUS SMARTBRIDGE STYLE. Recreate the same look and feel shown in the screenshots: teal sidebar, category tabs, acuity badges, patient cards, AI Assistant modal design, colors, spacing, report buttons, clean clinical layout, everything consistent with the old SmartBridge UI