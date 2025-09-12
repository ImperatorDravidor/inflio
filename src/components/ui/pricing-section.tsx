"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, Zap, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PricingTier {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: { text: string; included: boolean }[];
  cta: string;
  popular?: boolean;
  icon?: React.ReactNode;
  gradient?: string;
}

interface PricingProps {
  tiers: PricingTier[];
  title?: React.ReactNode;
  subtitle?: string;
  onSelectPlan?: (tier: string) => void;
}

export const PricingSection: React.FC<PricingProps> = ({
  tiers,
  title = "Simple, transparent pricing",
  subtitle = "Choose the perfect plan for your needs",
  onSelectPlan,
}) => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [hoveredTier, setHoveredTier] = useState<number | null>(null);

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/10 via-transparent to-transparent blur-3xl pointer-events-none" />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {subtitle}
          </p>
          
          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={cn(
              "text-sm font-medium transition-colors",
              billingPeriod === 'monthly' ? 'text-foreground' : 'text-muted-foreground'
            )}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
              className="relative w-14 h-7 rounded-full bg-muted transition-colors hover:bg-muted/80"
            >
              <motion.div
                className="absolute top-1 w-5 h-5 rounded-full bg-primary shadow-sm"
                animate={{ left: billingPeriod === 'monthly' ? '4px' : '30px' }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              />
            </button>
            <span className={cn(
              "text-sm font-medium transition-colors flex items-center gap-1",
              billingPeriod === 'yearly' ? 'text-foreground' : 'text-muted-foreground'
            )}>
              Yearly
              {billingPeriod === 'yearly' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 font-semibold">
                  Save 20%
                </span>
              )}
            </span>
          </div>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              onMouseEnter={() => setHoveredTier(index)}
              onMouseLeave={() => setHoveredTier(null)}
              className={cn(
                "relative group",
                tier.popular && "md:-mt-4"
              )}
            >
              {/* Popular badge */}
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="px-4 py-1 rounded-full bg-gradient-to-r from-primary to-purple-600 text-white text-sm font-semibold shadow-lg">
                    Most Popular
                  </div>
                </div>
              )}
              
              <div className={cn(
                "relative h-full rounded-2xl border bg-card p-8 transition-all duration-300",
                tier.popular 
                  ? "border-primary/50 shadow-xl shadow-primary/10" 
                  : "border-border hover:border-primary/30",
                hoveredTier === index && "scale-[1.02] shadow-2xl"
              )}>
                {/* Gradient background for popular */}
                {tier.popular && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
                )}
                
                {/* Icon */}
                {tier.icon && (
                  <div className="mb-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      tier.gradient || "bg-primary/10"
                    )}>
                      {tier.icon}
                    </div>
                  </div>
                )}
                
                {/* Tier name and price */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{tier.description}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">
                      {billingPeriod === 'yearly' && tier.price !== "$0" 
                        ? `$${(parseInt(tier.price.replace('$', '')) * 0.8).toFixed(0)}`
                        : tier.price
                      }
                    </span>
                    {tier.period && tier.price !== "$0" && (
                      <span className="text-muted-foreground">
                        /{billingPeriod === 'yearly' ? 'year' : 'month'}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Features list */}
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={cn(
                        "text-sm",
                        feature.included ? "text-foreground" : "text-muted-foreground/50"
                      )}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
                
                {/* CTA Button */}
                <button
                  onClick={() => onSelectPlan?.(tier.name)}
                  className={cn(
                    "w-full py-3 px-4 rounded-xl font-medium transition-all duration-200",
                    tier.popular
                      ? "bg-gradient-to-r from-primary to-purple-600 text-white hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02]"
                      : "bg-primary/10 hover:bg-primary/20 text-foreground"
                  )}
                >
                  {tier.cta}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>30-day money back guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>No setup fees</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
