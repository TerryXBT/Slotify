// Onboarding layout - no bottom navigation
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100 font-sans">
      {children}
    </div>
  );
}
