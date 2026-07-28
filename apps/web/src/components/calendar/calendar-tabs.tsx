"use client";

import { useState } from "react";
import { CalendarView } from "./calendar-view";
import { MeetingsView } from "@/components/meetings/meetings-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users } from "lucide-react";

export function CalendarTabs() {
  const [tab, setTab] = useState("calendar");

  return (
    <div className="flex flex-col gap-4 p-6">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-fit">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendario
          </TabsTrigger>
          <TabsTrigger value="meetings" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Reuniones y Actas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <CalendarView />
        </TabsContent>

        <TabsContent value="meetings" className="mt-4">
          <MeetingsView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
