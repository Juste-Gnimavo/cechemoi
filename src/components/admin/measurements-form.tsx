'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Ruler } from 'lucide-react'

interface MeasurementsFormData {
  measurementDate?: string
  unit?: 'cm' | 'inches'
  dos?: string | null
  carrureDevant?: string | null
  carrureDerriere?: string | null
  epaule?: string | null
  epauleManche?: string | null
  poitrine?: string | null
  tourDeTaille?: string | null
  longueurDetaille?: string | null
  bassin?: string | null
  longueurManches?: string | null
  tourDeManche?: string | null
  poignets?: string | null
  pinces?: string | null
  longueurTotale?: string | null
  longueurRobes?: string | null
  longueurTunique?: string | null
  ceinture?: string | null
  longueurPantalon?: string | null
  frappe?: string | null
  cuisse?: string | null
  genoux?: string | null
  longueurJupe?: string | null
  autresMesures?: string | null
}

interface MeasurementsFormProps {
  initialData?: MeasurementsFormData
  onChange: (data: MeasurementsFormData) => void
  disabled?: boolean
  collapsed?: boolean
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

  // Sync form data when initialData changes (e.g., after API fetch)
  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
      onChange(initialData)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData])

  const updateField = (field: keyof MeasurementsFormData, value: string | null) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    onChange(newData)
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
        value={(formData[field] as string) ?? ''}
        onChange={(e) => updateField(field, e.target.value || null)}
        disabled={disabled}
        className="w-24 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
        placeholder={formData.unit || 'cm'}
      />
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
              <span className="w-24 text-sm font-medium text-center">MESURES</span>
            </div>

            {/* All measurements as simple text inputs */}
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
              {renderTextInput('longueurManches', 'LONGUEUR DES MANCHES', 10)}
              {renderTextInput('tourDeManche', 'TOUR DE MANCHE', 11)}
              {renderTextInput('poignets', 'POIGNETS', 12)}
              {renderTextInput('pinces', 'PINCES', 13)}
              {renderTextInput('longueurTotale', 'LONGUEUR TOTALE', 14)}
              {renderTextInput('longueurRobes', 'LONGUEUR DES ROBES', 15)}
              {renderTextInput('longueurTunique', 'LONGUEUR TUNIQUE', 16)}
              {renderTextInput('ceinture', 'CEINTURE', 17)}
              {renderTextInput('longueurPantalon', 'LONGUEUR PANTALON', 18)}
              {renderTextInput('frappe', 'FRAPPE', 19)}
              {renderTextInput('cuisse', 'CUISSE', 20)}
              {renderTextInput('genoux', 'GENOUX', 21)}
              {renderTextInput('longueurJupe', 'LONGUEUR JUPE', 22)}
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
