import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type { Asset } from '@/types'
import { Button } from '@/components/common/Button'
import { Image as ImageIcon, Plus, Loader } from 'lucide-react'
import { useState, useMemo } from 'react'
import { AssetUploadModal } from '@/features/assets/components/AssetUploadModal'
import { AssetDetailModal } from '@/features/assets/components/AssetDetailModal'
import { AssetSelectionPopup } from '@/features/assets/components/AssetSelectionPopup'
import { useAppStore } from '@/store/useAppStore'

export const Route = createFileRoute('/assets/')({
  component: AssetsList,
})

function AssetsList() {
  const { data: assets, isLoading } = useQuery<Asset[]>({
    queryKey: ['assets'],
  })

  const [showUpload, setShowUpload] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [search, setSearch] = useState('')

  const toggleAssetSelection = useAppStore(
    (state) => state.toggleAssetSelection,
  )
  const selectedAssetIds = useAppStore((state) => state.selectedAssetIds)

  const filteredAssets = useMemo(() => {
    if (!assets) return []
    if (!search) return assets
    return assets.filter((a) =>
      a.name.toLowerCase().includes(search.toLowerCase()),
    )
  }, [assets, search])

  return (
    <div className="p-8 h-full overflow-y-auto custom-scrollbar relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Asset Library</h1>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 px-3 bg-surface-element border border-borders-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
          />
          <Button variant="primary" onClick={() => setShowUpload(true)}>
            <Plus size={18} />
            Add Asset
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 mt-12 text-text-secondary">
          <Loader size={32} className="animate-spin mb-4 text-accent-blue" />
          <p>Loading assets...</p>
        </div>
      ) : !assets || assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-surface-card border border-borders-primary border-dashed rounded-card mt-12">
          <ImageIcon size={48} className="text-text-tertiary mb-4" />
          <h2 className="text-xl font-semibold mb-2">No assets yet</h2>
          <p className="text-text-secondary mb-6">
            Store URLs of images to use them directly in your email templates.
          </p>
          <Button variant="primary" onClick={() => setShowUpload(true)}>
            <Plus size={18} />
            Add Asset
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredAssets.map((asset) => {
            const isSelected = selectedAssetIds.has(asset.id)
            return (
              <div
                key={asset.id}
                onClick={() => setSelectedAsset(asset)}
                className={`bg-surface-card border rounded-xl overflow-hidden cursor-pointer hover:border-accent-blue transition-all duration-200 group flex flex-col shadow-sm hover:shadow-md relative ${isSelected ? 'border-accent-blue bg-accent-blue/5' : 'border-borders-primary'}`}
              >
                <div className="absolute top-3 right-3 z-10 bg-surface-card/80 backdrop-blur-sm rounded-sm">
                  <input
                    type="checkbox"
                    className="custom-checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation()
                      toggleAssetSelection(asset.id)
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="w-full aspect-square bg-surface-element relative overflow-hidden border-b border-borders-primary flex items-center justify-center">
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="absolute inset-0 w-full h-full p-4 object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-md"
                  />
                </div>
                <div className="p-4 flex-grow flex flex-col justify-between bg-surface-card">
                  <p
                    className="text-sm font-medium text-text-primary truncate mb-2"
                    title={asset.name}
                  >
                    {asset.name}
                  </p>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-text-tertiary font-mono truncate">
                      {new Date(asset.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AssetSelectionPopup />
      {showUpload && <AssetUploadModal onClose={() => setShowUpload(false)} />}
      {selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </div>
  )
}
