export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Standalone layout — no shared nav/footer. V4 page handles everything.
  return <>{children}</>;
}
