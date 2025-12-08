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
import type { Patient, MedicationSummary } from '@/lib/types';  // 👈 FIXED TYPE

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
};

type MedicationsTabProps = {
  patient: Patient;
};

export function MedicationsTab({ patient }: MedicationsTabProps) {

  // FIX: Use MedicationSummary[] instead of Medication[]
  const [medications, setMedications] =
    useState<MedicationSummary[]>(patient.medications);

  const [open, setOpen] = useState(false);

  // FIX: accept Omit<MedicationSummary, 'id'>
  const handleSaveMedication = (
    newMedication: Omit<MedicationSummary, 'id'>
  ) => {
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

          <AddMedicationDialog
            onSave={handleSaveMedication}
            onClose={() => setOpen(false)}
          />
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
                    <div className="text-xs text-muted-foreground">
                      {med.class}
                    </div>
                  </TableCell>

                  <TableCell>{med.dose}</TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        'border-0 font-normal',
                        routeColorMap[med.route]
                      )}
                    >
                      {med.route}
                    </Badge>
                  </TableCell>

                  <TableCell>{med.frequency}</TableCell>
                  <TableCell>{med.startDate}</TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        'border-0 font-normal',
                        medicationStatusColorMap[med.status]
                      )}
                    >
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

function AddMedicationDialog({
  onSave,
  onClose,
}: {
  onSave: (med: Omit<MedicationSummary, 'id'>) => void;
  onClose: () => void;
}) {
  const [formState, setFormState] = useState({
    name: '',
    class: 'ACE Inhibitor' as MedicationSummary['class'],
    dose: '',
    route: 'Oral' as MedicationSummary['route'],
    frequency: '',
    startDate: '',
    status: 'Active' as MedicationSummary['status'],
    notes: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormState(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormState(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = () => {
    if (!formState.name) return;

    onSave(formState);
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
        {/* Rest of your input fields remain the SAME */}
        {/* No type errors here */}
      </div>

      <DialogFooter className="sm:justify-between">
        <Button variant="ghost" disabled>
          AI Coming Soon
        </Button>
        <div>
          <Button variant="outline" onClick={onClose} className="mr-2">
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Medication</Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
