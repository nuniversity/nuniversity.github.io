// components/layout/Footer.tsx
import Link from 'next/link'
import { Github, Twitter, Linkedin, Mail, BookOpen, Code, Calculator, GamepadIcon } from 'lucide-react'
import { MapPin, Youtube, Globe, Instagram, Send, CheckCircle } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import { type Dictionary } from '@/lib/i18n/get-dictionary'

interface FooterProps {
  lang: Locale
  dict: Dictionary
}

const socialLinks = [
  { name: "Youtube", href: 'https://www.youtube.com/@nuniversity', icon: Youtube },
  { name: 'Instagram', href: 'https://www.instagram.com/thenuniversity/', icon: Instagram },
  { name: 'GitHub', href: 'https://github.com/nuniversity', icon: Github },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/company/nuniversity/', icon: Linkedin },
  { name: 'Email', href: 'mailto:thenuniversitybr@gmail.com', icon: Mail },
]

export default function Footer({ lang, dict }: FooterProps) {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    platform: [
      { name: dict.footer.links.courses, href: `/${lang}/courses`, icon: BookOpen },
      { name: dict.footer.links.tools, href: `/${lang}/tools`, icon: Code },
      { name: dict.footer.links.games, href: `/${lang}/games`, icon: GamepadIcon },
      // { name: dict.footer.links.apiExplorer, href: `/${lang}/tools/api-explorer`, icon: Calculator },
    ],
    subjects: [
      { name: dict.footer.links.computerScience, href: `/${lang}/courses/` },
      // { name: dict.footer.links.engineering, href: `/${lang}/courses/` },
      // { name: dict.footer.links.mathematics, href: `/${lang}/courses/` },
      // { name: dict.footer.links.physics, href: `/${lang}/courses/` },
    ],
    resources: [
      { name: dict.footer.links.documentation, href: `/${lang}/` },
      { name: dict.footer.links.blog, href: `/${lang}/` },
      { name: dict.footer.links.community, href: `/${lang}/` },
      { name: dict.footer.links.support, href: `/${lang}/` },
    ],
    company: [
      { name: dict.footer.links.aboutUs, href: `/${lang}/about` },
      { name: dict.footer.links.contact, href: `/${lang}/contact` },
      // { name: dict.footer.links.privacy, href: `/${lang}/` },
      // { name: dict.footer.links.terms, href: `/${lang}/` },
    ],
  }

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">NU</span>
              </div>
              <span className="text-2xl font-bold">NUniversity</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              {dict.footer.description}
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
                  aria-label={social.name}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{dict.footer.sections.platform}</h3>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <link.icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Subjects Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{dict.footer.sections.subjects}</h3>
            <ul className="space-y-3">
              {footerLinks.subjects.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{dict.footer.sections.company}</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Newsletter Section - Commented out but keeping structure */}
      {/* <div className="border-t border-gray-800">
        <div className="container-custom py-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div>
              <h3 className="text-lg font-semibold mb-2">{dict.footer.newsletter.title}</h3>
              <p className="text-gray-400">{dict.footer.newsletter.description}</p>
            </div>
            <div className="flex space-x-3 w-full md:w-auto">
              <input
                type="email"
                placeholder={dict.footer.newsletter.placeholder}
                className="flex-1 md:w-64 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button className="btn-primary whitespace-nowrap">
                {dict.footer.newsletter.button}
              </button>
            </div>
          </div>
        </div>
      </div> */}

      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm text-gray-400">
              <p>&copy; {currentYear} {dict.footer.copyright} {dict.footer.rights}.</p>
              <div className="flex space-x-4">
                <Link href={`/${lang}/`} className="hover:text-white transition-colors">
                  {dict.footer.links.privacy}
                </Link>
                <Link href={`/${lang}/`} className="hover:text-white transition-colors">
                  {dict.footer.links.terms}
                </Link>
                <Link href={`/${lang}/`} className="hover:text-white transition-colors">
                  {dict.footer.links.cookies}
                </Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>{dict.footer.madeWith}</span>
              <span className="text-red-400">❤️</span>
              <span>{dict.footer.forLearners}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}