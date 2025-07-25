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
    let value: any = messages[language]
    
    for (const k of keys) {
      value = value?.[k]
    }
    
    return value || key
  }

  return { t, language }
} 