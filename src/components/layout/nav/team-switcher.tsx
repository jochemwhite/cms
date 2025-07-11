"use client";

import * as React from "react";
import { ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useActiveTenant } from "@/hooks/use-active-tenant";

export function TeamSwitcher() {
  const { isMobile } = useSidebar();
  const { activeTenant, setActiveTenant, availableTenants, hasMultipleTenants, isInitialized } = useActiveTenant();

  // Don't render until initialized to prevent hydration mismatch
  if (!isInitialized) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              disabled={!hasMultipleTenants}
              size="lg"
              className={cn(
                "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground ",
                !hasMultipleTenants && "cursor-default hover:bg-transparent disabled:cursor-default disabled:hover:bg-transparent disabled:opacity-100"
              )}
            >
              <div className="flex items-center justify-center rounded-lg text-sidebar-primary-foreground">
                <Avatar>
                  <AvatarImage src={activeTenant?.logo_url} />
                  <AvatarFallback>{activeTenant?.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{activeTenant?.name}</span>
              </div>
              {hasMultipleTenants && <ChevronsUpDown className="ml-auto" />}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">Organizations</DropdownMenuLabel>
            {availableTenants.map((team, index) => (
              <DropdownMenuItem key={team.id} onClick={() => setActiveTenant(team)} className="gap-2 p-3">
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <Avatar className="mr-2">
                    <AvatarImage src={team.logo_url} />
                    <AvatarFallback>{team.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            {/* <DropdownMenuSeparator /> */}
            {/* <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Add team</div>
            </DropdownMenuItem> */}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
