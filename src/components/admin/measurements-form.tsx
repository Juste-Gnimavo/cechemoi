'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Ruler } from 'lucide-react'

// Sub-options for length fields with their own values
interface SleeveLengthValues {
  manchesCourtes?: number | null
  avantCoudes?: number | null
  niveau34?: number | null
  manchesLongues?: number | null
}

interface DressLengthValues {
  avantGenoux?: number | null
  niveauGenoux?: number | null
  apresGenoux?: number | null
  miMollets?: number | null
  chevilles?: number | null
  tresLongue?: number | null
}

interface SkirtLengthValues {
  avantGenoux?: number | null
  niveauGenoux?: number | null
  apresGenoux?: number | null
  miMollets?: number | null
  chevilles?: number | null
  tresLongue?: number | null
}

interface MeasurementsFormData {
  measurementDate?: string
  unit?: 'cm' | 'inches'
  dos?: number | null
  carrureDevant?: number | null
  carrureDerriere?: number | null
  epaule?: number | null
  epauleManche?: number | null
  poitrine?: number | null
  tourDeTaille?: number | null
  longueurDetaille?: number | null
  bassin?: number | null
  longueurManches?: string | null // JSON string for sub-values
  tourDeManche?: number | null
  poignets?: number | null
  pinces?: number | null
  longueurTotale?: number | null
  longueurRobes?: string | null // JSON string for sub-values
  longueurTunique?: number | null
  ceinture?: number | null
  longueurPantalon?: number | null
  frappe?: number | null
  cuisse?: number | null
  genoux?: number | null
  longueurJupe?: string | null // JSON string for sub-values
  autresMesures?: string | null
}

interface MeasurementsFormProps {
  initialData?: MeasurementsFormData
  onChange: (data: MeasurementsFormData) => void
  disabled?: boolean
  collapsed?: boolean
}

// Parse JSON string to object safely
function parseJsonField<T>(value: string | null | undefined, defaultValue: T): T {
  if (!value) return defaultValue
  try {
    return JSON.parse(value) as T
  } catch {
    return defaultValue
  }
}

export function MeasurementsForm({
  initialData,
  onChange,
  disabled = false,
  collapsed = true,
}: MeasurementsFormProps) {
  const [isExpanded, setIsExpanded] = useState(!collapsed)
  const [formData, setFormData] = useState<MeasurementsFormData>(
    initialData || {
      measurementDate: new Date().toISOString().split('T')[0],
      unit: 'cm',
    }
  )

  // Sub-values for length fields
  const [sleeveValues, setSleeveValues] = useState<SleeveLengthValues>(
    parseJsonField(initialData?.longueurManches, {})
  )
  const [dressValues, setDressValues] = useState<DressLengthValues>(
    parseJsonField(initialData?.longueurRobes, {})
  )
  const [skirtValues, setSkirtValues] = useState<SkirtLengthValues>(
    parseJsonField(initialData?.longueurJupe, {})
  )

  // Update parent when sub-values change
  useEffect(() => {
    const hasSleeveValues = Object.values(sleeveValues).some(v => v !== null && v !== undefined)
    const hasDressValues = Object.values(dressValues).some(v => v !== null && v !== undefined)
    const hasSkirtValues = Object.values(skirtValues).some(v => v !== null && v !== undefined)

    const newData = {
      ...formData,
      longueurManches: hasSleeveValues ? JSON.stringify(sleeveValues) : null,
      longueurRobes: hasDressValues ? JSON.stringify(dressValues) : null,
      longueurJupe: hasSkirtValues ? JSON.stringify(skirtValues) : null,
    }
    setFormData(newData)
    onChange(newData)
  }, [sleeveValues, dressValues, skirtValues])

  const updateField = (field: keyof MeasurementsFormData, value: any) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    onChange(newData)
  }

  const renderNumberInput = (
    field: keyof MeasurementsFormData,
    label: string,
    num: number
  ) => (
    <div className="flex items-center gap-2 py-2 border-b border-gray-200 dark:border-gray-700">
      <span className="w-8 text-sm text-gray-500 dark:text-gray-400">{num}</span>
      <label className="flex-1 text-sm text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <input
        type="number"
        step="0.1"
        value={formData[field] ?? ''}
        onChange={(e) =>
          updateField(field, e.target.value ? parseFloat(e.target.value) : null)
        }
        disabled={disabled}
        className="w-24 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
        placeholder={formData.unit || 'cm'}
      />
    </div>
  )

  // Render sleeve length with sub-options
  const renderSleeveLengthField = () => (
    <div className="py-2 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-2">
        <span className="w-8 text-sm text-gray-500 dark:text-gray-400 pt-1">10</span>
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            LONGUEUR DES MANCHES
          </label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-28">Manches courtes:</span>
              <input
                type="number"
                step="0.1"
                value={sleeveValues.manchesCourtes ?? ''}
                onChange={(e) => setSleeveValues({
                  ...sleeveValues,
                  manchesCourtes: e.target.value ? parseFloat(e.target.value) : null
                })}
                disabled={disabled}
                className="w-16 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                placeholder="cm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-28">Niveau 3/4:</span>
              <input
                type="number"
                step="0.1"
                value={sleeveValues.niveau34 ?? ''}
                onChange={(e) => setSleeveValues({
                  ...sleeveValues,
                  niveau34: e.target.value ? parseFloat(e.target.value) : null
                })}
                disabled={disabled}
                className="w-16 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                placeholder="cm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-28">Avant les coudes:</span>
              <input
                type="number"
                step="0.1"
                value={sleeveValues.avantCoudes ?? ''}
                onChange={(e) => setSleeveValues({
                  ...sleeveValues,
                  avantCoudes: e.target.value ? parseFloat(e.target.value) : null
                })}
                disabled={disabled}
                className="w-16 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                placeholder="cm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-28">Manches longues:</span>
              <input
                type="number"
                step="0.1"
                value={sleeveValues.manchesLongues ?? ''}
                onChange={(e) => setSleeveValues({
                  ...sleeveValues,
                  manchesLongues: e.target.value ? parseFloat(e.target.value) : null
                })}
                disabled={disabled}
                className="w-16 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                placeholder="cm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Render dress length with sub-options
  const renderDressLengthField = () => (
    <div className="py-2 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-2">
        <span className="w-8 text-sm text-gray-500 dark:text-gray-400 pt-1">15</span>
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            LONGUEUR DES ROBES
          </label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-36">Avant les genoux:</span>
              <input
                type="number"
                step="0.1"
                value={dressValues.avantGenoux ?? ''}
                onChange={(e) => setDressValues({
                  ...dressValues,
                  avantGenoux: e.target.value ? parseFloat(e.target.value) : null
                })}
                disabled={disabled}
                className="w-16 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                placeholder="cm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-36">Mi-mollets:</span>
              <input
                type="number"
                step="0.1"
                value={dressValues.miMollets ?? ''}
                onChange={(e) => setDressValues({
                  ...dressValues,
                  miMollets: e.target.value ? parseFloat(e.target.value) : null
                })}
                disabled={disabled}
                className="w-16 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                placeholder="cm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-36">Au niveau des genoux:</span>
              <input
                type="number"
                step="0.1"
                value={dressValues.niveauGenoux ?? ''}
                onChange={(e) => setDressValues({
                  ...dressValues,
                  niveauGenoux: e.target.value ? parseFloat(e.target.value) : null
                })}
                disabled={disabled}
                className="w-16 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                placeholder="cm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-36">Niveau des chevilles:</span>
              <input
                type="number"
                step="0.1"
                value={dressValues.chevilles ?? ''}
                onChange={(e) => setDressValues({
                  ...dressValues,
                  chevilles: e.target.value ? parseFloat(e.target.value) : null
                })}
                disabled={disabled}
                className="w-16 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                placeholder="cm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-36">Après genoux (crayon):</span>
              <input
                type="number"
                step="0.1"
                value={dressValues.apresGenoux ?? ''}
                onChange={(e) => setDressValues({
                  ...dressValues,
                  apresGenoux: e.target.value ? parseFloat(e.target.value) : null
                })}
                disabled={disabled}
                className="w-16 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                placeholder="cm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-36">Très longue:</span>
              <input
                type="number"
                step="0.1"
                value={dressValues.tresLongue ?? ''}
                onChange={(e) => setDressValues({
                  ...dressValues,
                  tresLongue: e.target.value ? parseFloat(e.target.value) : null
                })}
                disabled={disabled}
                className="w-16 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                placeholder="cm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Render skirt length with sub-options
  const renderSkirtLengthField = () => (
    <div className="py-2 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-2">
        <span className="w-8 text-sm text-gray-500 dark:text-gray-400 pt-1">22</span>
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            LONGUEUR JUPE
          </label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-36">Avant les genoux:</span>
              <input
                type="number"
                step="0.1"
                value={skirtValues.avantGenoux ?? ''}
                onChange={(e) => setSkirtValues({
                  ...skirtValues,
                  avantGenoux: e.target.value ? parseFloat(e.target.value) : null
                })}
                disabled={disabled}
                className="w-16 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                placeholder="cm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-36">Mi-mollets:</span>
              <input
                type="number"
                step="0.1"
                value={skirtValues.miMollets ?? ''}
                onChange={(e) => setSkirtValues({
                  ...skirtValues,
                  miMollets: e.target.value ? parseFloat(e.target.value) : null
                })}
                disabled={disabled}
                className="w-16 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                placeholder="cm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-36">Au niveau des genoux:</span>
              <input
                type="number"
                step="0.1"
                value={skirtValues.niveauGenoux ?? ''}
                onChange={(e) => setSkirtValues({
                  ...skirtValues,
                  niveauGenoux: e.target.value ? parseFloat(e.target.value) : null
                })}
                disabled={disabled}
                className="w-16 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                placeholder="cm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-36">Niveau des chevilles:</span>
              <input
                type="number"
                step="0.1"
                value={skirtValues.chevilles ?? ''}
                onChange={(e) => setSkirtValues({
                  ...skirtValues,
                  chevilles: e.target.value ? parseFloat(e.target.value) : null
                })}
                disabled={disabled}
                className="w-16 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                placeholder="cm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-36">Après genoux (crayon):</span>
              <input
                type="number"
                step="0.1"
                value={skirtValues.apresGenoux ?? ''}
                onChange={(e) => setSkirtValues({
                  ...skirtValues,
                  apresGenoux: e.target.value ? parseFloat(e.target.value) : null
                })}
                disabled={disabled}
                className="w-16 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                placeholder="cm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-36">Très longue:</span>
              <input
                type="number"
                step="0.1"
                value={skirtValues.tresLongue ?? ''}
                onChange={(e) => setSkirtValues({
                  ...skirtValues,
                  tresLongue: e.target.value ? parseFloat(e.target.value) : null
                })}
                disabled={disabled}
                className="w-16 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                placeholder="cm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="border rounded-lg dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Ruler className="w-5 h-5 text-primary-600" />
          <span className="font-medium text-gray-900 dark:text-white">
            Mensurations
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Date and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date des mensurations
              </label>
              <input
                type="date"
                value={formData.measurementDate || ''}
                onChange={(e) => updateField('measurementDate', e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Unité
              </label>
              <select
                value={formData.unit || 'cm'}
                onChange={(e) => updateField('unit', e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
              >
                <option value="cm">Centimètres (cm)</option>
                <option value="inches">Pouces (inches)</option>
              </select>
            </div>
          </div>

          {/* Measurements Table */}
          <div className="border rounded-lg dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center gap-2 p-2 bg-red-600 text-white rounded-t-lg">
              <span className="w-8 text-sm font-medium">N</span>
              <span className="flex-1 text-sm font-medium">PARTIES CONCERNEES</span>
              <span className="w-48 text-sm font-medium text-center">MESURES</span>
            </div>

            {/* Upper body (1-9) */}
            <div className="px-2">
              {renderNumberInput('dos', 'DOS', 1)}
              {renderNumberInput('carrureDevant', 'CARRURE DEVANT', 2)}
              {renderNumberInput('carrureDerriere', 'CARRURE DERRIERE', 3)}
              {renderNumberInput('epaule', 'EPAULE', 4)}
              {renderNumberInput('epauleManche', 'EPAULE MANCHE', 5)}
              {renderNumberInput('poitrine', 'POITRINE', 6)}
              {renderNumberInput('tourDeTaille', 'TOUR DE TAILLE', 7)}
              {renderNumberInput('longueurDetaille', 'LONGUEUR DETAILLE', 8)}
              {renderNumberInput('bassin', 'BASSIN', 9)}

              {/* Arms with sub-options */}
              {renderSleeveLengthField()}
              {renderNumberInput('tourDeManche', 'TOUR DE MANCHE', 11)}
              {renderNumberInput('poignets', 'POIGNETS', 12)}

              {/* Torso */}
              {renderNumberInput('pinces', 'PINCES', 13)}
              {renderNumberInput('longueurTotale', 'LONGUEUR TOTALE', 14)}
              {renderDressLengthField()}
              {renderNumberInput('longueurTunique', 'LONGUEUR TUNIQUE', 16)}
              {renderNumberInput('ceinture', 'CEINTURE', 17)}

              {/* Lower body */}
              {renderNumberInput('longueurPantalon', 'LONGUEUR PANTALON', 18)}
              {renderNumberInput('frappe', 'FRAPPE', 19)}
              {renderNumberInput('cuisse', 'CUISSE', 20)}
              {renderNumberInput('genoux', 'GENOUX', 21)}
              {renderSkirtLengthField()}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              AUTRES MESURES OU OBSERVATIONS
            </label>
            <textarea
              value={formData.autresMesures || ''}
              onChange={(e) => updateField('autresMesures', e.target.value || null)}
              disabled={disabled}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
              placeholder="Notes supplémentaires..."
            />
          </div>
        </div>
      )}
    </div>
  )
}
