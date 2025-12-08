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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Patient, ChronicCondition } from '@/lib/types';
import { icd10Codes } from '@/lib/data';
import { Combobox } from '@/components/ui/combobox';

const severityColorMap = {
  Mild: 'bg-green-100 text-green-800',
  Moderate: 'bg-yellow-100 text-yellow-800',
  Severe: 'bg-red-100 text-red-800',
};

type ConditionsTabProps = {
  patient: Patient;
};

export function ConditionsTab({ patient }: ConditionsTabProps) {
  const [conditions, setConditions] = useState<ChronicCondition[]>(patient.chronicConditions);
  const [open, setOpen] = useState(false);

  const handleSaveCondition = (newCondition: Omit<ChronicCondition, 'id'>) => {
    const conditionToAdd = { ...newCondition, id: `cc-${Date.now()}`};
    setConditions(prev => [...prev, conditionToAdd]);
    setOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-headline">Chronic Conditions</CardTitle>
          <CardDescription>
            A list of all chronic conditions for {patient.name}.
          </CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Condition
            </Button>
          </DialogTrigger>
          <AddConditionDialog onSave={handleSaveCondition} onClose={() => setOpen(false)}/>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Condition</TableHead>
              <TableHead>ICD-10 Code</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Added By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conditions.length > 0 ? (
                conditions.map(condition => (
                <TableRow key={condition.id}>
                    <TableCell className="font-medium">{condition.name}</TableCell>
                    <TableCell>
                        <Badge variant="outline" className="text-sm">{condition.icd10Code.toUpperCase()}</Badge>
                        <p className="text-xs text-muted-foreground">{condition.icd10Description}</p>
                    </TableCell>
                    <TableCell>
                    <Badge variant="outline" className={cn('border-0 font-normal', severityColorMap[condition.severity])}>
                        {condition.severity}
                    </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{condition.notes}</TableCell>
                    <TableCell>{condition.addedBy}</TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No chronic conditions recorded.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function AddConditionDialog({ onSave, onClose }: { onSave: (condition: Omit<ChronicCondition, 'id'>) => void; onClose: () => void; }) {
  const [formState, setFormState] = useState({
      name: '',
      severity: 'Mild' as 'Mild' | 'Moderate' | 'Severe',
      notes: '',
      icd10Code: '',
      icd10Description: '',
  });

  const handleComboboxChange = (value: string) => {
    const selected = icd10Codes.find(c => c.value === value);
    setFormState(prev => ({
        ...prev,
        icd10Code: selected ? selected.label.split(' - ')[0] : '',
        icd10Description: selected ? selected.label.split(' - ')[1] : '',
        name: selected ? selected.label.split(' - ')[1] : ''
    }));
  }

  const handleSubmit = () => {
    if (!formState.name) return;
    onSave({ ...formState, addedBy: 'Dr. Evelyn Reed' }); 
  };
  
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add Chronic Condition</DialogTitle>
        <DialogDescription>
          Fill in the details for the new chronic condition.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="condition-name" className="text-right">
            Condition
          </Label>
          <Input id="condition-name" value={formState.name} onChange={(e) => setFormState(p => ({...p, name: e.target.value}))} className="col-span-3" placeholder="e.g. Type 2 Diabetes"/>
        </div>
         <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="icd10Code" className="text-right">ICD-10</Label>
          <div className="col-span-3">
             <Combobox options={icd10Codes} onSelect={handleComboboxChange} placeholder="Search ICD-10..."/>
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="severity" className="text-right">
            Severity
          </Label>
          <Select onValueChange={(v: any) => setFormState(p => ({...p, severity: v}))} defaultValue={formState.severity}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Mild">Mild</SelectItem>
              <SelectItem value="Moderate">Moderate</SelectItem>
              <SelectItem value="Severe">Severe</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-start gap-4">
          <Label htmlFor="notes" className="text-right pt-2">
            Notes
          </Label>
          <Textarea id="notes" value={formState.notes} onChange={(e) => setFormState(p => ({...p, notes: e.target.value}))} className="col-span-3" placeholder="Additional notes..." />
        </div>
      </div>
      <DialogFooter className="sm:justify-between">
        <Button variant="ghost" disabled>AI Coming Soon</Button>
        <div>
            <Button variant="outline" onClick={onClose} className="mr-2">Cancel</Button>
            <Button onClick={handleSubmit}>Save Condition</Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
