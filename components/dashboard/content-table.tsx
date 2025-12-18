'use client'

import Image from 'next/image'
import { Badge } from '@/components/ui/badge'

interface Content {
  id: string
  platform: string
  mediaType: string | null
  title: string | null
  description: string | null
  caption: string | null
  thumbnailUrl: string | null
  mediaUrl: string | null
  views: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  publishedAt: Date | null
}

interface ContentTableProps {
  content: Content[]
}

export function ContentTable({ content }: ContentTableProps) {
  const formatNumber = (num: number | null) => {
    if (!num) return '0'
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      instagram: '#E1306C',
      facebook: '#1877F2',
      tiktok: '#00f2ea',
      youtube: '#FF0000',
    }
    return colors[platform] || '#888'
  }

  if (content.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-zinc-400 text-lg">No content synced yet</p>
        <p className="text-zinc-600 text-sm mt-2">
          Connect your accounts and sync to see your content here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {content.map((item) => (
        <div
          key={item.id}
          className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
        >
          <div className="flex gap-4">
            {/* Thumbnail */}
            <div className="flex-shrink-0">
              {item.thumbnailUrl ? (
                <div className="relative w-32 h-20 rounded overflow-hidden bg-zinc-800">
                  <Image
                    src={item.thumbnailUrl}
                    alt={item.title || item.caption || 'Content thumbnail'}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 h-20 rounded bg-zinc-800 flex items-center justify-center">
                  <span className="text-zinc-600 text-xs">No thumbnail</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">
                    {item.title || item.caption || 'Untitled'}
                  </h3>
                  {item.description && (
                    <p className="text-zinc-400 text-sm mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
                <Badge
                  style={{
                    backgroundColor: getPlatformColor(item.platform) + '20',
                    color: getPlatformColor(item.platform),
                    borderColor: getPlatformColor(item.platform) + '40',
                  }}
                  className="flex-shrink-0 capitalize"
                >
                  {item.platform}
                </Badge>
              </div>

              {/* Metrics */}
              <div className="flex items-center gap-4 mt-3 text-sm text-zinc-400">
                <div className="flex items-center gap-1">
                  <span>👁️</span>
                  <span>{formatNumber(item.views)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>❤️</span>
                  <span>{formatNumber(item.likes)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>💬</span>
                  <span>{formatNumber(item.comments)}</span>
                </div>
                {item.shares !== null && item.shares > 0 && (
                  <div className="flex items-center gap-1">
                    <span>🔄</span>
                    <span>{formatNumber(item.shares)}</span>
                  </div>
                )}
                <div className="ml-auto text-zinc-500">
                  {formatDate(item.publishedAt)}
                </div>
              </div>

              {/* Link to original */}
              {item.mediaUrl && (
                <div className="mt-2">
                  <a
                    href={item.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    View original →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

