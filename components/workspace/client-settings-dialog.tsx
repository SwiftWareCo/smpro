"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Trash2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { z } from "zod";

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
    avatarUrl: z
        .string()
        .url("Please enter a valid URL")
        .optional()
        .nullable()
        .or(z.literal("")),
    status: z.enum(clientStatusOptions),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

type Client = Doc<"clients">;

interface ClientSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    client: Client;
}

export function ClientSettingsDialog({
    open,
    onOpenChange,
    client,
}: ClientSettingsDialogProps) {
    const [isPending, setIsPending] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const updateClient = useMutation(api.clients.update);
    const deleteClient = useMutation(api.clients.remove);

    const form = useForm<ClientFormValues>({
        resolver: zodResolver(clientFormSchema),
        defaultValues: {
            name: client.name,
            description: client.description || "",
            avatarUrl: client.avatarUrl || "",
            status: client.status as ClientStatus,
        },
    });

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            form.reset();
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
                avatarUrl: data.avatarUrl || null,
                status: data.status,
            });

            toast.success("Client updated successfully");
            onOpenChange(false);
        } catch {
            toast.error("An error occurred");
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
        } catch {
            toast.error("An error occurred");
        } finally {
            setIsPending(false);
            setShowDeleteAlert(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Client Settings</DialogTitle>
                        <DialogDescription>
                            Update client information or delete this client
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <div className="space-y-4 py-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Client Name</FormLabel>
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
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Add a description for this client..."
                                                    rows={3}
                                                    {...field}
                                                    value={field.value || ""}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="avatarUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Avatar URL</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="https://example.com/avatar.jpg"
                                                    {...field}
                                                    value={field.value || ""}
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
                                            <FormLabel>Status</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select a status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {clientStatusOptions.map(
                                                        (status) => (
                                                            <SelectItem
                                                                key={status}
                                                                value={status}
                                                            >
                                                                {status
                                                                    .charAt(0)
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

                            <DialogFooter className="gap-2">
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

            {/* Delete Confirmation Alert */}
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
