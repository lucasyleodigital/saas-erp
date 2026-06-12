"use client";

import { useState } from "react";
import {
  useMembers,
  useInviteMember,
  useUpdateMemberRole,
  useRemoveMember,
  useCancelInvitation,
  ROLE_LABELS,
  ROLE_COLORS,
} from "@/hooks/use-members";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  UserPlus,
  MoreHorizontal,
  Mail,
  Clock,
  Trash2,
  Shield,
  Crown,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";

const ASSIGNABLE_ROLES = [
  { value: "ADMIN",      label: "Administrador",  desc: "Acceso completo excepto transferir propiedad" },
  { value: "ACCOUNTANT", label: "Contable",        desc: "Acceso a contabilidad, facturas y presupuestos" },
  { value: "SALES",      label: "Ventas",          desc: "Acceso a CRM, leads y pipeline" },
  { value: "EMPLOYEE",   label: "Empleado",        desc: "Acceso básico de solo lectura" },
];

const ROLE_ICONS: Record<string, any> = {
  OWNER: Crown,
  ADMIN: Shield,
};

export function TeamSection({ currentRole }: { currentRole: string }) {
  const { data, isLoading } = useMembers();
  const inviteMember = useInviteMember();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const cancelInvitation = useCancelInvitation();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("EMPLOYEE");

  const isOwnerOrAdmin = ["OWNER", "ADMIN"].includes(currentRole);

  function handleInvite() {
    if (!email.trim()) return;
    inviteMember.mutate({ email: email.trim(), role }, {
      onSuccess: () => {
        setInviteOpen(false);
        setEmail("");
        setRole("EMPLOYEE");
      },
    });
  }

  const members = data?.members ?? [];
  const invitations = data?.invitations ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="font-semibold">Equipo</h3>
            <p className="text-sm text-muted-foreground">
              {members.length} miembro{members.length !== 1 ? "s" : ""}
              {invitations.length > 0 && ` · ${invitations.length} invitación${invitations.length !== 1 ? "es" : ""} pendiente${invitations.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        {isOwnerOrAdmin && (
          <Button size="sm" className="gap-2" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Invitar
          </Button>
        )}
      </div>

      {/* Members list */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-px">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {members.map((member, i) => {
                const RoleIcon = ROLE_ICONS[member.role];
                const canEdit = isOwnerOrAdmin && member.role !== "OWNER";
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                        {member.user.firstName[0]}{member.user.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {member.user.firstName} {member.user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${ROLE_COLORS[member.role]}`}>
                        {RoleIcon && <RoleIcon className="h-3 w-3" />}
                        {ROLE_LABELS[member.role]}
                      </span>
                      {canEdit && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <p className="text-xs text-muted-foreground px-2 py-1.5 font-medium">Cambiar rol</p>
                            {ASSIGNABLE_ROLES.filter(r => !(r.value === "ADMIN" && currentRole !== "OWNER")).map((r) => (
                              <DropdownMenuItem
                                key={r.value}
                                onClick={() => updateRole.mutate({ id: member.id, role: r.value })}
                                className={member.role === r.value ? "font-medium" : ""}
                              >
                                {r.label}
                                {member.role === r.value && <span className="ml-auto text-xs text-muted-foreground">actual</span>}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                if (confirm(`¿Eliminar a ${member.user.firstName} del equipo?`)) {
                                  removeMember.mutate(member.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar del equipo
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Invitaciones pendientes
          </h4>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {invitations.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{inv.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Expira {formatDate(inv.expiresAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[inv.role]}`}>
                        {ROLE_LABELS[inv.role]}
                      </span>
                      <Badge variant="outline" className="text-xs">Pendiente</Badge>
                      {isOwnerOrAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => cancelInvitation.mutate(inv.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Roles guide */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Guía de roles</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-2">
            {[
              { role: "OWNER",      desc: "Control total de la empresa, facturación y equipo" },
              { role: "ADMIN",      desc: "Acceso completo excepto transferir la propiedad" },
              { role: "ACCOUNTANT", desc: "Contabilidad, facturas, presupuestos y productos" },
              { role: "SALES",      desc: "CRM, leads, pipeline y clientes" },
              { role: "EMPLOYEE",   desc: "Acceso de solo visualización" },
            ].map(({ role, desc }) => (
              <div key={role} className="flex items-start gap-2 text-sm">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${ROLE_COLORS[role]}`}>
                  {ROLE_LABELS[role]}
                </span>
                <span className="text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invitar a un miembro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="nombre@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Rol</label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_ROLES.filter(r => !(r.value === "ADMIN" && currentRole !== "OWNER")).map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <div>
                        <p className="font-medium">{r.label}</p>
                        <p className="text-xs text-muted-foreground">{r.desc}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              Se enviará un email con un enlace de invitación. El enlace expira en 7 días.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleInvite}
              disabled={!email.trim() || inviteMember.isPending}
            >
              {inviteMember.isPending ? "Enviando..." : "Enviar invitación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
