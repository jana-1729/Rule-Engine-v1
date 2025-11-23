import Link from "next/link";
import { Button } from "@/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/components/card";
import { Zap, Plug, Brain, BarChart, Shield, Workflow } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Connect Everything.
            <br />
            <span className="text-primary">Automate Anything.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Build powerful workflow automations with 1000+ integrations. 
            AI-assisted field mapping makes connecting your apps effortless.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/docs">View Documentation</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose Our Platform?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Enterprise-grade integration platform with AI-powered automation
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Plug className="w-10 h-10 text-primary mb-2" />
              <CardTitle>1000+ Integrations</CardTitle>
              <CardDescription>
                Connect with all your favorite apps and services. Extensible plugin architecture.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Brain className="w-10 h-10 text-primary mb-2" />
              <CardTitle>AI-Assisted Mapping</CardTitle>
              <CardDescription>
                Smart field mapping with GPT-4. Automatically suggest transformations and mappings.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Workflow className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Visual Workflow Builder</CardTitle>
              <CardDescription>
                Drag-and-drop interface for creating complex workflows without code.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Lightning Fast</CardTitle>
              <CardDescription>
                Queue-based execution handles millions of workflows per day with sub-second latency.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Real-time Analytics</CardTitle>
              <CardDescription>
                Full observability with step-by-step execution logs and performance metrics.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Enterprise Security</CardTitle>
              <CardDescription>
                AES-256 encryption, RLS, audit logs, and compliance-ready infrastructure.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Use Cases */}
      <section className="container mx-auto px-4 py-20 bg-secondary/30">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Popular Use Cases</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Data Sync</CardTitle>
              <CardDescription>
                Sync data between Google Sheets, Notion, Airtable, and databases in real-time.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lead Management</CardTitle>
              <CardDescription>
                Automatically route leads from forms to your CRM and notify sales teams.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Onboarding</CardTitle>
              <CardDescription>
                Create accounts, send emails, and update dashboards when customers sign up.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-primary mb-2">1000+</div>
            <div className="text-muted-foreground">Integrations</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">10M+</div>
            <div className="text-muted-foreground">Workflows Run</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
            <div className="text-muted-foreground">Uptime</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">&lt;5s</div>
            <div className="text-muted-foreground">Avg Execution</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="text-center py-12">
            <h2 className="text-3xl font-bold mb-4">Ready to automate your workflows?</h2>
            <p className="text-lg mb-6 opacity-90">
              Join thousands of teams automating their work with our platform
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/signup">Start Free Trial</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t">
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            © 2024 Integration Platform. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/docs" className="hover:underline">Documentation</Link>
            <Link href="/api" className="hover:underline">API</Link>
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/terms" className="hover:underline">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

