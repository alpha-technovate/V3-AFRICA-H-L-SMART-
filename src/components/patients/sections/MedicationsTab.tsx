'use client';

import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { Patient, Medication } from '@/lib/types';

const medicationStatusColorMap = {
  Active: 'bg-green-100 text-green-800',
  Stopped: 'bg-red-100 text-red-800',
};

const routeColorMap = {
  Oral: 'bg-blue-100 text-blue-800',
  IV: 'bg-purple-100 text-purple-800',
  IM: 'bg-indigo-100 text-indigo-800',
  Topical: 'bg-pink-100 text-pink-800',
  Inhalation: 'bg-teal-100 text-teal-800',
}

type MedicationsTabProps = {
  patient: Patient;
};

export function MedicationsTab({ patient }: MedicationsTabProps) {
  const [medications, setMedications] = useState<Medication[]>(patient.medications);
  const [open, setOpen] = useState(false);

  const handleSaveMedication = (newMedication: Omit<Medication, 'id'>) => {
    const medToAdd = { ...newMedication, id: `med-${Date.now()}` };
    setMedications(prev => [...prev, medToAdd]);
    setOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-headline">Medications</CardTitle>
          <CardDescription>
            A list of all medications for {patient.name}.
          </CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Medication
            </Button>
          </DialogTrigger>
          <AddMedicationDialog onSave={handleSaveMedication} onClose={() => setOpen(false)} />
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Medication</TableHead>
              <TableHead>Dose</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {medications.length > 0 ? (
                medications.map(med => (
                <TableRow key={med.id}>
                    <TableCell className="font-medium">
                        <div>{med.name}</div>
                        <div className="text-xs text-muted-foreground">{med.class}</div>
                    </TableCell>
                    <TableCell>{med.dose}</TableCell>
                    <TableCell>
                        <Badge variant="outline" className={cn('border-0 font-normal', routeColorMap[med.route])}>{med.route}</Badge>
                    </TableCell>
                    <TableCell>{med.frequency}</TableCell>
                    <TableCell>{med.startDate}</TableCell>
                    <TableCell>
                    <Badge variant="outline" className={cn('border-0 font-normal', medicationStatusColorMap[med.status])}>
                        {med.status}
                    </Badge>
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        No medications recorded.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function AddMedicationDialog({ onSave, onClose }: { onSave: (med: Omit<Medication, 'id'>) => void; onClose: () => void; }) {
  const [formState, setFormState] = useState({
    name: '',
    class: 'ACE Inhibitor' as Medication['class'],
    dose: '',
    route: 'Oral' as Medication['route'],
    frequency: '',
    startDate: '',
    status: 'Active' as Medication['status'],
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormState(prev => ({ ...prev, [id]: value }));
  }

  const handleSubmit = () => {
    if (!formState.name) return;
    onSave(formState as Omit<Medication, 'id'>);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add Medication</DialogTitle>
        <DialogDescription>
          Enter medication details manually.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">Medication</Label>
          <Input id="name" value={formState.name} onChange={handleChange} className="col-span-3" placeholder="e.g. Lisinopril" />
        </div>
         <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="class" className="text-right">Class</Label>
          <Select onValueChange={(v) => handleSelectChange('class', v)} defaultValue={formState.class}>
            <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ACE Inhibitor">ACE Inhibitor</SelectItem>
              <SelectItem value="Antibiotic">Antibiotic</SelectItem>
              <SelectItem value="Antidiabetic">Antidiabetic</SelectItem>
              <SelectItem value="Bronchodilator">Bronchodilator</SelectItem>
              <SelectItem value="NSAID">NSAID</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="dose" className="text-right">Dose</Label>
          <Input id="dose" value={formState.dose} onChange={handleChange} className="col-span-3" placeholder="e.g. 20mg" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="route" className="text-right">Route</Label>
          <Select onValueChange={(v) => handleSelectChange('route', v)} defaultValue={formState.route}>
            <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Oral">Oral</SelectItem>
              <SelectItem value="IV">IV</SelectItem>
              <SelectItem value="IM">IM</SelectItem>
              <SelectItem value="Topical">Topical</SelectItem>
              <SelectItem value="Inhalation">Inhalation</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="frequency" className="text-right">Frequency</Label>
          <Input id="frequency" value={formState.frequency} onChange={handleChange} className="col-span-3" placeholder="e.g. Once daily" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="startDate" className="text-right">Start Date</Label>
          <Input id="startDate" type="date" value={formState.startDate} onChange={handleChange} className="col-span-3" />
        </div>
         <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="status" className="text-right">Status</Label>
          <Select onValueChange={(v) => handleSelectChange('status', v)} defaultValue={formState.status}>
            <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Stopped">Stopped</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-start gap-4">
          <Label htmlFor="notes" className="text-right pt-2">Notes</Label>
          <Textarea id="notes" value={formState.notes} onChange={handleChange} className="col-span-3" />
        </div>
      </div>
      <DialogFooter className="sm:justify-between">
        <Button variant="ghost" disabled>AI Coming Soon</Button>
        <div>
            <Button variant="outline" onClick={onClose} className="mr-2">Cancel</Button>
            <Button onClick={handleSubmit}>Save Medication</Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
