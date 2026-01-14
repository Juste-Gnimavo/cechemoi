'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronUp, Ruler } from 'lucide-react'

// Sub-options for length fields with their own values
// Using string type to allow flexible input like "50 - 45"
interface SleeveLengthValues {
  manchesCourtes?: string | null
  avantCoudes?: string | null
  niveau34?: string | null
  manchesLongues?: string | null
}

interface DressLengthValues {
  avantGenoux?: string | null
  niveauGenoux?: string | null
  apresGenoux?: string | null
  miMollets?: string | null
  chevilles?: string | null
  tresLongue?: string | null
}

interface SkirtLengthValues {
  avantGenoux?: string | null
  niveauGenoux?: string | null
  apresGenoux?: string | null
  miMollets?: string | null
  chevilles?: string | null
  tresLongue?: string | null
}

interface MeasurementsFormData {
  measurementDate?: string
  unit?: 'cm' | 'inches'
  // All measurements are strings to allow flexible input like "50 - 45"
  dos?: string | null
  carrureDevant?: string | null
  carrureDerriere?: string | null
  epaule?: string | null
  epauleManche?: string | null
  poitrine?: string | null
  tourDeTaille?: string | null
  longueurDetaille?: string | null
  bassin?: string | null
  longueurManches?: string | null // JSON string for sub-values
  tourDeManche?: string | null
  poignets?: string | null
  pinces?: string | null
  longueurTotale?: string | null
  longueurRobes?: string | null // JSON string for sub-values
  longueurTunique?: string | null
  ceinture?: string | null
  longueurPantalon?: string | null
  frappe?: string | null
  cuisse?: string | null
  genoux?: string | null
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

  // Use ref to always have latest onChange without causing re-renders
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Track if we're syncing from initialData to avoid duplicate onChange calls
  const isSyncingRef = useRef(false)

  // Sync form data when initialData changes (e.g., after API fetch)
  useEffect(() => {
    if (initialData) {
      isSyncingRef.current = true
      const newData = {
        measurementDate: initialData.measurementDate || new Date().toISOString().split('T')[0],
        unit: initialData.unit || 'cm',
        dos: initialData.dos,
        carrureDevant: initialData.carrureDevant,
        carrureDerriere: initialData.carrureDerriere,
        epaule: initialData.epaule,
        epauleManche: initialData.epauleManche,
        poitrine: initialData.poitrine,
        tourDeTaille: initialData.tourDeTaille,
        longueurDetaille: initialData.longueurDetaille,
        bassin: initialData.bassin,
        longueurManches: initialData.longueurManches,
        tourDeManche: initialData.tourDeManche,
        poignets: initialData.poignets,
        pinces: initialData.pinces,
        longueurTotale: initialData.longueurTotale,
        longueurRobes: initialData.longueurRobes,
        longueurTunique: initialData.longueurTunique,
        ceinture: initialData.ceinture,
        longueurPantalon: initialData.longueurPantalon,
        frappe: initialData.frappe,
        cuisse: initialData.cuisse,
        genoux: initialData.genoux,
        longueurJupe: initialData.longueurJupe,
        autresMesures: initialData.autresMesures,
      }
      setFormData(newData)
      setSleeveValues(parseJsonField(initialData.longueurManches, {}))
      setDressValues(parseJsonField(initialData.longueurRobes, {}))
      setSkirtValues(parseJsonField(initialData.longueurJupe, {}))
      onChangeRef.current(newData)
      // Reset flag after a tick to allow future sub-value changes
      setTimeout(() => { isSyncingRef.current = false }, 0)
    }
  }, [initialData])

  // Update form data and notify parent when sub-values change (user input)
  useEffect(() => {
    // Skip if we're syncing from initialData
    if (isSyncingRef.current) return

    const hasSleeveValues = Object.values(sleeveValues).some(v => v !== null && v !== undefined && v !== '')
    const hasDressValues = Object.values(dressValues).some(v => v !== null && v !== undefined && v !== '')
    const hasSkirtValues = Object.values(skirtValues).some(v => v !== null && v !== undefined && v !== '')

    setFormData(prev => {
      const newData = {
        ...prev,
        longueurManches: hasSleeveValues ? JSON.stringify(sleeveValues) : null,
        longueurRobes: hasDressValues ? JSON.stringify(dressValues) : null,
        longueurJupe: hasSkirtValues ? JSON.stringify(skirtValues) : null,
      }
      onChangeRef.current(newData)
      return newData
    })
  }, [sleeveValues, dressValues, skirtValues])

  const updateField = (field: keyof MeasurementsFormData, value: any) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    onChangeRef.current(newData)
  }

  const renderTextInput = (
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
        type="text"
        value={formData[field] ?? ''}
        onChange={(e) =>
          updateField(field, e.target.value || null)
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
                type="text"
                value={sleeveValues.manchesCourtes ?? ''}
                onChange={(e) => setSleeveValues({
                  ...sleeveValues,
                  manchesCourtes: e.target.value || null
                })}
                disabled={disabled}
                className="w-16 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                placeholder="cm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-28">Niveau 3/4:</span>
              <input
                type="text"
                value={sleeveValues.niveau34 ?? ''}
                onChange={(e) => setSleeveValues({
                  ...sleeveValues,
                  niveau34: e.target.value || null
                })}
                disabled={disabled}
                className="w-16 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                placeholder="cm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-28">Avant les coudes:</span>
              <input
                type="text"
                value={sleeveValues.avantCoudes ?? ''}
                onChange={(e) => setSleeveValues({
                  ...sleeveValues,
                  avantCoudes: e.target.value || null
                })}
                disabled={disabled}
                className="w-16 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                placeholder="cm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-28">Manches longues:</span>
              <input
                type="text"
                value={sleeveValues.manchesLongues ?? ''}
                onChange={(e) => setSleeveValues({
                  ...sleeveValues,
                  manchesLongues: e.target.value || null
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
                type="text"
                value={dressValues.avantGenoux ?? ''}
                onChange={(e) => setDressValues({
                  ...dressValues,
                  avantGenoux: e.target.value || null
                })}
                disabled={disabled}
                className="w-16 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                placeholder="cm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-36">Mi-mollets:</span>
              <input
                type="text"
                value={dressValues.miMollets ?? ''}
                onChange={(e) => setDressValues({
                  ...dressValues,
                  miMollets: e.target.value || null
                })}
                disabled={disabled}
                className="w-16 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                placeholder="cm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-36">Au niveau des genoux:</span>
              <input
                type="text"
                value={dressValues.niveauGenoux ?? ''}
                onChange={(e) => setDressValues({
                  ...dressValues,
                  niveauGenoux: e.target.value || null
                })}
                disabled={disabled}
                className="w-16 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                placeholder="cm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-36">Niveau des chevilles:</span>
              <input
                type="text"
                value={dressValues.chevilles ?? ''}
                onChange={(e) => setDressValues({
                  ...dressValues,
                  chevilles: e.target.value || null
                })}
                disabled={disabled}
                className="w-16 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                placeholder="cm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-36">Après genoux (crayon):</span>
              <input
                type="text"
                value={dressValues.apresGenoux ?? ''}
                onChange={(e) => setDressValues({
                  ...dressValues,
                  apresGenoux: e.target.value || null
                })}
                disabled={disabled}
                className="w-16 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                placeholder="cm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-36">Très longue:</span>
              <input
                type="text"
                value={dressValues.tresLongue ?? ''}
                onChange={(e) => setDressValues({
                  ...dressValues,
                  tresLongue: e.target.value || null
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
                type="text"
                value={skirtValues.avantGenoux ?? ''}
                onChange={(e) => setSkirtValues({
                  ...skirtValues,
                  avantGenoux: e.target.value || null
                })}
                disabled={disabled}
                className="w-16 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                placeholder="cm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-36">Mi-mollets:</span>
              <input
                type="text"
                value={skirtValues.miMollets ?? ''}
                onChange={(e) => setSkirtValues({
                  ...skirtValues,
                  miMollets: e.target.value || null
                })}
                disabled={disabled}
                className="w-16 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                placeholder="cm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-36">Au niveau des genoux:</span>
              <input
                type="text"
                value={skirtValues.niveauGenoux ?? ''}
                onChange={(e) => setSkirtValues({
                  ...skirtValues,
                  niveauGenoux: e.target.value || null
                })}
                disabled={disabled}
                className="w-16 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                placeholder="cm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-36">Niveau des chevilles:</span>
              <input
                type="text"
                value={skirtValues.chevilles ?? ''}
                onChange={(e) => setSkirtValues({
                  ...skirtValues,
                  chevilles: e.target.value || null
                })}
                disabled={disabled}
                className="w-16 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                placeholder="cm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-36">Après genoux (crayon):</span>
              <input
                type="text"
                value={skirtValues.apresGenoux ?? ''}
                onChange={(e) => setSkirtValues({
                  ...skirtValues,
                  apresGenoux: e.target.value || null
                })}
                disabled={disabled}
                className="w-16 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
                placeholder="cm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-36">Très longue:</span>
              <input
                type="text"
                value={skirtValues.tresLongue ?? ''}
                onChange={(e) => setSkirtValues({
                  ...skirtValues,
                  tresLongue: e.target.value || null
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
              {renderTextInput('dos', 'DOS', 1)}
              {renderTextInput('carrureDevant', 'CARRURE DEVANT', 2)}
              {renderTextInput('carrureDerriere', 'CARRURE DERRIERE', 3)}
              {renderTextInput('epaule', 'EPAULE', 4)}
              {renderTextInput('epauleManche', 'EPAULE MANCHE', 5)}
              {renderTextInput('poitrine', 'POITRINE', 6)}
              {renderTextInput('tourDeTaille', 'TOUR DE TAILLE', 7)}
              {renderTextInput('longueurDetaille', 'LONGUEUR DETAILLE', 8)}
              {renderTextInput('bassin', 'BASSIN', 9)}

              {/* Arms with sub-options */}
              {renderSleeveLengthField()}
              {renderTextInput('tourDeManche', 'TOUR DE MANCHE', 11)}
              {renderTextInput('poignets', 'POIGNETS', 12)}

              {/* Torso */}
              {renderTextInput('pinces', 'PINCES', 13)}
              {renderTextInput('longueurTotale', 'LONGUEUR TOTALE', 14)}
              {renderDressLengthField()}
              {renderTextInput('longueurTunique', 'LONGUEUR TUNIQUE', 16)}
              {renderTextInput('ceinture', 'CEINTURE', 17)}

              {/* Lower body */}
              {renderTextInput('longueurPantalon', 'LONGUEUR PANTALON', 18)}
              {renderTextInput('frappe', 'FRAPPE', 19)}
              {renderTextInput('cuisse', 'CUISSE', 20)}
              {renderTextInput('genoux', 'GENOUX', 21)}
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
