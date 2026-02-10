import Link from 'next/link';
import { Book, Globe, Layout, Code, Layers, FileCode, Puzzle } from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/docs', icon: Book },
  { name: 'WordPress', href: '/docs/wordpress', icon: Puzzle },
  { name: 'Shopify', href: '/docs/shopify', icon: Globe },
  { name: 'Squarespace', href: '/docs/squarespace', icon: Layout },
  { name: 'Wix', href: '/docs/wix', icon: Layers },
  { name: 'Webflow', href: '/docs/webflow', icon: FileCode },
  { name: 'HTML/JavaScript', href: '/docs/html', icon: Code },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/docs" className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Book className="h-5 w-5 text-primary" />
            </div>
            <span className="font-display text-xl font-semibold">Kentroi Docs</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Login
            </Link>
            <Link
              href="/auth/register"
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4">
        <div className="flex">
          {/* Sidebar */}
          <aside className="hidden md:block w-64 shrink-0 py-8 pr-8 border-r border-border sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <nav className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors group"
                >
                  <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>

            <div className="mt-8 pt-8 border-t border-border">
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Resources
              </p>
              <nav className="mt-4 space-y-1">
                <Link
                  href="/dashboard/embed"
                  className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                >
                  <Code className="h-4 w-4 text-muted-foreground" />
                  Get Embed Code
                </Link>
                <a
                  href="mailto:support@kentroi.com"
                  className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                >
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  Contact Support
                </a>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 py-8 md:pl-8 min-w-0">
            <div className="max-w-3xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
