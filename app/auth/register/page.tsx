import { SignUp } from '@clerk/nextjs';

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-background via-accent/5 to-primary/5 p-4">
      {/* Decorative background elements */}
      <div className="gradient-mesh absolute inset-0 -z-10" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-bl from-accent/30 to-transparent rounded-full blur-3xl -translate-y-1/2 -translate-x-1/4" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tl from-primary/30 to-transparent rounded-full blur-3xl translate-y-1/2 translate-x-1/4" />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Branded header */}
        <div className="text-center mb-8 animate-fadeInUp">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-primary shadow-xl shadow-accent/30 mb-4">
            <span className="text-2xl font-display font-bold text-white">S</span>
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-tight mb-2">
            Get started free
          </h1>
          <p className="text-foreground-secondary text-lg">
            Create your SmartWidget account in seconds
          </p>
        </div>

        {/* Clerk SignUp with custom styling */}
        <div className="animate-fadeInUp" style={{ animationDelay: '100ms' }}>
          <SignUp
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-2xl shadow-accent/10 border border-border bg-surface/80 backdrop-blur-sm",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "border-border hover:border-accent/30 transition-all duration-200",
                formButtonPrimary: "bg-gradient-to-r from-accent to-primary hover:shadow-lg hover:shadow-accent/30 transition-all duration-300",
                formFieldInput: "border-border focus:border-accent transition-colors duration-200",
                footerActionLink: "text-accent hover:text-primary transition-colors duration-200",
                dividerLine: "bg-border",
                dividerText: "text-foreground-tertiary",
                identityPreviewText: "text-foreground",
                identityPreviewEditButton: "text-accent hover:text-primary",
              },
              layout: {
                socialButtonsPlacement: "bottom",
                socialButtonsVariant: "blockButton",
              }
            }}
            routing="hash"
            signInUrl="/auth/login"
            forceRedirectUrl="/dashboard"
          />
        </div>

        {/* Footer link */}
        <p className="text-center mt-6 text-sm text-foreground-secondary animate-fadeInUp" style={{ animationDelay: '200ms' }}>
          Already have an account?{' '}
          <a href="/auth/login" className="text-accent hover:text-primary font-medium transition-colors duration-200">
            Sign in
          </a>
        </p>

        {/* Trust indicators */}
        <div className="mt-8 pt-6 border-t border-border animate-fadeInUp" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-center gap-8 text-xs text-foreground-tertiary">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Secure & private</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
