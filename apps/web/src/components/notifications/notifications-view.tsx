"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  useNotifications, useMarkRead, useMarkAllRead, useClearRead,
} from "@/hooks/use-notifications";
import { Bell, BellOff, CheckCheck, Trash2, FileText, Users, AlertCircle, Info } from "lucide-react";
import { motion } from "framer-motion";

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${days}d`;
}

function NotifIcon({ title }: { title: string }) {
  const t = title.toLowerCase();
  if (t.includes("factura") || t.includes("pago")) return <FileText className="h-4 w-4 text-blue-500" />;
  if (t.includes("cliente") || t.includes("lead")) return <Users className="h-4 w-4 text-purple-500" />;
  if (t.includes("venc") || t.includes("alerta") || t.includes("bajo")) return <AlertCircle className="h-4 w-4 text-amber-500" />;
  return <Info className="h-4 w-4 text-muted-foreground" />;
}

export function NotificationsView() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const { data, isLoading } = useNotifications({ unreadOnly: filter === "unread" });
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const clearRead = useClearRead();

  const notifications = data?.data ?? [];
  const unread = data?.unread ?? 0;

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Notificaciones
            {unread > 0 && (
              <Badge variant="destructive" className="text-xs px-2 py-0.5">{unread}</Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.total ?? 0} notificaciones en total
          </p>
        </div>
        <div className="flex gap-2">
          {unread > 0 && (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => markAllRead.mutate()}>
              <CheckCheck className="h-4 w-4" />
              Marcar todas
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-muted-foreground"
            onClick={() => clearRead.mutate()}
          >
            <Trash2 className="h-4 w-4" />
            Limpiar leídas
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg w-fit">
        {[
          { key: "all", label: "Todas" },
          { key: "unread", label: `Sin leer ${unread > 0 ? `(${unread})` : ""}` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              filter === tab.key
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-4 border-b border-border last:border-0">
                  <div className="h-9 w-9 bg-muted rounded-full animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BellOff className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">Sin notificaciones</p>
              <p className="text-sm text-muted-foreground mt-1">
                {filter === "unread" ? "Todo leído 🎉" : "No tienes notificaciones todavía"}
              </p>
            </div>
          ) : (
            <div>
              {notifications.map((notif: any, i: number) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => !notif.isRead && markRead.mutate(notif.id)}
                  className={cn(
                    "flex gap-3 p-4 border-b border-border last:border-0 transition-colors cursor-pointer",
                    !notif.isRead ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/30"
                  )}
                >
                  <div className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center shrink-0",
                    !notif.isRead ? "bg-primary/10" : "bg-muted"
                  )}>
                    <NotifIcon title={notif.title} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        "text-sm leading-tight",
                        !notif.isRead ? "font-semibold" : "font-medium"
                      )}>
                        {notif.title}
                      </p>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {timeAgo(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.body}</p>
                  </div>
                  {!notif.isRead && (
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
