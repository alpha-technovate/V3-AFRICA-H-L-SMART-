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
import type { Patient, ProblemSummary } from '@/lib/types';  // 👈 FIXED
import { icd10Codes } from '@/lib/data';
import { Combobox } from '@/components/ui/combobox';

const problemStatusColorMap = {
  Active: 'bg-red-100 text-red-800',
  Resolved: 'bg-green-100 text-green-800',
  Monitoring: 'bg-yellow-100 text-yellow-800',
};

type ProblemsTabProps = {
  patient: Patient;
};

export function ProblemsTab({ patient }: ProblemsTabProps) {

  // FIXED: use ProblemSummary[] instead of Problem[]
  const [problems, setProblems] =
    useState<ProblemSummary[]>(patient.problems);

  const [open, setOpen] = useState(false);

  // FIXED: Omit<ProblemSummary, 'id'>
  const handleSaveProblem = (
    newProblem: Omit<ProblemSummary, 'id'>
  ) => {
    const problemToAdd = { ...newProblem, id: `p-${Date.now()}` };
    setProblems(prev => [...prev, problemToAdd]);
    setOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-headline">Problem List</CardTitle>
          <CardDescription>
            A list of all clinical problems for {patient.name}.
          </CardDescription>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Problem
            </Button>
          </DialogTrigger>

          <AddProblemDialog
            onSave={handleSaveProblem}
            onClose={() => setOpen(false)}
          />
        </Dialog>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Problem</TableHead>
              <TableHead>ICD-10 Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Onset Date</TableHead>
              <TableHead>Added By</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {problems.length > 0 ? (
              problems.map(problem => (
                <TableRow key={problem.id}>
                  <TableCell className="font-medium">
                    {problem.name}
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="text-sm">
                      {problem.icd10Code.toUpperCase()}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {problem.icd10Description}
                    </p>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        'border-0 font-normal',
                        problemStatusColorMap[problem.status]
                      )}
                    >
                      {problem.status}
                    </Badge>
                  </TableCell>

                  <TableCell>{problem.onsetDate}</TableCell>
                  <TableCell>{problem.addedBy}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No problems recorded.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function AddProblemDialog({
  onSave,
  onClose,
}: {
  onSave: (problem: Omit<ProblemSummary, 'id'>) => void;
  onClose: () => void;
}) {
  const [formState, setFormState] = useState({
    name: '',
    status: 'Active' as ProblemSummary['status'],
    onsetDate: '',
    notes: '',
    icd10Code: '',
    icd10Description: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormState(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormState(prev => ({ ...prev, [id]: value }));
  };

  const handleComboboxChange = (value: string) => {
    const selected = icd10Codes.find(c => c.value === value);
    setFormState(prev => ({
      ...prev,
      icd10Code: selected ? selected.label.split(' - ')[0] : '',
      icd10Description: selected ? selected.label.split(' - ')[1] : '',
      name: selected ? selected.label.split(' - ')[1] : '',
    }));
  };

  const handleSubmit = () => {
    if (!formState.name) return;

    onSave({
      ...formState,
      addedBy: 'Dr. Evelyn Reed',
    });
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add Problem</DialogTitle>
        <DialogDescription>
          Enter the details of the clinical problem.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        {/* Inputs unchanged */}
      </div>

      <DialogFooter className="sm:justify-between">
        <Button variant="ghost" disabled>
          AI Coming Soon
        </Button>

        <div>
          <Button variant="outline" onClick={onClose} className="mr-2">
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Problem</Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
