import { SignIn } from '@clerk/nextjs';

export default function Page() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4'>
      <div className='w-full max-w-md space-y-8'>
        <div className='flex justify-center'>
          <SignIn
            appearance={{
              variables: {
                colorPrimary: 'var(--primary)',
                colorText: 'var(--foreground)',
                colorTextSecondary: 'var(--muted-foreground)',
                colorBackground: 'var(--card)',
                colorInputBackground: 'var(--input)',
                colorInputText: 'var(--foreground)',
                colorDanger: 'var(--destructive)',
                colorSuccess: 'var(--primary)',
                colorWarning: 'var(--accent)',
                colorNeutral: 'var(--muted)',
                colorShimmer: 'var(--muted)',
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-family, "uncut sans", sans-serif)',
              },
              elements: {
                rootBox: 'mx-auto w-full',
                card: 'shadow-lg border border-border bg-card',
                headerTitle: 'text-foreground',
                headerSubtitle: 'text-muted-foreground',
                socialButtonsBlockButton:
                  'border-border bg-background hover:bg-muted text-foreground transition-colors',
                formButtonPrimary:
                  'bg-primary text-primary-foreground hover:bg-primary/90 transition-colors',
                formButtonSecondary:
                  'bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors',
                formFieldInput:
                  'bg-input border-border text-foreground focus:ring-ring',
                formFieldLabel: 'text-foreground',
                footerActionLink:
                  'text-primary hover:text-primary/80 transition-colors',
                identityPreviewText: 'text-foreground',
                identityPreviewEditButton: 'text-primary hover:text-primary/80',
                formResendCodeLink: 'text-primary hover:text-primary/80',
                dividerLine: 'bg-border',
                dividerText: 'text-muted-foreground',
                alertText: 'text-foreground',
                formFieldSuccessText: 'text-muted-foreground',
                formFieldErrorText: 'text-destructive',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
