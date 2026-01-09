'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    SmartWidgetLoaded?: boolean;
  }
}

function TestWidgetContent() {
  const searchParams = useSearchParams();
  const widgetId = searchParams.get('widgetId');
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!widgetId) return;

    // Load the widget script
    const script = document.createElement('script');
    script.src = '/widget.js';
    script.setAttribute('data-widget-id', widgetId);
    script.setAttribute('data-api-base', window.location.origin);
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup
      const button = document.getElementById('smartwidget-button');
      if (button) button.remove();
      const overlay = document.getElementById('smartwidget-overlay');
      if (overlay) overlay.remove();
      script.remove();
      window.SmartWidgetLoaded = false;
    };
  }, [widgetId]);

  if (!widgetId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Missing Widget ID</h1>
          <p className="text-muted-foreground">
            Please provide a widgetId parameter in the URL
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Demo Website Content */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">Demo Company</h1>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-700 hover:text-indigo-600">Home</a>
              <a href="#" className="text-gray-700 hover:text-indigo-600">About</a>
              <a href="#" className="text-gray-700 hover:text-indigo-600">Services</a>
              <a href="#" className="text-gray-700 hover:text-indigo-600">Contact</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to Our Demo Website
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            This is a sample website to demonstrate the SmartWidget embed.
            Look for the floating widget button in the bottom corner!
          </p>
          <div className="flex justify-center gap-4">
            <button className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
              Get Started
            </button>
            <button className="px-8 py-3 bg-white text-indigo-600 rounded-lg font-medium border-2 border-indigo-600 hover:bg-indigo-50 transition-colors">
              Learn More
            </button>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Fast & Easy</h3>
            <p className="text-gray-600">
              Book appointments or submit forms with just a few clicks using our embedded widget.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Secure</h3>
            <p className="text-gray-600">
              Your data is protected with enterprise-grade security and encryption.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">24/7 Support</h3>
            <p className="text-gray-600">
              Get help whenever you need it through our contact forms and booking system.
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-20 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Testing the Widget</h2>
          <div className="space-y-4 text-gray-600">
            <p>
              <strong>Look for the floating button:</strong> You should see a circular button in the bottom-right corner of the screen.
            </p>
            <p>
              <strong>Click to open:</strong> Click the button to open the widget modal.
            </p>
            <p>
              <strong>Try booking:</strong> Select an appointment type or fill out a contact form.
            </p>
            <p>
              <strong>Close the widget:</strong> Click outside the modal or the X button to close it.
            </p>
          </div>
        </div>

        {/* Code Example */}
        <div className="mt-12 bg-gray-900 rounded-xl shadow-lg p-8 text-white">
          <h3 className="text-xl font-bold mb-4">Embed Code Used on This Page</h3>
          {origin ? (
            <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`<!-- SmartWidget Embed Code -->
<script
  src="${origin}/widget.js"
  data-widget-id="${widgetId}"
  data-api-base="${origin}"
  async
></script>`}</code>
            </pre>
          ) : (
            <div className="bg-gray-800 p-4 rounded-lg text-sm">
              Loading embed code...
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Demo Company. This is a test page for SmartWidget.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function TestWidgetPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <TestWidgetContent />
    </Suspense>
  );
}
