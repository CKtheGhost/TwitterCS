import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorDisplay from '../../components/ErrorDisplay';

describe('ErrorDisplay Component', () => {
  // Test with string error
  test('renders correctly with string error', () => {
    render(<ErrorDisplay error="Something went wrong" />);
    
    // Title should be the default "Error"
    expect(screen.getByText('Error')).toBeInTheDocument();
    
    // Check if message is displayed
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  // Test with error object containing code
  test('renders correctly with error object containing code', () => {
    const error = {
      code: 'DATABASE_TIMEOUT',
      message: 'Database connection timed out'
    };
    
    render(<ErrorDisplay error={error} />);
    
    // Title should be specific to code
    expect(screen.getByText('Connection Error')).toBeInTheDocument();
    
    // Check if message is displayed
    expect(screen.getByText('We\'re having trouble connecting to our servers.')).toBeInTheDocument();
    
    // Check if details are displayed
    expect(screen.getByText('Database connection timed out')).toBeInTheDocument();
    
    // Check for suggestions
    expect(screen.getByText('Check your internet connection')).toBeInTheDocument();
    expect(screen.getByText('Try again in a few moments')).toBeInTheDocument();
  });

  // Test retry button
  test('calls onRetry when retry button is clicked', () => {
    const mockRetry = jest.fn();
    const error = {
      code: 'DATABASE_TIMEOUT',
      message: 'Database connection timed out',
      retryable: true
    };
    
    render(<ErrorDisplay error={error} onRetry={mockRetry} />);
    
    // Find and click retry button
    fireEvent.click(screen.getByText('Try Again'));
    
    // Check if callback was called
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  // Test dismiss button
  test('calls onDismiss when dismiss button is clicked', () => {
    const mockDismiss = jest.fn();
    const error = {
      message: 'An error occurred'
    };
    
    render(<ErrorDisplay error={error} onDismiss={mockDismiss} />);
    
    // Find and click dismiss button
    fireEvent.click(screen.getByText('Dismiss'));
    
    // Check if callback was called
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  // Test different error types
  test('renders correctly for validation error', () => {
    const error = {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input provided'
    };
    
    render(<ErrorDisplay error={error} />);
    
    expect(screen.getByText('Invalid Input')).toBeInTheDocument();
    expect(screen.getByText('There was a problem with the data you provided.')).toBeInTheDocument();
  });

  test('renders correctly for consent required error', () => {
    const error = {
      code: 'CONSENT_REQUIRED',
      message: 'You need to provide consent',
      details: {
        consentReason: 'We need your consent to access Twitter data'
      }
    };
    
    render(<ErrorDisplay error={error} />);
    
    expect(screen.getByText('Consent Required')).toBeInTheDocument();
    expect(screen.getByText('You need to provide consent before completing this action.')).toBeInTheDocument();
    expect(screen.getByText('We need your consent to access Twitter data')).toBeInTheDocument();
  });

  test('renders correctly for rate limited error', () => {
    const error = {
      code: 'RATE_LIMITED',
      message: 'Too many requests',
      retryAfter: 300 // 5 minutes in seconds
    };
    
    render(<ErrorDisplay error={error} />);
    
    expect(screen.getByText('Too Many Attempts')).toBeInTheDocument();
    expect(screen.getByText('You\'ve made too many attempts in a short time.')).toBeInTheDocument();
    expect(screen.getByText('Try again in 5 minutes')).toBeInTheDocument();
  });

  // Test additional suggestions
  test('renders custom suggestions from error object', () => {
    const error = {
      message: 'An error occurred',
      suggestions: ['Clear your browser cache', 'Update your browser']
    };
    
    render(<ErrorDisplay error={error} />);
    
    expect(screen.getByText('Clear your browser cache')).toBeInTheDocument();
    expect(screen.getByText('Update your browser')).toBeInTheDocument();
  });

  // Test not rendering when no error
  test('does not render when error is null', () => {
    const { container } = render(<ErrorDisplay error={null} />);
    
    // Container should be empty
    expect(container.firstChild).toBeNull();
  });
});