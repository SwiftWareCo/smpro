import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TenantDashboardPage() {
    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                    Your tenant portal is ready.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Portal Status</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        Active and scoped to your organization.
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Theme</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        Colors are loaded from tenant settings.
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Navigation
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        Floating sidebar is available on desktop and mobile.
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
