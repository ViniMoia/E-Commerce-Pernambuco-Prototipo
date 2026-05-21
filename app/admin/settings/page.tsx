'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<{
    pixKey: string | null;
    pixKeyType: string | null;
    whatsappNumber: string | null;
  } | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadUserAndSettings();
  }, []);

  const loadUserAndSettings = async () => {
    try {
      const res = await fetch('/api/loja/settings');
      if (!res.ok) {
        if (res.status === 400 || res.status === 401 || res.status === 403) {
          setErrorMessage('Usuário não autorizado ou não associado a nenhuma loja');
        } else {
          setErrorMessage('Erro ao carregar configurações');
        }
        setLoading(false);
        return;
      }

      const data = await res.json();
      setSettings(data || {
        pixKey: null,
        pixKeyType: null,
        whatsappNumber: null
      });
      setLoading(false);
    } catch (err) {
      console.error('[ADMIN_SETTINGS_LOAD_ERROR]', err);
      setErrorMessage('Erro ao carregar configurações');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSubmitLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/loja/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pixKey: settings.pixKey === '' ? null : settings.pixKey,
          pixKeyType: settings.pixKeyType === '' ? null : settings.pixKeyType,
          whatsappNumber: settings.whatsappNumber === '' ? null : settings.whatsappNumber
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setSuccessMessage('Configurações atualizadas com sucesso!');
        setSettings({
          pixKey: updated.pixKey,
          pixKeyType: updated.pixKeyType,
          whatsappNumber: updated.whatsappNumber
        });
      } else {
        const errData = await res.json().catch(() => null);
        setErrorMessage(errData?.error || 'Falha ao atualizar configurações');
      }
    } catch (err) {
      console.error('[ADMIN_SETTINGS_UPDATE_ERROR]', err);
      setErrorMessage('Erro ao atualizar configurações');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleClearSettings = async () => {
    if (!confirm('Deseja realmente apagar a chave PIX e o número do WhatsApp de sua loja?')) return;
    
    setSubmitLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/loja/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pixKey: null,
          pixKeyType: null,
          whatsappNumber: null
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setSuccessMessage('Configurações apagadas com sucesso!');
        setSettings({
          pixKey: null,
          pixKeyType: null,
          whatsappNumber: null
        });
      } else {
        const errorData = await res.json().catch(() => null);
        setErrorMessage(errorData?.error || 'Falha ao apagar configurações');
      }
    } catch (err) {
      console.error('[ADMIN_SETTINGS_CLEAR_ERROR]', err);
      setErrorMessage('Erro ao apagar configurações');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-[#DDAF02]/50 border-t-[#DDAF02] rounded-full animate-spin" />
          <p className="mt-3 text-xs text-neutral-400">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  if (errorMessage && !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="text-center">
          <p className="text-red-500">{errorMessage}</p>
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/admin'}
            className="mt-4"
          >
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Gemini-inspired header with subtle animations */}
      <header className="fixed inset-0 z-[0] pointer-events-none">
        <div className="absolute inset-0">
          <div className="relative h-full bg-[radial-gradient(800px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(255,255,255,0.03),transparent_40%)]" 
               onMouseMove={e => {
                 const rect = e.currentTarget.getBoundingClientRect();
                 const x = e.clientX - rect.left;
                 const y = e.clientY - rect.top;
                 (e.currentTarget as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
                 (e.currentTarget as HTMLElement).style.setProperty('--mouse-y', `${y}px`);
               }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.01),rgba(255,255,255,0))] 
                                 pointer-events-none" />
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-[10] min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pb-12">
        {!settings && (
          <div className="text-center">
            <p className="text-yellow-500">Carregando configurações da loja...</p>
          </div>
        )}
        {settings && (
          <form onSubmit={handleSubmit} className="w-full max-w-[500px] space-y-6">

            {/* Title */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                Pix e Contato
              </h2>
              <p className="text-sm text-neutral-400">
                Configure a chave PIX e o WhatsApp para recebimento de pagamentos
              </p>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="bg-[#DDAF02]/10 border border-[#DDAF02]/20 rounded-xl p-4 mb-4">
                <p className="text-[#DDAF02] font-medium">{successMessage}</p>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
                <p className="text-red-400 font-medium">{errorMessage}</p>
              </div>
            )}

            {/* PIX Key Section */}
            <div className="space-y-4">
              <label className="text-[10px] text-[#DDAF02] font-mono tracking-[0.25em] uppercase block mb-1">
                Chave PIX
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.pixKey ?? ''}
                  onChange={(e) => setSettings(prev => prev ? {...prev, pixKey: e.target.value} : settings)}
                  placeholder="Digite sua chave PIX (CPF, CNPJ, email, telefone ou chave aleatória)"
                  className={`w-full px-4 py-3 bg-[#050505]/50 border border-neutral-700/50 rounded-xl 
                           text-neutral-100 placeholder:text-neutral-400 focus:outline-none 
                           focus:ring-2 focus:ring-[#DDAF02]/50 focus:border-[#DDAF02] transition-all
                           ${submitLoading ? 'opacity-70' : ''}`}
                  disabled={submitLoading}
                />
                {settings.pixKey && (
                  <button
                    type="button"
                    onClick={() => setSettings(prev => prev ? {...prev, pixKey: ''} : settings)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center 
                             text-neutral-400 hover:text-[#DDAF02] transition-colors"
                    disabled={submitLoading}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                )}
                <p className="mt-1 text-xs text-neutral-500">
                  Formatos válidos: CPF, CNPJ, E-mail, Telefone ou Chave Aleatória
                </p>
              </div>
            </div>

            {/* PIX Key Type Section */}
            <div className="space-y-4">
              <label className="text-[10px] text-[#DDAF02] font-mono tracking-[0.25em] uppercase block mb-1">
                Tipo da Chave PIX
              </label>
              <div className="relative">
                <select
                  value={settings.pixKeyType ?? ''}
                  onChange={(e) => setSettings(prev => prev ? {...prev, pixKeyType: e.target.value} : settings)}
                  className={`w-full px-4 py-3 bg-[#050505]/50 border border-neutral-700/50 rounded-xl 
                           text-neutral-100 placeholder:text-neutral-400 focus:outline-none 
                           focus:ring-2 focus:ring-[#DDAF02]/50 focus:border-[#DDAF02] transition-all
                           ${submitLoading ? 'opacity-70' : ''}`}
                  disabled={submitLoading}
                >
                  <option value="">Selecione o tipo</option>
                  <option value="CPF">CPF</option>
                  <option value="CNPJ">CNPJ</option>
                  <option value="EMAIL">E-mail</option>
                  <option value="TELEFONE">Telefone</option>
                  <option value="ALEATORIA">Chave Aleatória</option>
                </select>
                <p className="mt-1 text-xs text-neutral-500">
                  Selecione o tipo correspondente à chave PIX informada acima
                </p>
              </div>
            </div>

            {/* WhatsApp Number Section */}
            <div className="space-y-4">
              <label className="text-[10px] text-[#DDAF02] font-mono tracking-[0.25em] uppercase block mb-1">
                Número do WhatsApp
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={settings.whatsappNumber ?? ''}
                  onChange={(e) => setSettings(prev => prev ? {...prev, whatsappNumber: e.target.value} : settings)}
                  placeholder="(DDD) 9XXXX-XXXX"
                  className={`w-full px-4 py-3 bg-[#050505]/50 border border-neutral-700/50 rounded-xl 
                           text-neutral-100 placeholder:text-neutral-400 focus:outline-none 
                           focus:ring-2 focus:ring-[#DDAF02]/50 focus:border-[#DDAF02] transition-all
                           ${submitLoading ? 'opacity-70' : ''}`}
                  disabled={submitLoading}
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Número usado para notificações e atendimento ao cliente
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                type="submit"
                disabled={submitLoading || !settings}
                className="w-full bg-[#dbb501] hover:bg-[#dbb501]/90 text-zinc-950 text-base py-6 font-semibold 
                         shadow-[0_0_20px_rgba(219,181,1,0.3)] hover:shadow-[0_0_25px_rgba(219,181,1,0.4)] 
                         transition-all flex items-center justify-center group"
              >
                {submitLoading ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" stroke="currentColor">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="none" d="M4 12a8 8 0 018-8v8z" strokeWidth="4"></path>
                    </svg>
                    Atualizando...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21.02L12 17.77L5.82 21.02l-5-4.87L6.91 9.27l9.19-6.26Z"></path>
                    </svg>
                    Salvar
                  </>
                )}
              </Button>

              <Button
                type="button"
                onClick={handleClearSettings}
                disabled={submitLoading || !settings || (!settings.pixKey && !settings.whatsappNumber)}
                variant="outline"
                className="w-full border-red-500/20 hover:border-red-500/50 hover:bg-red-500/10 text-red-400 text-base py-6 font-semibold transition-all flex items-center justify-center group bg-transparent"
              >
                {submitLoading ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" stroke="currentColor">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="none" d="M4 12a8 8 0 018-8v8z" strokeWidth="4"></path>
                    </svg>
                    Limpando...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Apagar Dados
                  </>
                )}
              </Button>
            </div>

            {/* Back to Dashboard */}
            <div className="mt-6 text-center">
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/admin'}
                className="text-neutral-400 hover:text-white"
              >
                Voltar ao Dashboard
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Footer */}
      <footer className="relative z-[10] border-t border-white/10 py-6">
        <div className="container mx-auto px-6 text-center text-sm text-neutral-500">
          © 2026 Painel Admin. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}