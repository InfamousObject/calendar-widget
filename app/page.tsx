'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  FileText,
  MessageSquare,
  ArrowRight,
  Check,
  Clock,
  Users,
  Zap,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Shield,
  Palette,
  Smartphone,
  BarChart3,
  Globe,
  CreditCard,
  Gift
} from 'lucide-react';

// Intersection Observer hook for scroll animations
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

// Demo Contact Form Widget
function DemoContactForm() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', message: '' });
    }, 3000);
  };

  return (
    <div className="bg-surface rounded-2xl border border-border p-6 shadow-xl max-w-sm w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold">Contact Us</h3>
          <p className="text-xs text-foreground-tertiary">We&apos;ll get back to you soon</p>
        </div>
      </div>

      {submitted ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-success" />
          </div>
          <p className="font-semibold text-success">Message sent!</p>
          <p className="text-sm text-foreground-tertiary">Thanks for reaching out</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Your name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              required
            />
          </div>
          <div>
            <input
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              required
            />
          </div>
          <div>
            <textarea
              placeholder="How can we help?"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
              required
            />
          </div>
          <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-lg transition-all">
            Send Message
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      )}
    </div>
  );
}

// Demo Booking Widget
function DemoBookingWidget() {
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i + 1);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      full: date
    };
  });

  const times = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'];

  const handleBook = () => {
    setStep(3);
    setTimeout(() => {
      setStep(1);
      setSelectedDate(null);
      setSelectedTime(null);
    }, 3000);
  };

  return (
    <div className="bg-surface rounded-2xl border border-border p-6 shadow-xl max-w-sm w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold">Book a Meeting</h3>
          <p className="text-xs text-foreground-tertiary">30 min consultation</p>
        </div>
      </div>

      {step === 3 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-success" />
          </div>
          <p className="font-semibold text-success">Booking confirmed!</p>
          <p className="text-sm text-foreground-tertiary">Check your email for details</p>
        </div>
      ) : step === 1 ? (
        <div className="space-y-4">
          <p className="text-sm font-medium text-foreground-secondary">Select a date</p>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => (
              <button
                key={i}
                onClick={() => { setSelectedDate(i); setStep(2); }}
                className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                  selectedDate === i
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <span className="text-[10px] uppercase opacity-70">{d.day}</span>
                <span className="text-sm font-semibold">{d.date}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => setStep(1)}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to dates
          </button>
          <p className="text-sm font-medium text-foreground-secondary">Select a time</p>
          <div className="grid grid-cols-2 gap-2">
            {times.map((time) => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`px-3 py-2 rounded-lg text-sm transition-all ${
                  selectedTime === time
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border hover:border-primary'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
          {selectedTime && (
            <Button onClick={handleBook} className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-lg transition-all mt-4">
              Confirm Booking
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Demo Chat Widget
function DemoChatWidget() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your AI assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const responses: Record<string, string> = {
    'pricing': "Our contact form builder is completely FREE forever! Scheduling and AI chat have affordable plans starting at $9/month.",
    'book': "I can help you book an appointment! Just let me know what time works best for you, or try our booking widget.",
    'features': "Kentroi offers three main features: Contact Forms (free forever), Appointment Scheduling, and AI Chat Assistant.",
    'default': "That's a great question! I'd be happy to help. You can also book a call with our team for a personalized demo."
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const lowerInput = userMessage.toLowerCase();
      let response = responses.default;
      if (lowerInput.includes('price') || lowerInput.includes('cost') || lowerInput.includes('free')) {
        response = responses.pricing;
      } else if (lowerInput.includes('book') || lowerInput.includes('schedule') || lowerInput.includes('appointment')) {
        response = responses.book;
      } else if (lowerInput.includes('feature') || lowerInput.includes('what') || lowerInput.includes('do')) {
        response = responses.features;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-xl max-w-sm w-full flex flex-col h-[400px]">
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold">Kentroi Assistant</h3>
          <p className="text-xs text-foreground-tertiary flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Online
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[85%] p-3 rounded-2xl text-sm ${
              msg.role === 'assistant'
                ? 'bg-muted rounded-tl-sm'
                : 'bg-primary text-primary-foreground rounded-tr-sm ml-auto'
            }`}
          >
            {msg.content}
          </div>
        ))}
        {isTyping && (
          <div className="bg-muted rounded-2xl rounded-tl-sm p-3 max-w-[85%]">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-foreground-tertiary animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-foreground-tertiary animate-bounce" style={{ animationDelay: '0.1s' }} />
              <span className="w-2 h-2 rounded-full bg-foreground-tertiary animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything..."
            className="flex-1 px-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <Button onClick={handleSend} size="sm" className="px-4">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const heroSection = useInView(0.1);
  const problemSection = useInView(0.2);
  const solutionSection = useInView(0.2);
  const featuresSection = useInView(0.1);
  const freeSection = useInView(0.2);
  const ctaSection = useInView(0.2);

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Animated gradient orb following mouse */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-40 dark:opacity-20"
        style={{
          background: `
            radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px,
              hsl(var(--primary) / 0.15),
              transparent 40%)
          `
        }}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <img src="/kentroi-logomark.png" alt="Kentroi" className="h-9 w-9 transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <img src="/kentroi-wordmark.png" alt="Kentroi" className="h-7" />
          </Link>
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-foreground-secondary hover:text-foreground transition-colors font-medium">
              Features
            </Link>
            <Link href="/pricing" className="text-foreground-secondary hover:text-foreground transition-colors font-medium">
              Pricing
            </Link>
            <Link href="/docs" className="text-foreground-secondary hover:text-foreground transition-colors font-medium">
              Docs
            </Link>
            <Link href="/alternatives" className="text-foreground-secondary hover:text-foreground transition-colors font-medium">
              Alternatives
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="font-medium">Sign in</Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 font-medium group">
                Start Free
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section
          ref={heroSection.ref}
          className="relative pt-32 pb-20 md:pt-44 md:pb-32"
        >
          {/* Background elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="container mx-auto px-6">
            <div className={`max-w-5xl mx-auto text-center transition-all duration-1000 ${heroSection.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 mb-8">
                <Gift className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-success">Contact forms free forever</span>
              </div>

              {/* Main headline */}
              <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] mb-8">
                <span className="block">Stop losing leads to</span>
                <span className="block mt-2 pb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[size:200%] animate-[gradient_3s_ease-in-out_infinite]">
                  scheduling chaos
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-xl md:text-2xl text-foreground-secondary max-w-3xl mx-auto mb-12 leading-relaxed font-light">
                One embeddable widget for appointment booking, contact forms, and AI chat.
                Set up in minutes. No code required.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <Link href="/auth/register">
                  <Button size="lg" className="h-14 px-8 text-lg bg-gradient-to-r from-primary to-accent hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 group">
                    Start Free — No Credit Card
                    <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="#demo">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-2 hover:bg-foreground/5 group">
                    <Sparkles className="mr-2 h-5 w-5 text-primary" />
                    See It In Action
                  </Button>
                </Link>
              </div>

              {/* Trust signals */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-foreground-secondary text-sm">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>Free forever plan</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>5-minute setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>No coding required</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Demo Section */}
        <section
          id="demo"
          className="py-24 md:py-32 bg-gradient-to-b from-muted/30 to-background relative overflow-hidden"
        >
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/5 rounded-full blur-[150px]" />
          </div>

          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                Live Demo
              </span>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Try it yourself
              </h2>
              <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
                These are real, working widgets. Go ahead — interact with them.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="flex flex-col items-center">
                <div className="mb-4 text-center">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-medium mb-2">
                    <Gift className="h-3 w-3" />
                    Free Forever
                  </span>
                  <h3 className="font-semibold text-lg">Contact Form</h3>
                </div>
                <DemoContactForm />
              </div>
              <div className="flex flex-col items-center">
                <div className="mb-4 text-center">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-2">
                    <Calendar className="h-3 w-3" />
                    Booking Widget
                  </span>
                  <h3 className="font-semibold text-lg">Appointment Scheduling</h3>
                </div>
                <DemoBookingWidget />
              </div>
              <div className="flex flex-col items-center">
                <div className="mb-4 text-center">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium mb-2">
                    <Sparkles className="h-3 w-3" />
                    AI Powered
                  </span>
                  <h3 className="font-semibold text-lg">Chat Assistant</h3>
                </div>
                <DemoChatWidget />
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section
          ref={problemSection.ref}
          className="py-24 md:py-32 relative"
        >
          <div className="container mx-auto px-6">
            <div className={`transition-all duration-700 ${problemSection.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="text-center mb-16">
                <span className="inline-block px-4 py-1.5 rounded-full bg-destructive/10 text-destructive text-sm font-medium mb-6">
                  The Problem
                </span>
                <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                  Sound familiar?
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {[
                  {
                    icon: Clock,
                    stat: '23%',
                    title: 'of leads never respond',
                    description: 'After the initial back-and-forth email scheduling dance, prospects go cold and move on to competitors.'
                  },
                  {
                    icon: Users,
                    stat: '67%',
                    title: 'expect instant booking',
                    description: 'Modern customers expect Amazon-level convenience. Make them wait, and they\'ll find someone who won\'t.'
                  },
                  {
                    icon: Zap,
                    stat: '4+ hrs',
                    title: 'wasted weekly',
                    description: 'That\'s 200+ hours per year spent on scheduling tasks that should take seconds, not endless emails.'
                  }
                ].map((item, index) => (
                  <div
                    key={index}
                    className={`group relative p-8 rounded-2xl bg-surface border border-border hover:border-destructive/30 transition-all duration-500 ${
                      problemSection.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
                    style={{ transitionDelay: `${index * 150}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-destructive/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <item.icon className="w-6 h-6 text-destructive" />
                      </div>
                      <div className="text-4xl font-display font-bold text-destructive mb-2">{item.stat}</div>
                      <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                      <p className="text-foreground-secondary leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section
          ref={solutionSection.ref}
          className="py-24 md:py-32 bg-gradient-to-b from-muted/30 to-background relative overflow-hidden"
        >
          <div className="container mx-auto px-6">
            <div className={`text-center mb-20 transition-all duration-700 ${solutionSection.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <span className="inline-block px-4 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium mb-6">
                The Solution
              </span>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                One widget.<br />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Three superpowers.</span>
              </h2>
              <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
                Install once. Works everywhere. Update anytime.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: FileText,
                  title: 'Contact Forms',
                  description: 'Drag-and-drop form builder. Instant email notifications. All submissions in one dashboard.',
                  badge: 'Free Forever',
                  badgeColor: 'success',
                  color: 'success'
                },
                {
                  icon: Calendar,
                  title: 'Appointment Scheduling',
                  description: 'Syncs with Google Calendar. Shows your real-time availability. Handles timezones automatically.',
                  color: 'primary'
                },
                {
                  icon: MessageSquare,
                  title: 'AI Chat Assistant',
                  description: 'Powered by Claude AI. Answers questions 24/7. Qualifies leads and books appointments.',
                  color: 'accent'
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  className={`group p-8 rounded-2xl bg-surface border border-border hover:shadow-xl transition-all duration-500 ${
                    solutionSection.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: `hsl(var(--${feature.color}) / 0.1)` }}
                    >
                      <feature.icon className="w-7 h-7" style={{ color: `hsl(var(--${feature.color}))` }} />
                    </div>
                    {feature.badge && (
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `hsl(var(--${feature.badgeColor}) / 0.1)`,
                          color: `hsl(var(--${feature.badgeColor}))`
                        }}
                      >
                        {feature.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-foreground-secondary leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Free Forever Section */}
        <section
          ref={freeSection.ref}
          className="py-24 md:py-32 relative overflow-hidden"
        >
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-r from-success/5 to-primary/5" />
          </div>

          <div className="container mx-auto px-6">
            <div className={`max-w-4xl mx-auto text-center transition-all duration-700 ${freeSection.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-success/10 mb-8">
                <Gift className="w-10 h-10 text-success" />
              </div>

              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Contact forms are<br />
                <span className="text-success">free forever</span>
              </h2>

              <p className="text-xl text-foreground-secondary max-w-2xl mx-auto mb-8">
                No trial. No credit card. No catch. Build unlimited forms, collect unlimited submissions,
                and embed them anywhere — completely free. Forever.
              </p>

              <div className="grid sm:grid-cols-3 gap-6 mb-12">
                {[
                  { icon: CreditCard, text: 'No credit card required' },
                  { icon: Globe, text: 'Unlimited forms & submissions' },
                  { icon: Palette, text: 'Full customization' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-center gap-3 p-4 rounded-xl bg-surface border border-border">
                    <item.icon className="w-5 h-5 text-success" />
                    <span className="font-medium">{item.text}</span>
                  </div>
                ))}
              </div>

              <Link href="/auth/register">
                <Button size="lg" className="h-14 px-8 text-lg bg-success hover:bg-success/90 hover:shadow-xl hover:shadow-success/30 transition-all duration-300 group">
                  Start Building Free Forms
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section
          id="features"
          ref={featuresSection.ref}
          className="py-24 md:py-32"
        >
          <div className="container mx-auto px-6">
            <div className={`text-center mb-20 transition-all duration-700 ${featuresSection.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Everything you need
              </h2>
              <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
                Built for businesses that want results, not complexity.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[
                { icon: Zap, title: '5-minute setup', desc: 'Copy one snippet. Paste it on your site. You\'re live.' },
                { icon: Palette, title: 'Fully customizable', desc: 'Match your brand colors, fonts, and style perfectly.' },
                { icon: Smartphone, title: 'Mobile-first', desc: 'Looks great on every device, every screen size.' },
                { icon: Shield, title: 'Secure by default', desc: 'All data encrypted. GDPR compliant. Your data stays yours.' },
                { icon: BarChart3, title: 'Built-in analytics', desc: 'Track form submissions, bookings, and chat engagement.' },
                { icon: Globe, title: 'Works everywhere', desc: 'WordPress, Webflow, Squarespace, Wix, or any HTML site.' },
              ].map((feature, index) => (
                <div
                  key={index}
                  className={`group p-8 rounded-2xl bg-surface border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 ${
                    featuresSection.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-foreground-secondary">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section
          ref={ctaSection.ref}
          className="py-24 md:py-32 relative overflow-hidden"
        >
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-10" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/40 rounded-full blur-[150px]" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/40 rounded-full blur-[150px]" />
          </div>

          <div className={`container mx-auto px-6 text-center transition-all duration-700 ${ctaSection.inView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-8">
                Ready to capture<br />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">more leads?</span>
              </h2>
              <p className="text-xl text-foreground-secondary mb-12 max-w-2xl mx-auto">
                Start with free contact forms. Add scheduling and AI chat when you need them.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
                <Link href="/auth/register">
                  <Button size="lg" className="h-16 px-10 text-xl bg-gradient-to-r from-primary to-accent hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300 group">
                    Get Started Free
                    <ArrowUpRight className="ml-2 h-6 w-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 text-foreground-secondary">
                {['Free forever plan', 'No credit card required', 'Setup in 5 minutes'].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-success" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-16 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center space-x-2 mb-6">
                <img src="/kentroi-logomark.png" alt="Kentroi" className="h-9 w-9" />
                <img src="/kentroi-wordmark.png" alt="Kentroi" className="h-7" />
              </Link>
              <p className="text-foreground-secondary">
                The all-in-one widget for forms, scheduling, and AI chat.
              </p>
            </div>

            {[
              {
                title: 'Product',
                links: [
                  { label: 'Features', href: '#features' },
                  { label: 'Pricing', href: '/pricing' },
                  { label: 'Alternatives', href: '/alternatives' },
                ]
              },
              {
                title: 'Resources',
                links: [
                  { label: 'Documentation', href: '/docs' },
                  { label: 'Sign In', href: '/auth/login' },
                  { label: 'Get Started', href: '/auth/register' },
                ]
              },
              {
                title: 'Legal',
                links: [
                  { label: 'Privacy Policy', href: '/privacy' },
                  { label: 'Terms of Service', href: '/terms' },
                ]
              }
            ].map((column, index) => (
              <div key={index}>
                <h4 className="font-semibold mb-4">{column.title}</h4>
                <ul className="space-y-3">
                  {column.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link href={link.href} className="text-foreground-secondary hover:text-foreground transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-foreground-secondary text-sm">
            <p>&copy; 2026 Kentroi. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}
