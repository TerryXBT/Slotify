import Link from "next/link";

// Since these are public pages, we might not want the full DesktopLayout which usually requires auth.
// Let's create a simple wrapper or just use the page content for now, assuming a simple header/footer might be added later or just a back link.
// Given the current structure, I'll keep it simple and clean, matching the login aesthetic or a clean document style.

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-900 text-gray-300 p-6 md:p-12 font-sans selection:bg-white/20">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between pb-8 border-b border-white/10">
          <Link
            href="/"
            className="text-2xl font-bold text-white tracking-tight"
          >
            Slotify
          </Link>
          <Link
            href="/login"
            className="text-sm hover:text-white transition-colors"
          >
            Back to Login
          </Link>
        </header>

        <main className="space-y-6">
          <h1 className="text-4xl font-bold text-white tracking-tight mb-8">
            Terms of Service
          </h1>
          <p className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing and using Slotify (&quot;the Service&quot;), you
              agree to be bound by these Terms of Service. If you do not agree
              to these terms, please do not use the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              2. Description of Service
            </h2>
            <p>
              Slotify provides an online appointment booking and scheduling
              platform for professionals. We reserve the right to modify,
              suspend, or discontinue any part of the Service at any time.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              3. User Accounts
            </h2>
            <p>
              You are responsible for maintaining the confidentiality of your
              account credentials and for all activities that occur under your
              account. You agree to notify us immediately of any unauthorized
              use of your account.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              4. Acceptable Use
            </h2>
            <p>
              You agree not to use the Service for any unlawful purpose or in
              any way that interrupts, damages, or impairs the service. This
              includes but is not limited to transmitting viruses, spam, or
              engaging in fraudulent activity.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              5. Service Fees & Payments
            </h2>
            <p>
              Certain features of Slotify may require payment of fees. You agree
              to pay all applicable fees as described on the Service. All fees
              are non-refundable unless otherwise stated.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              6. Limitation of Liability
            </h2>
            <p>
              To the fullest extent permitted by law, Slotify shall not be
              liable for any indirect, incidental, special, consequential, or
              punitive damages, or any loss of profits or revenues.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              7. Changes to Terms
            </h2>
            <p>
              We may update these Terms of Service from time to time. We will
              notify you of any changes by posting the new Terms on this page.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">8. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at
              support@slotifyau.com.
            </p>
          </section>
        </main>

        <footer className="pt-8 border-t border-white/10 text-center text-sm text-gray-600">
          &copy; {new Date().getFullYear()} Slotify. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
