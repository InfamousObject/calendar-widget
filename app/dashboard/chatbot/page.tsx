'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Save, DollarSign, Lock, ArrowRight, TrendingUp, Zap } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface ChatbotConfig {
  id: string;
  enabled: boolean;
  botName: string;
  greetingMessage: string;
  tone: string;
  customInstructions?: string;
  enableFaq: boolean;
  enableLeadQual: boolean;
  enableScheduling: boolean;
  model: string;
  maxTokens: number;
  temperature: number;
  messageLimit: number;
}

interface ChatbotUsage {
  messagesCount: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
}

export default function ChatbotPage() {
  const [config, setConfig] = useState<ChatbotConfig | null>(null);
  const [usage, setUsage] = useState<ChatbotUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);

  useEffect(() => {
    fetchConfig();
    fetchUsage();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/chatbot/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
        setHasAccess(true);
      } else if (response.status === 403) {
        // User doesn't have access to chatbot
        setHasAccess(false);
      } else {
        toast.error('Failed to load chatbot settings');
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      toast.error('Failed to load chatbot settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/chatbot/usage');
      if (response.ok) {
        const data = await response.json();
        setUsage(data.usage);
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    if (!config.botName.trim()) {
      toast.error('Bot name is required');
      return;
    }

    if (!config.greetingMessage.trim()) {
      toast.error('Greeting message is required');
      return;
    }

    setSaving(true);
    try {
      // Prepare config data, removing empty optional fields
      const configData = {
        ...config,
        customInstructions: config.customInstructions?.trim() || undefined,
      };

      const response = await fetch('/api/chatbot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData),
      });

      if (response.ok) {
        toast.success('Chatbot settings saved!');
        fetchConfig();
      } else {
        const errorData = await response.json();

        // Show detailed validation errors
        if (errorData.details && Array.isArray(errorData.details)) {
          errorData.details.forEach((detail: any) => {
            const fieldName = detail.path.join('.');
            toast.error(`${fieldName}: ${detail.message}`);
          });
        } else {
          toast.error(errorData.error || 'Failed to save settings');
        }
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="space-y-6 animate-pulse">
          <div className="h-24 rounded-xl bg-muted" />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-32 rounded-xl bg-muted" />
            <div className="h-32 rounded-xl bg-muted" />
          </div>
          <div className="h-96 rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <Card className="border-2 border-primary/20 shadow-xl animate-fadeInUp">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
                <Lock className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="font-display text-3xl font-semibold">AI Chatbot is a Premium Feature</CardTitle>
              <CardDescription className="text-base mt-3">
                Upgrade to the Chatbot or Bundle plan to unlock powerful AI-powered conversations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Intelligent Conversations</h3>
                    <p className="text-sm text-muted-foreground">
                      Engage visitors with AI-powered responses using your knowledge base
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Lead Qualification</h3>
                    <p className="text-sm text-muted-foreground">
                      Automatically collect visitor information and qualify leads
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">24/7 Availability</h3>
                    <p className="text-sm text-muted-foreground">
                      Answer questions and book appointments around the clock
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/dashboard/billing" className="flex-1">
                    <Button className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30 transition-all duration-300" size="lg">
                      Upgrade to Chatbot Plan
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/dashboard/billing" className="flex-1">
                    <Button variant="outline" className="w-full border-primary/30 hover:border-primary transition-all duration-200" size="lg">
                      View All Plans
                    </Button>
                  </Link>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-4">
                  Chatbot plan starts at $89/month • Bundle plan includes booking + chatbot for $119/month
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-8">
        <p>Failed to load chatbot configuration</p>
      </div>
    );
  }

  const usagePercentage = usage ? (usage.messagesCount / config.messageLimit) * 100 : 0;
  const costInDollars = usage ? (usage.estimatedCost / 100).toFixed(4) : '0.0000';

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section with Gradient */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8">
          <div className="gradient-mesh absolute inset-0 -z-10" />

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <h1 className="font-display text-4xl font-semibold tracking-tight">AI Chatbot</h1>
              </div>
              <p className="text-lg text-foreground-secondary font-light">
                Configure your intelligent AI assistant
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                <Label htmlFor="enabled" className="text-sm font-medium">Enable Chatbot</Label>
                <Switch
                  id="enabled"
                  checked={config.enabled}
                  onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
                />
                <Badge variant={config.enabled ? 'default' : 'secondary'}>
                  {config.enabled ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
                size="lg"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Messages This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usage?.messagesCount || 0} / {config.messageLimit}
              </div>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {usagePercentage.toFixed(0)}% used
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Estimated Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${costInDollars}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This month
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Settings</CardTitle>
                <CardDescription>Configure your chatbot's personality</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Bot Name */}
                <div className="space-y-2">
                  <Label>Bot Name *</Label>
                  <Input
                    value={config.botName}
                    onChange={(e) => setConfig({ ...config, botName: e.target.value })}
                    placeholder="Assistant"
                  />
                </div>

                {/* Greeting Message */}
                <div className="space-y-2">
                  <Label>Greeting Message *</Label>
                  <Textarea
                    value={config.greetingMessage}
                    onChange={(e) => setConfig({ ...config, greetingMessage: e.target.value })}
                    placeholder="Hi! How can I help you today?"
                    rows={2}
                  />
                </div>

                {/* Tone */}
                <div className="space-y-2">
                  <Label>Conversation Tone</Label>
                  <Select
                    value={config.tone}
                    onValueChange={(value) => setConfig({ ...config, tone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Instructions */}
                <div className="space-y-2">
                  <Label>Custom Instructions</Label>
                  <Textarea
                    value={config.customInstructions || ''}
                    onChange={(e) => setConfig({ ...config, customInstructions: e.target.value })}
                    placeholder="Add specific instructions for how the bot should behave..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional: Customize how the AI assistant should respond to visitors
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Capabilities */}
            <Card>
              <CardHeader>
                <CardTitle>Capabilities</CardTitle>
                <CardDescription>Choose what your chatbot can do</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Answer FAQs</Label>
                    <p className="text-sm text-muted-foreground">
                      Use knowledge base articles to answer questions
                    </p>
                  </div>
                  <Switch
                    checked={config.enableFaq}
                    onCheckedChange={(checked) => setConfig({ ...config, enableFaq: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Lead Qualification</Label>
                    <p className="text-sm text-muted-foreground">
                      Collect visitor information and qualify leads
                    </p>
                  </div>
                  <Switch
                    checked={config.enableLeadQual}
                    onCheckedChange={(checked) => setConfig({ ...config, enableLeadQual: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Appointment Scheduling</Label>
                    <p className="text-sm text-muted-foreground">
                      Help visitors book appointments
                    </p>
                  </div>
                  <Switch
                    checked={config.enableScheduling}
                    onCheckedChange={(checked) => setConfig({ ...config, enableScheduling: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>Fine-tune AI behavior and performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Max Tokens */}
                <div className="space-y-2">
                  <Label>Max Tokens</Label>
                  <Input
                    type="number"
                    value={config.maxTokens}
                    onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) || 1024 })}
                    min="256"
                    max="4096"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum length of chatbot responses (256-4096)
                  </p>
                </div>

                {/* Temperature */}
                <div className="space-y-2">
                  <Label>Temperature: {config.temperature}</Label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.temperature}
                    onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Lower values = more focused, Higher values = more creative
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">
                    ⚠️ Warning: Do not change this setting unless you are familiar with AI model parameters
                  </p>
                </div>

                {/* Message Limit */}
                <div className="space-y-2">
                  <Label>Monthly Message Limit</Label>
                  <Input
                    type="number"
                    value={config.messageLimit}
                    onChange={(e) => setConfig({ ...config, messageLimit: parseInt(e.target.value) || 100 })}
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum messages per month (0 = unlimited)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Chatbot</span>
                  <Badge variant={config.enabled ? 'default' : 'secondary'}>
                    {config.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Messages This Month</span>
                  <span className="text-xs text-muted-foreground">
                    {usage?.messagesCount || 0} / {config.messageLimit}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Usage Info */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Tracking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium mb-1">Monitor Performance</p>
                  <p className="text-muted-foreground">
                    Track message counts, token usage, and estimated costs in real-time.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Message Limits</p>
                  <p className="text-muted-foreground">
                    Set monthly limits to control costs and manage usage across all conversations.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium mb-1">Getting Started</p>
                  <p className="text-muted-foreground">
                    1. Configure bot name and greeting
                    <br />
                    2. Set monthly message limits
                    <br />
                    3. Enable desired capabilities
                    <br />
                    4. Toggle the chatbot on
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Knowledge Base</p>
                  <p className="text-muted-foreground">
                    The chatbot uses your published Knowledge Base articles to answer questions. Add articles in the Knowledge section.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
