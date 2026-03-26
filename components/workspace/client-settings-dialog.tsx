"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Copy, Loader2, RefreshCw, Trash2, UserPlus } from "lucide-react";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
    DEFAULT_PORTAL_PRIMARY_COLOR,
    DEFAULT_PORTAL_SECONDARY_COLOR,
} from "@/lib/validation/client-onboarding";
import { getClientPortalUrl } from "@/lib/tenant-url";
import { getErrorMessage } from "@/lib/errors/convex";
import { resolveTenantThemePalette } from "@/lib/tenant-theme";

const clientStatusOptions = [
    "lead",
    "onboarding",
    "active",
    "paused",
    "churned",
] as const;

type ClientStatus = (typeof clientStatusOptions)[number];

const clientFormSchema = z.object({
    name: z
        .string()
        .min(1, "Client name is required")
        .max(191, "Name is too long"),
    description: z
        .string()
        .max(1000, "Description is too long")
        .optional()
        .nullable(),
    status: z.enum(clientStatusOptions),
    portalPrimaryColor: z
        .string()
        .regex(/^#(?:[0-9a-fA-F]{6})$/, "Enter a valid hex color"),
    portalSecondaryColor: z
        .string()
        .regex(/^#(?:[0-9a-fA-F]{6})$/, "Enter a valid hex color"),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

type Client = Doc<"clients">;

interface ClientSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    client: Client;
}

const PORTAL_THEME_PRESETS = [
    { label: "Ocean", primary: "#0284c7", secondary: "#c9ddf1" },
    { label: "Forest", primary: "#15803d", secondary: "#d3e6d4" },
    { label: "Slate", primary: "#334155", secondary: "#d2dae4" },
] as const;
const portalRoleOptions = [
    { value: "org:member", label: "Member" },
    { value: "org:admin", label: "Admin" },
] as const;

type PortalRole = (typeof portalRoleOptions)[number]["value"];
type PortalMember = {
    membershipId: string;
    userId: string;
    role: PortalRole;
    email: string | null;
    displayName: string | null;
};

export function ClientSettingsDialog({
    open,
    onOpenChange,
    client,
}: ClientSettingsDialogProps) {
    const router = useRouter();
    const [activeSettingsTab, setActiveSettingsTab] = useState("profile");
    const [organizationTab, setOrganizationTab] = useState("members");
    const [isPending, setIsPending] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [portalUserEmail, setPortalUserEmail] = useState("");
    const [portalUserRole, setPortalUserRole] =
        useState<PortalRole>("org:member");
    const [portalUserPassword, setPortalUserPassword] = useState("");
    const [isAddingPortalUser, setIsAddingPortalUser] = useState(false);
    const [portalMembers, setPortalMembers] = useState<PortalMember[]>([]);
    const [isLoadingPortalMembers, setIsLoadingPortalMembers] = useState(false);
    const updateClient = useMutation(api.clients.update);
    const deleteClient = useMutation(api.clients.remove);
    const addPortalUser = useAction(api.clientPortalUsers.addMember);
    const listPortalUsers = useAction(api.clientPortalUsers.listMembers);

    const portalUrl = useMemo(() => getClientPortalUrl(), []);
    const formDefaults = useMemo(
        () => ({
            name: client.name,
            description: client.description || "",
            status: client.status as ClientStatus,
            portalPrimaryColor:
                client.portalPrimaryColor ?? DEFAULT_PORTAL_PRIMARY_COLOR,
            portalSecondaryColor:
                client.portalSecondaryColor ?? DEFAULT_PORTAL_SECONDARY_COLOR,
        }),
        [client],
    );

    const form = useForm<ClientFormValues>({
        resolver: zodResolver(clientFormSchema),
        defaultValues: formDefaults,
    });
    const [selectedPrimaryColor, selectedSecondaryColor] = useWatch({
        control: form.control,
        name: ["portalPrimaryColor", "portalSecondaryColor"],
    });

    const loadPortalMembers = useCallback(
        async (options?: { silent?: boolean }) => {
            if (!client.clerkOrganizationId) {
                setPortalMembers([]);
                return;
            }

            setIsLoadingPortalMembers(true);
            try {
                const members = await listPortalUsers({ clientId: client._id });
                setPortalMembers(members);
            } catch (error) {
                if (!options?.silent) {
                    toast.error(
                        getErrorMessage(
                            error,
                            "Failed to load organization members",
                        ),
                    );
                }
            } finally {
                setIsLoadingPortalMembers(false);
            }
        },
        [client._id, client.clerkOrganizationId, listPortalUsers],
    );

    useEffect(() => {
        if (!open) return;
        if (activeSettingsTab !== "organization") return;
        void loadPortalMembers({ silent: true });
    }, [open, activeSettingsTab, loadPortalMembers]);

    const handleOpenChange = (isOpen: boolean) => {
        form.reset(formDefaults);
        setActiveSettingsTab("profile");
        setOrganizationTab("members");
        if (!isOpen) {
            setPortalUserEmail("");
            setPortalUserRole("org:member");
            setPortalUserPassword("");
            setPortalMembers([]);
        }
        onOpenChange(isOpen);
    };

    const onSubmit = async (data: ClientFormValues) => {
        setIsPending(true);

        try {
            await updateClient({
                clientId: client._id,
                name: data.name,
                description: data.description || null,
                status: data.status,
                portalPrimaryColor: data.portalPrimaryColor,
                portalSecondaryColor: data.portalSecondaryColor,
            });

            toast.success("Client updated successfully");
            onOpenChange(false);
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to update client"));
        } finally {
            setIsPending(false);
        }
    };

    const handleDelete = async () => {
        setIsPending(true);

        try {
            await deleteClient({ clientId: client._id });
            toast.success("Client deleted successfully");
            router.push("/");
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to delete client"));
        } finally {
            setIsPending(false);
            setShowDeleteAlert(false);
        }
    };

    const copyPortalUrl = async () => {
        try {
            await navigator.clipboard.writeText(portalUrl);
            toast.success("Portal URL copied");
        } catch {
            toast.error("Failed to copy portal URL");
        }
    };

    const handleAddPortalUser = async () => {
        if (!client.clerkOrganizationId) {
            toast.error("This client does not have a Clerk organization yet");
            return;
        }
        if (!portalUserEmail.trim()) {
            toast.error("Enter the user's email");
            return;
        }

        setIsAddingPortalUser(true);
        try {
            const result = await addPortalUser({
                clientId: client._id,
                email: portalUserEmail,
                role: portalUserRole,
                temporaryPassword: portalUserPassword || undefined,
            });

            if (result.alreadyMember) {
                toast.success(`${result.email} already has portal access`);
            } else if (result.createdUser) {
                toast.success(
                    `${result.email} was created and added to portal`,
                );
            } else {
                toast.success(`${result.email} added to portal`);
            }

            setPortalUserEmail("");
            setPortalUserPassword("");
            setPortalUserRole("org:member");
            setOrganizationTab("members");
            await loadPortalMembers({ silent: true });
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to add portal user"));
        } finally {
            setIsAddingPortalUser(false);
        }
    };

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
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="flex h-[88vh] !w-[min(96vw,1080px)] !max-w-[1080px] sm:!max-w-[1080px] flex-col gap-0 overflow-hidden p-0">
                    <DialogHeader className="border-b px-6 py-4">
                        <DialogTitle>Client Settings</DialogTitle>
                        <DialogDescription>
                            Manage client profile and portal configuration
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <div className="min-h-0 flex-1">
                                <Tabs
                                    value={activeSettingsTab}
                                    onValueChange={setActiveSettingsTab}
                                    orientation="vertical"
                                    className="h-full flex-row gap-0"
                                >
                                    <div className="w-56 shrink-0 border-r bg-muted/20 p-3">
                                        <TabsList className="w-full flex-col items-stretch rounded-lg border-0 bg-transparent p-0 shadow-none">
                                            <TabsTrigger
                                                value="profile"
                                                className="w-full justify-start"
                                            >
                                                Profile
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="theme"
                                                className="w-full justify-start"
                                            >
                                                Portal Theme
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="organization"
                                                className="w-full justify-start"
                                            >
                                                Organization & Users
                                            </TabsTrigger>
                                        </TabsList>
                                    </div>

                                    <div className="min-h-0 flex-1">
                                        <TabsContent
                                            value="profile"
                                            className="h-full overflow-y-auto px-6 py-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                                        >
                                            <div className="space-y-4">
                                                <FormField
                                                    control={form.control}
                                                    name="name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Client Name
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Enter client name"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="description"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Description
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Textarea
                                                                    placeholder="Add a description for this client..."
                                                                    rows={4}
                                                                    {...field}
                                                                    value={
                                                                        field.value ||
                                                                        ""
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="status"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Status
                                                            </FormLabel>
                                                            <Select
                                                                onValueChange={
                                                                    field.onChange
                                                                }
                                                                defaultValue={
                                                                    field.value
                                                                }
                                                                value={
                                                                    field.value
                                                                }
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger className="w-full">
                                                                        <SelectValue placeholder="Select a status" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {clientStatusOptions.map(
                                                                        (
                                                                            status,
                                                                        ) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    status
                                                                                }
                                                                                value={
                                                                                    status
                                                                                }
                                                                            >
                                                                                {status
                                                                                    .charAt(
                                                                                        0,
                                                                                    )
                                                                                    .toUpperCase() +
                                                                                    status.slice(
                                                                                        1,
                                                                                    )}
                                                                            </SelectItem>
                                                                        ),
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </TabsContent>

                                        <TabsContent
                                            value="theme"
                                            className="h-full overflow-y-auto px-6 py-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                                        >
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                    <FormField
                                                        control={form.control}
                                                        name="portalPrimaryColor"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    Portal
                                                                    Primary
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="color"
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormDescription>
                                                                    Used for
                                                                    buttons,
                                                                    active
                                                                    states,
                                                                    focus rings,
                                                                    and key
                                                                    accents.
                                                                </FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="portalSecondaryColor"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    Portal
                                                                    Secondary
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="color"
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormDescription>
                                                                    Used for
                                                                    subtle
                                                                    surfaces,
                                                                    sidebar
                                                                    tint, and
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
                                                            (preset) => {
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
                                            </div>
                                        </TabsContent>

                                        <TabsContent
                                            value="organization"
                                            className="h-full overflow-y-auto px-6 py-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                                        >
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                    <FormItem>
                                                        <FormLabel>
                                                            Portal Slug
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                value={
                                                                    client.slug
                                                                }
                                                                readOnly
                                                            />
                                                        </FormControl>
                                                    </FormItem>

                                                    <FormItem>
                                                        <FormLabel>
                                                            Clerk Organization
                                                            ID
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                value={
                                                                    client.clerkOrganizationId ??
                                                                    "Not provisioned"
                                                                }
                                                                readOnly
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                </div>

                                                <FormItem>
                                                    <FormLabel>
                                                        Portal Admin User ID
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            value={
                                                                client.portalAdminUserId ??
                                                                "Not provisioned"
                                                            }
                                                            readOnly
                                                        />
                                                    </FormControl>
                                                </FormItem>

                                                <FormItem>
                                                    <FormLabel>
                                                        Portal URL
                                                    </FormLabel>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            value={portalUrl}
                                                            readOnly
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={
                                                                copyPortalUrl
                                                            }
                                                        >
                                                            <Copy className="mr-2 h-4 w-4" />
                                                            Copy
                                                        </Button>
                                                    </div>
                                                </FormItem>

                                                <Tabs
                                                    value={organizationTab}
                                                    onValueChange={
                                                        setOrganizationTab
                                                    }
                                                    className="gap-3"
                                                >
                                                    <TabsList className="rounded-lg">
                                                        <TabsTrigger value="members">
                                                            Current Users
                                                        </TabsTrigger>
                                                        <TabsTrigger value="add-user">
                                                            Add User
                                                        </TabsTrigger>
                                                    </TabsList>

                                                    <TabsContent
                                                        value="members"
                                                        className="space-y-3"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-medium">
                                                                Organization
                                                                Members
                                                            </p>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    loadPortalMembers()
                                                                }
                                                                disabled={
                                                                    !client.clerkOrganizationId ||
                                                                    isLoadingPortalMembers
                                                                }
                                                            >
                                                                {isLoadingPortalMembers ? (
                                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <RefreshCw className="mr-2 h-4 w-4" />
                                                                )}
                                                                Refresh
                                                            </Button>
                                                        </div>

                                                        {!client.clerkOrganizationId ? (
                                                            <div className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                                                                Portal
                                                                organization not
                                                                provisioned for
                                                                this client yet.
                                                            </div>
                                                        ) : isLoadingPortalMembers &&
                                                          portalMembers.length ===
                                                              0 ? (
                                                            <div className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                                                                Loading
                                                                organization
                                                                members...
                                                            </div>
                                                        ) : portalMembers.length ===
                                                              0 &&
                                                          !isLoadingPortalMembers ? (
                                                            <div className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                                                                No organization
                                                                members found.
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {portalMembers.map(
                                                                    (
                                                                        member,
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                member.membershipId
                                                                            }
                                                                            className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-3 py-2"
                                                                        >
                                                                            <div className="min-w-0">
                                                                                <p className="truncate text-sm font-medium">
                                                                                    {member.displayName ??
                                                                                        member.email ??
                                                                                        member.userId}
                                                                                </p>
                                                                                <p className="truncate text-xs text-muted-foreground">
                                                                                    {member.email ??
                                                                                        member.userId}
                                                                                </p>
                                                                            </div>
                                                                            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                                                                                {member.role ===
                                                                                "org:admin"
                                                                                    ? "Admin"
                                                                                    : "Member"}
                                                                            </span>
                                                                        </div>
                                                                    ),
                                                                )}
                                                            </div>
                                                        )}
                                                    </TabsContent>

                                                    <TabsContent
                                                        value="add-user"
                                                        className="space-y-3"
                                                    >
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-medium">
                                                                Add Portal User
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Add a user to
                                                                this
                                                                organization. If
                                                                the user
                                                                doesn&apos;t
                                                                exist, set a
                                                                temporary
                                                                password to
                                                                create them.
                                                            </p>
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                            <Input
                                                                type="email"
                                                                value={
                                                                    portalUserEmail
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    setPortalUserEmail(
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                                }
                                                                placeholder="user@client.com"
                                                                disabled={
                                                                    !client.clerkOrganizationId ||
                                                                    isAddingPortalUser
                                                                }
                                                            />
                                                            <Select
                                                                value={
                                                                    portalUserRole
                                                                }
                                                                onValueChange={(
                                                                    value,
                                                                ) =>
                                                                    setPortalUserRole(
                                                                        value as PortalRole,
                                                                    )
                                                                }
                                                                disabled={
                                                                    !client.clerkOrganizationId ||
                                                                    isAddingPortalUser
                                                                }
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {portalRoleOptions.map(
                                                                        (
                                                                            role,
                                                                        ) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    role.value
                                                                                }
                                                                                value={
                                                                                    role.value
                                                                                }
                                                                            >
                                                                                {
                                                                                    role.label
                                                                                }
                                                                            </SelectItem>
                                                                        ),
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        <div className="flex flex-col gap-2 sm:flex-row">
                                                            <Input
                                                                type="password"
                                                                value={
                                                                    portalUserPassword
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    setPortalUserPassword(
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                                }
                                                                placeholder="Temporary password (for new users)"
                                                                disabled={
                                                                    !client.clerkOrganizationId ||
                                                                    isAddingPortalUser
                                                                }
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                className="sm:min-w-[140px]"
                                                                onClick={
                                                                    handleAddPortalUser
                                                                }
                                                                disabled={
                                                                    !client.clerkOrganizationId ||
                                                                    isAddingPortalUser
                                                                }
                                                            >
                                                                {isAddingPortalUser ? (
                                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <UserPlus className="mr-2 h-4 w-4" />
                                                                )}
                                                                Add User
                                                            </Button>
                                                        </div>
                                                    </TabsContent>
                                                </Tabs>
                                            </div>
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            </div>

                            <DialogFooter className="gap-2 border-t px-6 py-4">
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => setShowDeleteAlert(true)}
                                    className="mr-auto"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Client
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isPending}>
                                    {isPending ? "Saving..." : "Save Changes"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={showDeleteAlert}
                onOpenChange={setShowDeleteAlert}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete{" "}
                            <strong>{client.name}</strong> and all associated
                            data including connected accounts and content. This
                            action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isPending ? "Deleting..." : "Delete Client"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
