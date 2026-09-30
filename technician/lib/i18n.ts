'use client'

import { useCallback } from 'react'
import { useStore } from './store'
import type { Settings } from './types'

type Lang = Settings['language']

/**
 * Translations keyed by the English text, so an untranslated string simply
 * shows in English. Covers the app's frame (tabs, menu) and Settings so far.
 */
const DICT: Record<Exclude<Lang, 'English'>, Record<string, string>> = {
  हिन्दी: {
    Home: 'होम',
    Jobs: 'जॉब्स',
    Map: 'मैप',
    Earnings: 'कमाई',
    Profile: 'प्रोफ़ाइल',
    Dashboard: 'डैशबोर्ड',
    Emergency: 'इमरजेंसी',
    'Job history': 'जॉब हिस्ट्री',
    Notifications: 'सूचनाएँ',
    Settings: 'सेटिंग्स',
    'Help & Support': 'मदद और सपोर्ट',
    Logout: 'लॉग आउट',
    'Online · receiving jobs': 'ऑनलाइन · जॉब मिल रहे हैं',
    Offline: 'ऑफ़लाइन',
    Availability: 'उपलब्धता',
    'Online for new requests': 'नई रिक्वेस्ट के लिए ऑनलाइन',
    'Dispatch can send you jobs': 'डिस्पैच आपको जॉब भेज सकता है',
    'You won’t receive requests': 'आपको रिक्वेस्ट नहीं मिलेंगी',
    'Working hours': 'काम के घंटे',
    'Shift starts': 'शिफ़्ट शुरू',
    'Shift ends': 'शिफ़्ट ख़त्म',
    'On shift now': 'अभी शिफ़्ट पर',
    'Off shift now': 'अभी शिफ़्ट से बाहर',
    'Emergency requests can still reach you outside these hours if you stay online.':
      'ऑनलाइन रहने पर इन घंटों के बाहर भी इमरजेंसी रिक्वेस्ट आ सकती हैं।',
    'Service radius': 'सर्विस दायरा',
    Language: 'भाषा',
    'App language': 'ऐप की भाषा',
    'New service requests': 'नई सर्विस रिक्वेस्ट',
    'Emergency requests': 'इमरजेंसी रिक्वेस्ट',
    'Full-screen alert with sound': 'आवाज़ के साथ फ़ुल-स्क्रीन अलर्ट',
    'Schedule changes & cancellations': 'शेड्यूल बदलाव और कैंसलेशन',
    'Payments & ratings': 'पेमेंट और रेटिंग',
    'Alert sound': 'अलर्ट की आवाज़',
    Account: 'अकाउंट',
    'Payment settings': 'पेमेंट सेटिंग्स',
    'Account settings': 'अकाउंट सेटिंग्स',
    'Password, fingerprint, devices': 'पासवर्ड, फ़िंगरप्रिंट, डिवाइस',
    'Reset demo data': 'डेमो डेटा रीसेट करें',
    'Reload today’s sample jobs': 'आज के सैंपल जॉब फिर से लोड करें',
    'No waiting requests within {km} km': '{km} km के अंदर कोई रिक्वेस्ट नहीं',
    '{n} waiting request within {km} km': '{km} km के अंदर {n} रिक्वेस्ट इंतज़ार में',
    '{n} waiting requests within {km} km': '{km} km के अंदर {n} रिक्वेस्ट इंतज़ार में',
  },
  తెలుగు: {
    Home: 'హోమ్',
    Jobs: 'జాబ్స్',
    Map: 'మ్యాప్',
    Earnings: 'సంపాదన',
    Profile: 'ప్రొఫైల్',
    Dashboard: 'డ్యాష్‌బోర్డ్',
    Emergency: 'ఎమర్జెన్సీ',
    'Job history': 'జాబ్ హిస్టరీ',
    Notifications: 'నోటిఫికేషన్లు',
    Settings: 'సెట్టింగ్స్',
    'Help & Support': 'సహాయం & సపోర్ట్',
    Logout: 'లాగ్ అవుట్',
    'Online · receiving jobs': 'ఆన్‌లైన్ · జాబ్స్ వస్తున్నాయి',
    Offline: 'ఆఫ్‌లైన్',
    Availability: 'అందుబాటు',
    'Online for new requests': 'కొత్త రిక్వెస్ట్‌ల కోసం ఆన్‌లైన్',
    'Dispatch can send you jobs': 'డిస్పాచ్ మీకు జాబ్స్ పంపగలదు',
    'You won’t receive requests': 'మీకు రిక్వెస్ట్‌లు రావు',
    'Working hours': 'పని వేళలు',
    'Shift starts': 'షిఫ్ట్ ప్రారంభం',
    'Shift ends': 'షిఫ్ట్ ముగింపు',
    'On shift now': 'ఇప్పుడు షిఫ్ట్‌లో ఉన్నారు',
    'Off shift now': 'ఇప్పుడు షిఫ్ట్ బయట',
    'Emergency requests can still reach you outside these hours if you stay online.':
      'ఆన్‌లైన్‌లో ఉంటే ఈ వేళల బయట కూడా ఎమర్జెన్సీ రిక్వెస్ట్‌లు రావచ్చు.',
    'Service radius': 'సర్వీస్ పరిధి',
    Language: 'భాష',
    'App language': 'యాప్ భాష',
    'New service requests': 'కొత్త సర్వీస్ రిక్వెస్ట్‌లు',
    'Emergency requests': 'ఎమర్జెన్సీ రిక్వెస్ట్‌లు',
    'Full-screen alert with sound': 'శబ్దంతో ఫుల్-స్క్రీన్ అలర్ట్',
    'Schedule changes & cancellations': 'షెడ్యూల్ మార్పులు & రద్దులు',
    'Payments & ratings': 'పేమెంట్స్ & రేటింగ్స్',
    'Alert sound': 'అలర్ట్ శబ్దం',
    Account: 'అకౌంట్',
    'Payment settings': 'పేమెంట్ సెట్టింగ్స్',
    'Account settings': 'అకౌంట్ సెట్టింగ్స్',
    'Password, fingerprint, devices': 'పాస్‌వర్డ్, ఫింగర్‌ప్రింట్, డివైస్‌లు',
    'Reset demo data': 'డెమో డేటా రీసెట్',
    'Reload today’s sample jobs': 'ఈరోజు శాంపిల్ జాబ్స్ మళ్లీ లోడ్ చేయండి',
    'No waiting requests within {km} km': '{km} km లోపు రిక్వెస్ట్‌లు లేవు',
    '{n} waiting request within {km} km': '{km} km లోపు {n} రిక్వెస్ట్ వేచి ఉంది',
    '{n} waiting requests within {km} km': '{km} km లోపు {n} రిక్వెస్ట్‌లు వేచి ఉన్నాయి',
  },
}

export const LANG_CODE: Record<Lang, string> = { English: 'en', हिन्दी: 'hi', తెలుగు: 'te' }

/**
 * `t('Settings')` → the string in the language picked in Settings.
 * `t('{n} jobs', { n: 3 })` fills the `{n}` placeholders after translating.
 */
export function useT() {
  const lang = useStore().settings.language
  return useCallback(
    (s: string, vars?: Record<string, string | number>) => {
      const out = lang === 'English' ? s : (DICT[lang][s] ?? s)
      return vars ? out.replace(/\{(\w+)\}/g, (m, k: string) => String(vars[k] ?? m)) : out
    },
    [lang]
  )
}
