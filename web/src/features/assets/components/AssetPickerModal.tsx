import React, { useState, useMemo } from 'react'
import { Modal } from '@/components/common/Modal'
import { useQuery } from '@tanstack/react-query'
import type { Asset } from '@/types'

export const AssetPickerModal: React.FC<{
  onClose: () => void
  onSelect: (url: string, name: string) => void
}> = ({ onClose, onSelect }) => {
  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ['assets'],
  })

  const [search, setSearch] = useState('')

  const filteredAssets = useMemo(() => {
    if (!search) return assets
    return assets.filter((a) =>
      a.name.toLowerCase().includes(search.toLowerCase()),
    )
  }, [assets, search])

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Select Image"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Search images..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 px-3 bg-surface-element border border-borders-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar p-1">
          {filteredAssets.length === 0 ? (
            <div className="col-span-full py-8 text-center text-text-tertiary">
              No images found. Add some in the Image Library.
            </div>
          ) : (
            filteredAssets.map((asset) => (
              <div
                key={asset.id}
                onClick={() => onSelect(asset.url, asset.name)}
                className="bg-surface-element border border-borders-primary rounded-lg overflow-hidden cursor-pointer hover:border-accent-blue transition-colors group"
              >
                <div className="aspect-square bg-surface-card flex items-center justify-center p-2 relative">
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="max-w-full max-h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm font-medium">
                      Insert
                    </span>
                  </div>
                </div>
                <div className="p-2 border-t border-borders-primary">
                  <p
                    className="text-xs text-text-primary truncate"
                    title={asset.name}
                  >
                    {asset.name}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  )
}
