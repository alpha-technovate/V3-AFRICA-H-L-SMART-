import { MoreHorizontal } from "lucide-react"
import Link from "next/link";

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { patients } from "@/lib/data"
import { cn } from "@/lib/utils";

// ✅ NEW: import the refer button
import ReferToSpecialistButton from "@/components/patients/ReferToSpecialistButton";

const acuityColorMap = {
  'Low': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  'Medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  'High': 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
  'Critical': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
}

export function PatientTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">All Patients</CardTitle>
        <CardDescription>
          A list of all patients in your clinic.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-[100px] sm:table-cell">
                <span className="sr-only">Avatar</span>
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Acuity</TableHead>
              <TableHead className="hidden md:table-cell">
                Last Visit
              </TableHead>
              <TableHead className="hidden md:table-cell">
                Status
              </TableHead>
              <TableHead className="text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map(patient => (
              <TableRow key={patient.id}>
                <TableCell className="hidden sm:table-cell">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={patient.avatar}
                      alt={`${patient.name} avatar`}
                      data-ai-hint="person face"
                    />
                    <AvatarFallback>
                      {patient.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>

                <TableCell className="font-medium">
                  <div>{patient.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {patient.email}
                  </div>
                </TableCell>

                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("border-0", acuityColorMap[patient.acuity])}
                  >
                    {patient.acuity}
                  </Badge>
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  {patient.lastVisit}
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  <Badge
                    variant={patient.status === 'Active' ? 'secondary' : 'outline'}
                  >
                    {patient.status}
                  </Badge>
                </TableCell>

                {/* ACTIONS CELL */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {/* ✅ NEW: Share / Refer button with dropdown of specialists */}
                    <ReferToSpecialistButton
                      patientId={patient.id}
                      patientName={patient.name}
                    />

                    {/* Existing actions menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/patients/${patient.id}`}>
                            View Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>New Consultation</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          Showing <strong>1-{patients.length}</strong> of{" "}
          <strong>{patients.length}</strong>{" "}
          patients
        </div>
      </CardFooter>
    </Card>
  )
}
