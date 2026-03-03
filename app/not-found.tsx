export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center px-6">
            <div className="max-w-md text-center">
                <h1 className="text-2xl font-semibold">Page not found</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    The requested tenant or page does not exist.
                </p>
            </div>
        </div>
    );
}
