import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { RTLProvider } from '@/components/rtl-provider';
import { ConfirmatriceLayout } from '@/components/confirmatrice/confirmatrice-layout';

export default function ConfirmatriceLayoutWrapper({
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
        <ConfirmatriceLayout>
          {children}
        </ConfirmatriceLayout>
        <Toaster />
      </RTLProvider>
    </ThemeProvider>
  );
}

