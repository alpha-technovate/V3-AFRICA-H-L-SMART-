'use client';

import type { ChronicCondition } from '@/lib/types';
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

const severityColorMap: Record<string, string> = {
  Mild: 'bg-blue-100 text-blue-800',
  Moderate: 'bg-yellow-100 text-yellow-800',
  Severe: 'bg-red-100 text-red-800',
};

interface ChronicConditionsCardProps {
  conditions: ChronicCondition[];
}

export function ChronicConditionsCard({ conditions }: ChronicConditionsCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="font-headline text-xl">
          Chronic Conditions
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Condition</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Added By</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {conditions.map((condition) => (
                <TableRow key={condition.id}>
                  <TableCell className="font-medium">{condition.name}</TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        'border-0 font-normal px-2 py-0.5',
                        severityColorMap[condition.severity]
                      )}
                    >
                      {condition.severity}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {condition.notes || '—'}
                  </TableCell>

                  <TableCell>{condition.addedBy}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
