"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
    ChevronRight,
    LayoutDashboard,
    Users,
    Plus,
    Search,
    Loader2,
} from "lucide-react";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInput,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

import { useAction, usePreloadedQuery } from "convex/react";
import type { Preloaded } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    clientOnboardingFormSchema,
    DEFAULT_PORTAL_PRIMARY_COLOR,
    DEFAULT_PORTAL_SECONDARY_COLOR,
    type ClientOnboardingFormData,
} from "@/lib/validation/client-onboarding";
import { getErrorMessage } from "@/lib/errors/convex";
import { resolveTenantThemePalette } from "@/lib/tenant-theme";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    clients: Preloaded<typeof api.clients.list>;
}

const PORTAL_THEME_PRESETS = [
    { label: "Ocean", primary: "#0284c7", secondary: "#c9ddf1" },
    { label: "Forest", primary: "#15803d", secondary: "#d3e6d4" },
    { label: "Slate", primary: "#334155", secondary: "#d2dae4" },
] as const;

const createClientFormDefaults: ClientOnboardingFormData = {
    name: "",
    description: "",
    slug: "",
    adminEmail: "",
    adminPassword: "",
    portalPrimaryColor: DEFAULT_PORTAL_PRIMARY_COLOR,
    portalSecondaryColor: DEFAULT_PORTAL_SECONDARY_COLOR,
};

const navMain = [
    {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
    },
];

export function AppSidebar({ clients, ...props }: AppSidebarProps) {
    const pathname = usePathname();
    const selectedClientId = pathname.startsWith("/workspace/")
        ? pathname.split("/workspace/")[1]?.split("/")[0]
        : null;
    const clientList = usePreloadedQuery(clients);

    const [searchQuery, setSearchQuery] = useState("");
    const [mainOpen, setMainOpen] = useState(true);
    const [clientsOpen, setClientsOpen] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const provisionClient = useAction(api.clientProvisioning.provisionClient);
    const form = useForm<ClientOnboardingFormData>({
        resolver: zodResolver(clientOnboardingFormSchema),
        defaultValues: createClientFormDefaults,
        mode: "onBlur",
    });
    const [selectedPrimaryColor, selectedSecondaryColor] = useWatch({
        control: form.control,
        name: ["portalPrimaryColor", "portalSecondaryColor"],
    });

    const filteredClients = useMemo(() => {
        if (!searchQuery.trim()) return clientList;
        const query = searchQuery.toLowerCase();
        return clientList.filter(
            (client) =>
                client.name.toLowerCase().includes(query) ||
                client.description?.toLowerCase().includes(query),
        );
    }, [clientList, searchQuery]);

    async function onCreateClient(data: ClientOnboardingFormData) {
        setIsPending(true);
        try {
            const result = await provisionClient({
                name: data.name,
                description: data.description || undefined,
                slug: data.slug,
                adminEmail: data.adminEmail,
                adminPassword: data.adminPassword,
                portalPrimaryColor: data.portalPrimaryColor,
                portalSecondaryColor: data.portalSecondaryColor,
            });

            toast.success(`Client "${data.name}" provisioned`, {
                description: `Portal URL: ${result.portalUrl}`,
            });
            form.reset(createClientFormDefaults);
            setDialogOpen(false);
        } catch (error) {
            console.error("Create client error:", error);
            toast.error(getErrorMessage(error, "Failed to provision client"));
        }
        setIsPending(false);
    }

    function applyPortalThemePreset(
        preset: (typeof PORTAL_THEME_PRESETS)[number],
    ) {
        form.setValue("portalPrimaryColor", preset.primary, {
            shouldDirty: true,
            shouldValidate: true,
        });
        form.setValue("portalSecondaryColor", preset.secondary, {
            shouldDirty: true,
            shouldValidate: true,
        });
    }

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <div className="mx-2 my-2 rounded-xl border border-sidebar-border bg-sidebar-accent/50 px-3 py-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2">
                    <div className="flex items-center justify-center gap-2 group-data-[collapsible=icon]:gap-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground shadow-sm">
                            S
                        </div>
                        <div className="group-data-[collapsible=icon]:hidden">
                            <p className="text-sm font-semibold">Swiftware</p>
                            <p className="text-xs text-sidebar-foreground/70">
                                Admin console
                            </p>
                        </div>
                    </div>
                </div>
                <div className="px-2 group-data-[collapsible=icon]:hidden">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <SidebarInput
                            placeholder="Search clients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                {/* Main Navigation */}
                <Collapsible
                    open={mainOpen}
                    onOpenChange={setMainOpen}
                    className="group/collapsible"
                >
                    <SidebarGroup>
                        <SidebarGroupLabel asChild>
                            <CollapsibleTrigger className="flex w-full items-center justify-between cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors">
                                Main
                                <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </CollapsibleTrigger>
                        </SidebarGroupLabel>
                        <CollapsibleContent>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {navMain.map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={pathname === item.url}
                                                tooltip={item.title}
                                            >
                                                <Link href={item.url}>
                                                    <item.icon className="h-4 w-4" />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </CollapsibleContent>
                    </SidebarGroup>
                </Collapsible>

                {/* Clients Section */}
                <Collapsible
                    open={clientsOpen}
                    onOpenChange={setClientsOpen}
                    className="group/collapsible"
                >
                    <SidebarGroup>
                        <SidebarGroupLabel asChild>
                            <CollapsibleTrigger className="flex w-full items-center justify-between cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors">
                                <span className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Clients
                                    {clientList.length > 0 && (
                                        <span className="text-xs text-muted-foreground">
                                            ({clientList.length})
                                        </span>
                                    )}
                                </span>
                                <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </CollapsibleTrigger>
                        </SidebarGroupLabel>
                        <CollapsibleContent>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {filteredClients.length === 0 &&
                                    searchQuery ? (
                                        <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                                            No clients match &quot;{searchQuery}
                                            &quot;
                                        </div>
                                    ) : filteredClients.length === 0 ? (
                                        <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                                            No clients yet
                                        </div>
                                    ) : (
                                        filteredClients.map((client) => (
                                            <SidebarMenuItem key={client._id}>
                                                <SidebarMenuButton
                                                    asChild
                                                    isActive={
                                                        selectedClientId ===
                                                        client._id
                                                    }
                                                    tooltip={client.name}
                                                >
                                                    <Link
                                                        href={`/workspace/${client._id}`}
                                                    >
                                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                                                            {client.name
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </div>
                                                        <span className="truncate">
                                                            {client.name}
                                                        </span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        ))
                                    )}

                                    {/* Add Client Dialog */}
                                    <SidebarMenuItem>
                                        <Dialog
                                            open={dialogOpen}
                                            onOpenChange={(open) => {
                                                setDialogOpen(open);
                                                if (open) {
                                                    form.reset(
                                                        createClientFormDefaults,
                                                    );
                                                }
                                            }}
                                        >
                                            <DialogTrigger asChild>
                                                <SidebarMenuButton
                                                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                                                    tooltip="Add Client"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    <span>Add Client</span>
                                                </SidebarMenuButton>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>
                                                        Onboard Client Portal
                                                    </DialogTitle>
                                                    <DialogDescription>
                                                        Create the client, Clerk
                                                        organization, and portal
                                                        admin account in one
                                                        step.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <Form {...form}>
                                                    <form
                                                        onSubmit={form.handleSubmit(
                                                            onCreateClient,
                                                        )}
                                                        className="space-y-4"
                                                    >
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="name"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormLabel>
                                                                        Name
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder="e.g., Nike, Demo Brand"
                                                                            {...field}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="slug"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormLabel>
                                                                        Slug
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder="e.g., acme-dental"
                                                                            {...field}
                                                                            onChange={(
                                                                                event,
                                                                            ) =>
                                                                                field.onChange(
                                                                                    event.target.value.toLowerCase(),
                                                                                )
                                                                            }
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="adminEmail"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormLabel>
                                                                        Portal
                                                                        Admin
                                                                        Email
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            type="email"
                                                                            placeholder="admin@client.com"
                                                                            {...field}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="adminPassword"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormLabel>
                                                                        Portal
                                                                        Admin
                                                                        Password
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            type="password"
                                                                            autoComplete="new-password"
                                                                            placeholder="At least 8 chars with upper, lower, number"
                                                                            {...field}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                            <FormField
                                                                control={
                                                                    form.control
                                                                }
                                                                name="portalPrimaryColor"
                                                                render={({
                                                                    field,
                                                                }) => (
                                                                    <FormItem>
                                                                        <FormLabel>
                                                                            Primary
                                                                            Color
                                                                        </FormLabel>
                                                                        <FormControl>
                                                                            <Input
                                                                                type="color"
                                                                                {...field}
                                                                            />
                                                                        </FormControl>
                                                                        <FormDescription>
                                                                            Used
                                                                            for
                                                                            buttons,
                                                                            active
                                                                            states,
                                                                            focus
                                                                            rings,
                                                                            and
                                                                            key
                                                                            accents.
                                                                        </FormDescription>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />

                                                            <FormField
                                                                control={
                                                                    form.control
                                                                }
                                                                name="portalSecondaryColor"
                                                                render={({
                                                                    field,
                                                                }) => (
                                                                    <FormItem>
                                                                        <FormLabel>
                                                                            Secondary
                                                                            Color
                                                                        </FormLabel>
                                                                        <FormControl>
                                                                            <Input
                                                                                type="color"
                                                                                {...field}
                                                                            />
                                                                        </FormControl>
                                                                        <FormDescription>
                                                                            Used
                                                                            for
                                                                            portal
                                                                            subtle
                                                                            surfaces,
                                                                            the
                                                                            sidebar
                                                                            tint,
                                                                            and
                                                                            soft
                                                                            supporting
                                                                            accents.
                                                                        </FormDescription>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <p className="text-sm font-medium">
                                                                Theme Presets
                                                            </p>
                                                            <div className="grid gap-3 sm:grid-cols-3">
                                                                {PORTAL_THEME_PRESETS.map(
                                                                    (
                                                                        preset,
                                                                    ) => {
                                                                        const isSelected =
                                                                            selectedPrimaryColor.toLowerCase() ===
                                                                                preset.primary &&
                                                                            selectedSecondaryColor.toLowerCase() ===
                                                                                preset.secondary;
                                                                        const palette =
                                                                            resolveTenantThemePalette(
                                                                                {
                                                                                    primaryColor:
                                                                                        preset.primary,
                                                                                    secondaryColor:
                                                                                        preset.secondary,
                                                                                },
                                                                            );
                                                                        return (
                                                                            <button
                                                                                key={
                                                                                    preset.label
                                                                                }
                                                                                type="button"
                                                                                className={`rounded-2xl border p-3 text-left transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:shadow-sm ${
                                                                                    isSelected
                                                                                        ? "border-primary ring-2 ring-ring/30"
                                                                                        : "border-border/70"
                                                                                }`}
                                                                                onClick={() =>
                                                                                    applyPortalThemePreset(
                                                                                        preset,
                                                                                    )
                                                                                }
                                                                            >
                                                                                <div
                                                                                    className="overflow-hidden rounded-xl border"
                                                                                    style={{
                                                                                        backgroundColor:
                                                                                            palette.background,
                                                                                        borderColor:
                                                                                            palette.border,
                                                                                        color: palette.foreground,
                                                                                    }}
                                                                                >
                                                                                    <div
                                                                                        className="flex h-7 items-center px-2 text-[10px] font-semibold uppercase tracking-[0.18em]"
                                                                                        style={{
                                                                                            backgroundColor:
                                                                                                palette.sidebar,
                                                                                            borderBottom: `1px solid ${palette.sidebarBorder}`,
                                                                                        }}
                                                                                    >
                                                                                        Portal
                                                                                    </div>
                                                                                    <div className="space-y-2 p-2">
                                                                                        <div
                                                                                            className="h-2.5 w-2/3 rounded-full"
                                                                                            style={{
                                                                                                backgroundColor:
                                                                                                    palette.foreground,
                                                                                                opacity: 0.18,
                                                                                            }}
                                                                                        />
                                                                                        <div
                                                                                            className="rounded-md border p-2"
                                                                                            style={{
                                                                                                backgroundColor:
                                                                                                    palette.card,
                                                                                                borderColor:
                                                                                                    palette.border,
                                                                                            }}
                                                                                        >
                                                                                            <div
                                                                                                className="h-2 w-1/2 rounded-full"
                                                                                                style={{
                                                                                                    backgroundColor:
                                                                                                        palette.foreground,
                                                                                                    opacity: 0.14,
                                                                                                }}
                                                                                            />
                                                                                            <div
                                                                                                className="mt-2 h-7 rounded-md"
                                                                                                style={{
                                                                                                    backgroundColor:
                                                                                                        palette.primary,
                                                                                                }}
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="mt-3 flex items-center justify-between gap-3">
                                                                                    <span className="text-sm font-medium">
                                                                                        {
                                                                                            preset.label
                                                                                        }
                                                                                    </span>
                                                                                    <span className="inline-flex items-center gap-1.5">
                                                                                        <span
                                                                                            className="h-3 w-3 rounded-full border"
                                                                                            style={{
                                                                                                backgroundColor:
                                                                                                    preset.primary,
                                                                                            }}
                                                                                        />
                                                                                        <span
                                                                                            className="h-3 w-3 rounded-full border"
                                                                                            style={{
                                                                                                backgroundColor:
                                                                                                    preset.secondary,
                                                                                            }}
                                                                                        />
                                                                                    </span>
                                                                                </div>
                                                                            </button>
                                                                        );
                                                                    },
                                                                )}
                                                            </div>
                                                        </div>

                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="description"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormLabel>
                                                                        Description
                                                                        (optional)
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder="Brief description"
                                                                            {...field}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    setDialogOpen(
                                                                        false,
                                                                    )
                                                                }
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                type="submit"
                                                                disabled={
                                                                    isPending
                                                                }
                                                            >
                                                                {isPending ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                                ) : (
                                                                    <Plus className="h-4 w-4 mr-2" />
                                                                )}
                                                                Provision
                                                            </Button>
                                                        </div>
                                                    </form>
                                                </Form>
                                            </DialogContent>
                                        </Dialog>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </CollapsibleContent>
                    </SidebarGroup>
                </Collapsible>
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    );
}
