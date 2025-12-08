'use client';

import type { Medication } from '@/lib/types';
import {
  Card,
  CardContent,
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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const medicationStatusColorMap: Record<string, string> = {
  Active: 'bg-green-100 text-green-800',
  Stopped: 'bg-gray-100 text-gray-800',
};

interface MedicationsCardProps {
  medications: Medication[];
}

export function MedicationsCard({ medications }: MedicationsCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="font-headline text-xl">
          Current Medications
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
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
              {medications.map((med) => (
                <TableRow key={med.id}>
                  <TableCell className="font-medium">{med.name}</TableCell>
                  <TableCell>{med.dose}</TableCell>
                  <TableCell>{med.route}</TableCell>
                  <TableCell>{med.frequency}</TableCell>
                  <TableCell>{med.startDate}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        'border-0 font-normal px-2 py-0.5',
                        medicationStatusColorMap[med.status]
                      )}
                    >
                      {med.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
