'use client';

import type { Problem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const problemStatusColorMap = {
  Active: 'bg-red-100 text-red-800',
  Resolved: 'bg-green-100 text-green-800',
  Monitoring: 'bg-yellow-100 text-yellow-800',
};

type ProblemListCardProps = {
  problems: Problem[];
};

export function ProblemListCard({ problems }: ProblemListCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-xl">Problem List</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Problem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Onset Date</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {problems.map((problem) => (
              <TableRow key={problem.id}>
                <TableCell className="font-medium">{problem.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn('border-0 font-normal', problemStatusColorMap[problem.status])}>
                    {problem.status}
                  </Badge>
                </TableCell>
                <TableCell>{problem.onsetDate}</TableCell>
                <TableCell className="text-muted-foreground">{problem.notes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
