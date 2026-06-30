import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { RTLProvider } from '@/components/rtl-provider';
import { AgentLivraisonLayout } from '@/components/agent-livraison/agent-livraison-layout';

export default function AgentLivraisonLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <RTLProvider>
        <AgentLivraisonLayout>
          {children}
        </AgentLivraisonLayout>
        <Toaster />
      </RTLProvider>
    </ThemeProvider>
  );
}

