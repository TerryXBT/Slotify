'use client'

import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

export default function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <button
            onClick={handleCopy}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1C1C1E] hover:bg-gray-200 transition-colors"
        >
            {copied ? (
                <Check className="w-5 h-5 text-green-500" />
            ) : (
                <Copy className="w-5 h-5 text-gray-500" />
            )}
        </button>
    )
}
