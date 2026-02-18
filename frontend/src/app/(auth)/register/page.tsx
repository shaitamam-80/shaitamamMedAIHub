'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    institution: '',
    language: 'en',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          institution: formData.institution,
          preferred_language: formData.language,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        setError('This email is already registered. Try signing in.');
      } else {
        setError(error.message);
      }
      setIsLoading(false);
    } else {
      setSuccess(true);
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Success screen
  if (success) {
    return (
      <Card className="shadow-lg">
        <CardContent className="pt-8 pb-6 px-8 text-center">
          <div className="flex size-16 mx-auto items-center justify-center rounded-full bg-emerald-100 mb-6">
            <CheckCircle className="size-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            Registration Complete!
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            We&apos;ve sent a verification email to{' '}
            <span className="text-primary font-medium">{formData.email}</span>
            <br />
            Please confirm your email to continue.
          </p>
          <Button asChild>
            <Link href="/login">Go to Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardContent className="pt-8 pb-6 px-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            MedAI Hub
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">Create a new account</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-3">
            <AlertCircle className="size-4 text-destructive flex-shrink-0" />
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              required
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              placeholder="••••••••"
            />
            <p className="text-xs text-muted-foreground">At least 8 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="institution">Academic Institution (optional)</Label>
            <Input
              id="institution"
              name="institution"
              type="text"
              value={formData.institution}
              onChange={handleChange}
              placeholder="Your university"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Preferred Language</Label>
            <select
              id="language"
              name="language"
              value={formData.language}
              onChange={handleChange}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              <option value="en">English</option>
              <option value="he">עברית</option>
            </select>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="size-4 me-2" />
                Sign Up
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center pb-6">
        <p className="text-muted-foreground text-sm">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-primary hover:underline font-medium"
          >
            Sign In
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
