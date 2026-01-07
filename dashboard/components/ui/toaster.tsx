'use client';

import * as React from 'react';
import { ToastProvider, ToastViewport } from '@/components/ui/toast';

const Toaster = () => {
  return (
    <ToastProvider>
      <ToastViewport />
    </ToastProvider>
  );
};

export { Toaster };
