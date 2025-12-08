import type { Patient, Doctor, Consultation, Activity, NavItem } from '@/lib/types';
import {
  LayoutDashboard,
  Users,
  FileText,
  BrainCircuit,
  Settings,
  User,
} from 'lucide-react';

export const doctors: Doctor[] = [
  { id: 'doc1', name: 'Dr. Evelyn Reed', avatar: 'https://picsum.photos/seed/doc1/100/100', specialty: 'Cardiology' },
  { id: 'doc2', name: 'Dr. Kenji Tanaka', avatar: 'https://picsum.photos/seed/doc2/100/100', specialty: 'Neurology' },
  { id: 'doc3', name: 'Dr. Aisha Khan', avatar: 'https://picsum.photos/seed/doc3/100/100', specialty: 'Pediatrics' },
];

export const patients: Patient[] = [
  {
    id: 'pat1',
    name: 'Liam Johnson',
    avatar: 'https://picsum.photos/seed/pat1/100/100',
    email: 'liam.johnson@example.com',
    dob: '1985-04-12',
    gender: 'Male',
    acuity: 'Medium',
    lastVisit: '2024-06-28',
    status: 'Active',
    problems: [
      { id: 'p1', name: 'Essential Hypertension', status: 'Active', onsetDate: '2022-03-15', notes: 'Managed with Lisinopril.', icd10Code: 'I10', icd10Description: 'Essential (primary) hypertension', addedBy: 'Dr. Evelyn Reed' },
      { id: 'p2', name: 'Seasonal Allergies', status: 'Monitoring', onsetDate: '2010-05-01', notes: 'Uses OTC antihistamines as needed.', icd10Code: 'J30.9', icd10Description: 'Allergic rhinitis, unspecified', addedBy: 'Dr. Evelyn Reed' },
      { id: 'p3', name: 'Sprained Ankle', status: 'Resolved', onsetDate: '2023-11-20', notes: 'Left ankle, fully recovered.', icd10Code: 'S93.402A', icd10Description: 'Sprain of unspecified ligament of left ankle, initial encounter', addedBy: 'Dr. Kenji Tanaka'},
    ],
    medications: [
      { id: 'm1', name: 'Lisinopril', class: 'ACE Inhibitor', dose: '20mg', route: 'Oral', frequency: 'Once daily', startDate: '2022-03-20', status: 'Active', notes: 'For hypertension.' },
      { id: 'm2', name: 'Albuterol Inhaler', class: 'Bronchodilator', dose: '90mcg', route: 'Inhalation', frequency: 'As needed for shortness of breath', startDate: '2018-01-10', status: 'Active', notes: 'For asthma.' },
      { id: 'm3', name: 'Amoxicillin', class: 'Antibiotic', dose: '500mg', route: 'Oral', frequency: 'Twice daily', startDate: '2024-05-10', status: 'Stopped', notes: 'For sinus infection.' },
    ],
    chronicConditions: [
      { id: 'cc1', name: 'Hypertension', severity: 'Moderate', notes: 'Well-controlled with medication.', icd10Code: 'I10', icd10Description: 'Essential (primary) hypertension', addedBy: 'Dr. Evelyn Reed' },
      { id: 'cc2', name: 'Asthma', severity: 'Mild', notes: 'Exercise-induced, uses inhaler prophylactically.', icd10Code: 'J45.909', icd10Description: 'Unspecified asthma, uncomplicated', addedBy: 'Dr. Evelyn Reed' },
    ]
  },
  {
    id: 'pat2',
    name: 'Olivia Smith',
    avatar: 'https://picsum.photos/seed/pat2/100/100',
    email: 'olivia.smith@example.com',
    dob: '1992-08-25',
    gender: 'Female',
    acuity: 'High',
    lastVisit: '2024-07-05',
    status: 'Active',
    problems: [
       { id: 'p4', name: 'Type 2 Diabetes', status: 'Active', onsetDate: '2021-09-01', notes: 'Managed with Metformin and diet.', icd10Code: 'E11.9', icd10Description: 'Type 2 diabetes mellitus without complications', addedBy: 'Dr. Evelyn Reed' },
    ],
    medications: [
        { id: 'm4', name: 'Metformin', class: 'Antidiabetic', dose: '1000mg', route: 'Oral', frequency: 'Twice daily', startDate: '2021-09-05', status: 'Active', notes: 'For diabetes.' },
    ],
    chronicConditions: [
        { id: 'cc3', name: 'Type 2 Diabetes', severity: 'Moderate', notes: 'A1C is 7.2.', icd10Code: 'E11.9', icd10Description: 'Type 2 diabetes mellitus without complications', addedBy: 'Dr. Evelyn Reed' },
    ]
  },
  {
    id: 'pat3',
    name: 'Noah Williams',
    avatar: 'https://picsum.photos/seed/pat3/100/100',
    email: 'noah.williams@example.com',
    dob: '1978-11-02',
    gender: 'Male',
    acuity: 'Low',
    lastVisit: '2024-05-15',
    status: 'Inactive',
    problems: [],
    medications: [],
    chronicConditions: []
  },
  {
    id: 'pat4',
    name: 'Emma Brown',
    avatar: 'https://picsum.photos/seed/pat4/100/100',
    email: 'emma.brown@example.com',
    dob: '2001-02-20',
    gender: 'Female',
    acuity: 'Critical',
    lastVisit: '2024-07-10',
    status: 'Active',
    problems: [],
    medications: [],
    chronicConditions: []
  },
  {
    id: 'pat5',
    name: 'James Jones',
    avatar: 'https://picsum.photos/seed/pat5/100/100',
    email: 'james.jones@example.com',
    dob: '1995-07-19',
    gender: 'Male',
    acuity: 'Medium',
    lastVisit: '2024-06-22',
    status: 'Active',
    problems: [],
    medications: [],
    chronicConditions: []
  },
];

// Keep consultations + activities (they don’t break UI)
export const consultations: Consultation[] = [
  {
    id: 'con1',
    patient: { id: 'pat2', name: 'Olivia Smith', avatar: patients[1].avatar },
    doctor: { id: 'doc1', name: 'Dr. Evelyn Reed' },
    date: '2024-07-15',
    time: '10:00 AM',
    reason: 'Follow-up on hypertension',
    status: 'Upcoming',
  },
];

export const activities: Activity[] = [
  {
    id: 'act1',
    user: doctors[0],
    action: 'updated clinical notes for',
    target: 'Olivia Smith',
    timestamp: '2 hours ago',
    department: 'Cardiology',
    color: 'teal'
  },
];

// ⭐ CLEANED NAVIGATION — ONLY THE ITEMS YOU WANT
export const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },

  { href: '/patients', label: 'Patients', icon: Users },

  { href: '/documents', label: 'Documentation', icon: FileText },

  { href: '/specialists', label: 'Specialists', icon: BrainCircuit },

  { href: '/account', label: 'Account', icon: User },

  { href: '/settings', label: 'Settings', icon: Settings },
];

export const icd10Codes = [
  { value: "i10", label: "I10 - Essential (primary) hypertension" },
  { value: "j30.9", label: "J30.9 - Allergic rhinitis, unspecified" },
  { value: "s93.402a", label: "S93.402A - Sprain of unspecified ligament of left ankle" },
  { value: "e11.9", label: "E11.9 - Type 2 diabetes mellitus without complications" },
  { value: "j45.909", label: "J45.909 - Unspecified asthma, uncomplicated" },
  { value: "z00.00", label: "Z00.00 - Encounter for general adult medical examination" },
];
