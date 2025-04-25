// src/App.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MantineProvider } from '@mantine/core'; // Provider is needed here
import App from './App';
// Note: We don't need MantineProvider here as App itself doesn't directly use Mantine
// but rather renders MainLayout which is tested separately with the provider.

describe('App Component', () => {
  // Helper function to render with MantineProvider
  const renderWithProvider = (ui: React.ReactElement) => {
    return render(<MantineProvider>{ui}</MantineProvider>);
  };

  it('renders the main layout and calculator page content', () => {
    // Use the helper to wrap App with the provider
    renderWithProvider(<App />);

    // Check for an element from the MainLayout (e.g., the header)
    // If MainLayout uses AppShell, the header might be identifiable by role or testid
    expect(screen.getByTestId('main-layout-header')).toBeInTheDocument();

    // Check for an element from the CalculatorPage (e.g., the main heading)
    expect(
      screen.getByRole('heading', { level: 1, name: /Bedrock Pricing Calculator/i })
    ).toBeInTheDocument();
  });
}); 