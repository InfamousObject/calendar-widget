import { SignIn } from '@clerk/nextjs';

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-background via-primary/5 to-accent/5 p-4">
      {/* Decorative background elements */}
      <div className="gradient-mesh absolute inset-0 -z-10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/30 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-accent/30 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Branded header */}
        <div className="text-center mb-8 animate-fadeInUp">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-xl shadow-primary/30 mb-4">
            <span className="text-2xl font-display font-bold text-white">S</span>
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-tight mb-2">
            Welcome back
          </h1>
          <p className="text-foreground-secondary text-lg">
            Sign in to your SmartWidget account
          </p>
        </div>

        {/* Clerk SignIn with custom styling */}
        <div className="animate-fadeInUp" style={{ animationDelay: '100ms' }}>
          <SignIn
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-2xl shadow-primary/10 border border-border bg-surface/80 backdrop-blur-sm",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "border-border hover:border-primary/30 transition-all duration-200",
                formButtonPrimary: "bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30 transition-all duration-300",
                formFieldInput: "border-border focus:border-primary transition-colors duration-200",
                footerActionLink: "text-primary hover:text-accent transition-colors duration-200",
                dividerLine: "bg-border",
                dividerText: "text-foreground-tertiary",
                identityPreviewText: "text-foreground",
                identityPreviewEditButton: "text-primary hover:text-accent",
              },
              layout: {
                socialButtonsPlacement: "bottom",
                socialButtonsVariant: "blockButton",
              }
            }}
            routing="hash"
            signUpUrl="/auth/register"
            forceRedirectUrl="/dashboard"
          />
        </div>

        {/* Footer link */}
        <p className="text-center mt-6 text-sm text-foreground-secondary animate-fadeInUp" style={{ animationDelay: '200ms' }}>
          Don't have an account?{' '}
          <a href="/auth/register" className="text-primary hover:text-accent font-medium transition-colors duration-200">
            Sign up for free
          </a>
        </p>
      </div>
    </div>
  );
}
