// src/components/treatment/TreatmentNotesSection.tsx
"use client";

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Trash2, Pencil, ScrollText } from 'lucide-react'; 

// Interface matching the stabilized Treatment Notes API response
interface TreatmentNote {
    id: string;
    patientId: string;
    providerId: string;
    treatmentType: string; // e.g., 'Physiotherapy', 'Procedure'
    sessionDate: { seconds: number };
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    isSigned: boolean;
    [key: string]: any;
}

// Initial state for the form, using standardized fields
const initialNoteState = {
    treatmentType: 'Procedure',
    sessionDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    providerId: 'DOC_CURRENT_USER',
};

export default function TreatmentNotesSection({ patientId }: { patientId: string }) {
    const [list, setList] = useState<TreatmentNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    // Form State (using standardized field names)
    const [formState, setFormState] = useState(initialNoteState);
    
    // Helper to format timestamps
    const formatDate = (timestamp: { seconds: number }) => {
        return new Date(timestamp.seconds * 1000).toLocaleString();
    };

    // ----------------------------
    // LOAD NOTES
    // ----------------------------
    async function load() {
        try {
            const res = await fetch(`/api/treatment-notes?patientId=${patientId}`);
            const json = await res.json();
            
            // FIX 1: Access data from the stabilized `{ success, data, error }` schema
            if (json.success && Array.isArray(json.data)) {
                // Sort by session date (newest first)
                const sortedList = (json.data as TreatmentNote[]).sort((a, b) => 
                    b.sessionDate.seconds - a.sessionDate.seconds
                );
                setList(sortedList);
            } else {
                console.error("API Error loading treatment notes:", json.error);
            }
        } catch (err) {
            console.error("Failed to fetch treatment notes:", err);
        }
        setLoading(false);
    }

    useEffect(() => { load(); }, [patientId]);

    // ----------------------------
    // CRUD HANDLERS
    // ----------------------------
    function clearForm() {
        setFormState(initialNoteState);
        setEditingId(null);
    }

    function edit(note: TreatmentNote) {
        setEditingId(note.id);
        // Map data from the record to the form state
        setFormState({
            treatmentType: note.treatmentType,
            sessionDate: new Date(note.sessionDate.seconds * 1000).toISOString().split('T')[0],
            subjective: note.subjective,
            objective: note.objective,
            assessment: note.assessment,
            plan: note.plan,
            providerId: note.providerId,
        });
    }
    
    async function save() {
        setSaving(true);
        
        // FIX 2: Construct payload with mandatory fields
        const payload = { 
            patientId, 
            ...formState,
            // Ensure providerId is set
            providerId: formState.providerId || 'DOC_CURRENT_USER', 
        };

        try {
            const url = "/api/treatment-notes";
            const method = editingId ? "PATCH" : "POST";

            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                // If editing, include the ID in the body
                body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload), 
            });

            const json = await res.json();
            if (!json.success) {
                console.error("Save failed:", json.error);
                alert(`Save Failed: ${json.error}`);
                return;
            }

            clearForm();
            load(); // Refresh the list
        } finally { setSaving(false); }
    }

    async function remove(id: string) {
        if (!confirm("Are you sure you want to delete this treatment note?")) return;
        
        try {
            await fetch("/api/treatment-notes", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            // Optimistic update: filter out the deleted item
            setList(list.filter((c) => c.id !== id));
        } catch (err) {
            console.error("Delete failed:", err);
        }
    }


    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-teal-700">Treatment & Progress Notes (SOAP)</h2>

            {/* NEW NOTE / EDIT FORM CARD */}
            <Card className="p-6 space-y-4 shadow-md">
                <h3 className="text-xl font-semibold border-b pb-2">
                    {editingId ? `Edit Note ${editingId.substring(0, 5)}...` : 'Create New Progress Note'}
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                    {/* TYPE SELECT */}
                    <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        value={formState.treatmentType} 
                        onChange={(e) => setFormState(p => ({ ...p, treatmentType: e.target.value}))}
                    >
                        <option value="Procedure">Procedure Note</option>
                        <option value="Physiotherapy">Physiotherapy Session</option>
                        <option value="Psychotherapy">Psychotherapy Session</option>
                        <option value="General">General Progress Note</option>
                    </select>

                    {/* SESSION DATE */}
                    <Input 
                        type="date" 
                        value={formState.sessionDate} 
                        onChange={(e) => setFormState(p => ({ ...p, sessionDate: e.target.value}))}
                        required
                    />
                </div>
                
                {/* SOAP STRUCTURE */}
                <Textarea 
                    placeholder="S: Subjective (Patient's reported status/complaints)" 
                    value={formState.subjective} 
                    onChange={(e) => setFormState(p => ({ ...p, subjective: e.target.value}))}
                    rows={3}
                />
                <Textarea 
                    placeholder="O: Objective (Vitals, physical exam, lab results, etc.)" 
                    value={formState.objective} 
                    onChange={(e) => setFormState(p => ({ ...p, objective: e.target.value}))}
                    rows={3}
                />
                <Textarea 
                    placeholder="A: Assessment (Diagnosis, problem list, changes since last session)" 
                    value={formState.assessment} 
                    onChange={(e) => setFormState(p => ({ ...p, assessment: e.target.value}))}
                    rows={3}
                />
                <Textarea 
                    placeholder="P: Plan (Treatment goals, medication changes, next steps)" 
                    value={formState.plan} 
                    onChange={(e) => setFormState(p => ({ ...p, plan: e.target.value}))}
                    rows={3}
                />
                

                <div className="flex justify-end gap-3 pt-2">
                    {editingId && <Button variant="outline" onClick={clearForm}>Cancel Edit</Button>}
                    <Button 
                        disabled={!formState.subjective || saving} 
                        onClick={save}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : editingId ? "Update Note" : <><Plus className="w-4 h-4 mr-2" /> Sign & Save Note</>}
                    </Button>
                </div>
            </Card>


            {/* NOTES HISTORY LIST */}
            <Card className="p-6 shadow-md">
                <h3 className="text-xl font-semibold mb-4 border-b pb-2">History of Notes</h3>
                
                {loading ? (
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-500" />
                ) : list.length === 0 ? (
                    <p className="text-gray-500">No treatment notes found.</p>
                ) : (
                    <div className="space-y-4">
                        {list.map((note) => (
                            <Card key={note.id} className="p-4 bg-gray-50 border">
                                <div className="flex justify-between items-start">
                                    {/* Left Content */}
                                    <div className="flex-1 space-y-1">
                                        <p className="font-semibold text-lg">{note.treatmentType} Note</p>
                                        <p className="text-xs text-gray-500">Session Date: {formatDate(note.sessionDate)}</p>
                                        <p className="text-xs text-gray-500">Provider: {note.providerId}</p>
                                        
                                        <div className="mt-3 text-sm space-y-2">
                                            <p><span className="font-bold">S:</span> {note.subjective.substring(0, 80)}...</p>
                                            <p><span className="font-bold">O:</span> {note.objective.substring(0, 80)}...</p>
                                            <p><span className="font-bold">A:</span> {note.assessment.substring(0, 80)}...</p>
                                            <p><span className="font-bold">P:</span> {note.plan.substring(0, 80)}...</p>
                                        </div>
                                    </div>

                                    {/* Right Content: Actions */}
                                    <div className="flex gap-2">
                                        <Button size="icon" variant="outline" onClick={() => edit(note)}>
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="destructive" onClick={() => remove(note.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}