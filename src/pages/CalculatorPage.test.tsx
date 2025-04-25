// src/pages/CalculatorPage.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MantineProvider } from '@mantine/core'; // Need provider for Mantine components
import CalculatorPage from './CalculatorPage';

describe('CalculatorPage Component', () => {
  // Helper function to render with MantineProvider
  const renderWithProvider = (ui: React.ReactElement) => {
    return render(<MantineProvider>{ui}</MantineProvider>);
  };

  it('renders a main heading', () => {
    renderWithProvider(<CalculatorPage />);

    // Check for a heading (e.g., h1) with expected text
    // Using a role query is generally preferred for accessibility
    expect(
      screen.getByRole('heading', { level: 1, name: /Bedrock Pricing Calculator/i })
    ).toBeInTheDocument();
  });

  // Add more tests later as functionality is added (e.g., inputs, results display)
}); 