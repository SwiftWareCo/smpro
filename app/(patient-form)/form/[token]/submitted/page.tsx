import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function FormSubmittedPage() {
    return (
        <Card>
            <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <CardTitle className="text-2xl">
                    Form Submitted Successfully
                </CardTitle>
                <CardDescription className="text-base">
                    Thank you for completing your patient intake form.
                </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                    Your information has been securely encrypted and sent to the
                    clinic. The clinic staff will review your submission before
                    your appointment.
                </p>
                <p className="text-sm text-muted-foreground">
                    You may close this page. If you have questions, please
                    contact the clinic directly.
                </p>
            </CardContent>
        </Card>
    );
}
