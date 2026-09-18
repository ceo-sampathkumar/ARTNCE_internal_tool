'use client';

import React from 'react';
import SubscriptionView from './SubscriptionView';

/**
 * CompanyPerformanceView
 * Compatibility wrapper routing to Screen 2 (Company Performance & Target) of the redesigned Subscription module.
 */
export default function CompanyPerformanceView({ settings = {} }) {
  return <SubscriptionView settings={settings} initialScreen="performance" />;
}
