/**
 * LoadingIndicator Component Tests (T059)
 *
 * Tests for loading spinner display:
 * - Loading animation (T057)
 * - Status message (T057)
 * - Visual presentation (T057)
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingIndicator from './LoadingIndicator';

describe('LoadingIndicator Component (T059)', () => {
  describe('Rendering (T057)', () => {
    it('should render loading indicator', () => {
      render(<LoadingIndicator />);

      expect(screen.getByText('Agent is thinking...')).toBeInTheDocument();
    });

    it('should display spinner animation', () => {
      const { container } = render(<LoadingIndicator />);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should display "Agent is thinking..." message', () => {
      render(<LoadingIndicator />);

      const message = screen.getByText('Agent is thinking...');
      expect(message).toBeInTheDocument();
      expect(message.className).toContain('text-blue-700');
    });

    it('should have consistent styling', () => {
      const { container } = render(<LoadingIndicator />);

      const wrapper = container.firstChild;
      expect(wrapper?.className).toContain('bg-blue-50');
      expect(wrapper?.className).toContain('rounded-lg');
      expect(wrapper?.className).toContain('border');
    });
  });

  describe('Animation', () => {
    it('should have spinning animation class', () => {
      const { container } = render(<LoadingIndicator />);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner?.className).toContain('animate-spin');
    });

    it('should have proper spinner styling', () => {
      const { container } = render(<LoadingIndicator />);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner?.className).toContain('w-5');
      expect(spinner?.className).toContain('h-5');
      expect(spinner?.className).toContain('border');
    });
  });

  describe('Visual Design', () => {
    it('should use blue color scheme', () => {
      const { container } = render(<LoadingIndicator />);

      const wrapper = container.firstChild;
      expect(wrapper?.className).toContain('bg-blue-50');
      expect(wrapper?.className).toContain('border-blue-200');

      const message = screen.getByText('Agent is thinking...');
      expect(message.className).toContain('text-blue-700');
    });

    it('should display as a block with flex layout', () => {
      const { container } = render(<LoadingIndicator />);

      const wrapper = container.firstChild;
      expect(wrapper?.className).toContain('flex');
      expect(wrapper?.className).toContain('items-center');
    });

    it('should have consistent spacing', () => {
      const { container } = render(<LoadingIndicator />);

      const wrapper = container.firstChild;
      expect(wrapper?.className).toContain('px-4');
      expect(wrapper?.className).toContain('py-3');
      expect(wrapper?.className).toContain('gap-3');
    });
  });

  describe('Accessibility', () => {
    it('should have readable message for screen readers', () => {
      render(<LoadingIndicator />);

      const message = screen.getByText('Agent is thinking...');
      expect(message.textContent).toBe('Agent is thinking...');
    });

    it('should maintain semantic structure', () => {
      const { container } = render(<LoadingIndicator />);

      const wrapper = container.firstChild;
      expect(wrapper?.nodeName).toBe('DIV');
    });
  });

  describe('Component Structure', () => {
    it('should render as a single container', () => {
      const { container } = render(<LoadingIndicator />);

      const children = container.children[0]?.children;
      expect(children?.length).toBeGreaterThan(0);
    });

    it('should contain spinner and text together', () => {
      const { container } = render(<LoadingIndicator />);

      const spinner = container.querySelector('.animate-spin');
      const message = screen.getByText('Agent is thinking...');

      expect(spinner?.parentElement).toBeTruthy();
      expect(message?.parentElement).toBeTruthy();
    });
  });
});
