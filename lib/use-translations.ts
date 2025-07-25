"use client"

import { useLanguage } from './language-context'
import enMessages from '../messages/en.json'
import zhMessages from '../messages/zh.json'

type Messages = typeof enMessages

const messages = {
  en: enMessages,
  zh: zhMessages
}

export function useTranslations() {
  const { language } = useLanguage()
  
  const t = (key: string): string => {
    const keys = key.split('.')
    let value: Record<string, unknown> | unknown = messages[language]
    
    for (const k of keys) {
      if (value && typeof value === 'object' && value !== null) {
        value = (value as Record<string, unknown>)[k]
      } else {
        return key
      }
    }
    
    return typeof value === 'string' ? value : key
  }

  return { t, language }
} 