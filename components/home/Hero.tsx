// components/home/Hero.tsx
'use client'

import Link from 'next/link'
import { ArrowRight, Play, Code, BookOpen, Calculator } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import { type Dictionary } from '@/lib/i18n/get-dictionary'

interface HeroProps {
  lang: Locale
  dict: Dictionary
}

export default function Hero({ lang, dict }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-bg"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container-custom text-center text-white">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 mb-8 animate-fade-in">
            <span className="text-sm font-medium">🚀 {dict.hero.badge}</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {dict.hero.title}{' '}
            <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              {dict.hero.titleHighlight}
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {dict.hero.subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <Link
              href={`/${lang}/courses`}
              className="btn-primary flex items-center space-x-2 text-lg px-8 py-4 shadow-xl hover:shadow-2xl"
            >
              <BookOpen className="w-5 h-5" />
              <span>{dict.hero.cta.explore}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            {/* <Link
              href={`/${lang}/tools`}
              className="btn-secondary flex items-center space-x-2 text-lg px-8 py-4 bg-white/20 backdrop-blur-md text-white border-white/30 hover:bg-white/30"
            >
              <Play className="w-5 h-5" />
              <span>{dict.hero.cta.tryTools}</span>
            </Link> */}
          </div>

          {/* Feature Icons */}
          <div className="flex flex-wrap items-center justify-center space-x-8 space-y-4 animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2">
              <Code className="w-5 h-5 text-yellow-300" />
              <span className="text-sm font-medium">{dict.hero.features.coding}</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2">
              <Calculator className="w-5 h-5 text-green-300" />
              <span className="text-sm font-medium">{dict.hero.features.tools}</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2">
              <BookOpen className="w-5 h-5 text-blue-300" />
              <span className="text-sm font-medium">{dict.hero.features.courses}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2"></div>
        </div>
      </div>
    </section>
  )
}