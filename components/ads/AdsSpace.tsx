// 'use client'

// import Script from "next/script";
// import { useEffect } from 'react'

// interface AdSpaceProps {
//   id: string
//   className?: string
//   placeholder?: string
// }

// export default function AdSpace({ id, className = '', placeholder = 'Advertisement' }: AdSpaceProps) {
//   useEffect(() => {
//     // Initialize Google AdSense ads when component mounts
//     // This would be used with real Google AdSense integration
//     if (typeof window !== 'undefined' && window.adsbygoogle) {
//       try {
//         (window.adsbygoogle = window.adsbygoogle || []).push({})
//       } catch (error) {
//         console.log('AdSense error:', error)
//       }
//     }
//   }, [])

//   return (
//     <div className={`ad-space ${className}`} id={`ad-${id}`}>
//       {/* Demo ad placeholder - replace with real ad code */}
//       <div className="text-center">
//         <div className="text-sm font-medium text-gray-500 mb-2">
//           {placeholder}
//         </div>
//         <div className="text-xs text-gray-400">
//           Ad Space Available
//         </div>
//       </div>

//       <Script
//         async
//         src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6042638700707862"
//         crossOrigin="anonymous"
//         strategy="afterInteractive"
//       />
      
//     </div>
//   )
// }

// // Type declaration for AdSense
// declare global {
//   interface Window {
//     adsbygoogle: any[]
//   }
// }