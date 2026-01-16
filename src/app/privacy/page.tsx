import Link from "next/link";

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              1. Information We Collect
            </h2>
            <p>
              We collect information you provide directly to us, such as when
              you create an account, update your profile, or communicate with
              us. This may include your name, email address, phone number, and
              payment information.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              2. How We Use Your Information
            </h2>
            <p>
              We use the information we collect to provide, maintain, and
              improve our services, process transactions, send you technical
              notices and support messages, and communicate with you about
              products, services, offers, and events.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              3. Information Sharing
            </h2>
            <p>
              We do not share your personal information with third parties
              except as described in this policy, such as with vendors who need
              access to such information to carry out work on our behalf, or
              when required by law.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              4. Data Security
            </h2>
            <p>
              We take reasonable measures to help protect information about you
              from loss, theft, misuse and unauthorized access, disclosure,
              alteration and destruction.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              5. Your Choices
            </h2>
            <p>
              You may update, correct, or delete information about you at any
              time by logging into your online account. You may also opt out of
              receiving promotional communications from us.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">6. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please
              contact us at privacy@slotify.com.
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
