// src/components/right/CareTeamCard.tsx
"use client";

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Loader2, Plus, X } from 'lucide-react'; 
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Interface matching the stabilized Care Team API response
interface CareTeamMember {
    id: string;
    patientId: string;
    memberType: 'Doctor' | 'Specialist' | 'Nurse' | 'Therapist' | 'Coordinator' | string;
    name: string;
    contactPhone: string;
    contactEmail: string;
    affiliation: string; // Hospital/Practice name
    updatedAt: { seconds: number };
}

export default function CareTeamCard({ patientId }: { patientId: string }) {
    const [team, setTeam] = useState<CareTeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    
    // Form State
    const [name, setName] = useState('');
    const [memberType, setMemberType] = useState('Doctor');
    const [contactPhone, setContactPhone] = useState('');

    async function loadTeam() {
        try {
            const res = await fetch(`/api/care-team?patientId=${patientId}`);
            const json = await res.json();

            // FIX 1: Access data from the stabilized `{ success, data, error }` schema
            if (json.success && Array.isArray(json.data)) {
                setTeam(json.data as CareTeamMember[]);
            } else {
                console.error("API Error loading care team:", json.error);
                setTeam([]);
            }
        } catch (err) {
            console.error("Fetch failed:", err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadTeam(); }, [patientId]);

    function clearForm() {
        setName('');
        setMemberType('Doctor');
        setContactPhone('');
        setShowForm(false);
    }
    
    async function saveMember() {
        if (!name || !memberType) return;
        setSaving(true);
        
        // FIX 2: Construct payload with necessary fields
        const payload = { 
            patientId, 
            name, 
            memberType, 
            contactPhone,
            contactEmail: '', 
            affiliation: ''
        };

        try {
            const res = await fetch("/api/care-team", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            
            const json = await res.json();
            if (json.success) {
                clearForm();
                loadTeam(); // Refresh the list
            } else {
                console.error("Save failed:", json.error);
            }
        } finally { setSaving(false); }
    }

    return (
        <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-teal-700">
                    Patient Care Team
                </CardTitle>
                <Users className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                ) : (
                    <div className="space-y-3">
                        {/* List of Current Team Members */}
                        {team.length > 0 ? (
                            team.map((member) => (
                                <div key={member.id} className="border-b last:border-b-0 pb-2">
                                    <p className="font-semibold">{member.name}</p>
                                    <p className="text-xs text-gray-600 italic">{member.memberType}</p>
                                    <p className="text-xs text-gray-500">{member.contactPhone}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500">No team members listed.</p>
                        )}

                        <Button 
                            variant="outline" 
                            className="w-full mt-3" 
                            onClick={() => setShowForm(!showForm)}
                        >
                            {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />} 
                            {showForm ? 'Cancel' : 'Add Team Member'}
                        </Button>

                        {/* ADD MEMBER FORM */}
                        {showForm && (
                            <div className="p-3 border rounded-md space-y-2 bg-white mt-3">
                                <Input 
                                    placeholder="Member Name" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                />
                                <select 
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={memberType} 
                                    onChange={(e) => setMemberType(e.target.value)}
                                >
                                    <option value="Doctor">Doctor (PCP)</option>
                                    <option value="Specialist">Specialist</option>
                                    <option value="Nurse">Nurse</option>
                                    <option value="Therapist">Therapist</option>
                                </select>
                                <Input 
                                    placeholder="Phone Contact" 
                                    value={contactPhone} 
                                    onChange={(e) => setContactPhone(e.target.value)} 
                                />
                                <Button className="w-full" disabled={!name || saving} onClick={saveMember}>
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Save Member"}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}