// src/layouts/MainLayout.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MantineProvider } from '@mantine/core'; // Need provider for Mantine components
import MainLayout from './MainLayout';

describe('MainLayout Component', () => {
  // Helper function to render with MantineProvider
  const renderWithProvider = (ui: React.ReactElement) => {
    return render(<MantineProvider>{ui}</MantineProvider>);
  };

  it('renders header and main content areas', () => {
    // Render the layout with some placeholder children
    renderWithProvider(
      <MainLayout>
        <div>Page Content</div>
      </MainLayout>
    );

    // Check for a header landmark (often implicit with <header> or role="banner")
    // Or use a specific test ID if AppShell doesn't provide a role by default
    expect(screen.getByTestId('main-layout-header')).toBeInTheDocument();

    // Check for a main landmark (often implicit with <main> or role="main")
    expect(screen.getByRole('main')).toBeInTheDocument();

    // Check if the children content is rendered within the main area
    expect(screen.getByText('Page Content')).toBeInTheDocument();
  });

  it('renders children passed to it', () => {
    const testMessage = 'This is the child content';
    renderWithProvider(
      <MainLayout>
        <h1>{testMessage}</h1>
      </MainLayout>
    );
    expect(screen.getByRole('heading', { name: testMessage })).toBeInTheDocument();
  });
}); 