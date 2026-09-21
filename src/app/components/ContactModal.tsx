import React from 'react';
import { usePostHog } from '@posthog/react';
import { X, Mail, MessageCircle, Phone } from 'lucide-react';
import { Github, Linkedin, Instagram } from './BrandIcons';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const posthog = usePostHog();

  if (!isOpen) return null;

  const contactMethods = [
    {
      icon: Mail,
      label: 'Email',
      value: 'damtowise@damtowise.xyz',
      href: 'mailto:damtowise@damtowise.xyz',
      color: '#ff6600',
    },
    {
      icon: Linkedin,
      label: 'LinkedIn',
      value: 'linkedin.com/in/einstein-john',
      href: 'https://linkedin.com/in/einstein-john',
      color: '#0A66C2',
    },
    {
      icon: Github,
      label: 'GitHub',
      value: 'github.com/einstein-john',
      href: 'https://github.com/einstein-john',
      color: '#fff',
    },
    {
      icon: Instagram,
      label: 'Instagram',
      value: '@einstein_oj',
      href: 'https://instagram.com/einstein_oj',
      color: '#E4405F',
    },
    {
      icon: Phone,
      label: 'Call',
      value: '+90 533 877 30 01',
      href: 'https://tel:+905338773001',
      color: '#25D366',
    },
    {
      icon: MessageCircle,
      label: 'Message',
      value: 'WhatsApp',
      href: 'https://wa.me/2348084126474',
      color: '#25D366',
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg mx-4">
        <div className="bg-[#0a0a0a] border border-[#ff6600]/30 rounded-2xl p-6 md:p-8 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-mono">
              Get in <span className="text-[#ff6600]">Touch</span>
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#ff6600]/10 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-6 h-6 text-[#ff6600]" />
            </button>
          </div>

          {/* Contact Methods */}
          <div className="space-y-3">
            {contactMethods.map((method) => {
              const Icon = method.icon;
              return (
                <a
                  key={method.label}
                  href={method.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 bg-black/50 border border-[#333] rounded-xl hover:border-[#ff6600]/50 hover:bg-[#ff6600]/5 transition-all duration-300 group"
                  onClick={() =>
                    posthog?.capture('contact_method_clicked', {
                      method: method.label,
                      href: method.href,
                    })
                  }
                >
                  <div
                    className="p-3 rounded-lg transition-colors"
                    style={{ backgroundColor: `${method.color}20` }}
                  >
                    <Icon
                      className="w-5 h-5 transition-transform group-hover:scale-110"
                      style={{ color: method.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#999] font-mono">{method.label}</div>
                    <div className="text-white truncate">{method.value}</div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#ff6600] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </a>
              );
            })}
          </div>

          {/* Footer note */}
          <p className="text-center text-sm text-[#666] mt-6 font-mono">
            Feel free to reach out through any platform
          </p>
        </div>
      </div>
    </>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
