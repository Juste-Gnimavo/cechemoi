'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Ruler } from 'lucide-react'

interface MeasurementsFormData {
  measurementDate?: string
  unit?: 'cm' | 'inches'
  // Upper body (1-9)
  dos?: string | null
  carrureDevant?: string | null
  carrureDerriere?: string | null
  epaule?: string | null
  epauleManche?: string | null
  poitrine?: string | null
  tourDeTaille?: string | null
  longueurDetaille?: string | null
  bassin?: string | null
  // 10. LONGUEUR DES MANCHES - 4 sub-fields
  longueurManchesCourtes?: string | null
  longueurManchesAvantCoudes?: string | null
  longueurManchesNiveau34?: string | null
  longueurManchesLongues?: string | null
  // Arms continued (11-12)
  tourDeManche?: string | null
  poignets?: string | null
  // Torso (13-14)
  pinces?: string | null
  longueurTotale?: string | null
  // 15. LONGUEUR DES ROBES - 6 sub-fields
  longueurRobesAvantGenoux?: string | null
  longueurRobesNiveauGenoux?: string | null
  longueurRobesApresGenoux?: string | null
  longueurRobesMiMollets?: string | null
  longueurRobesChevilles?: string | null
  longueurRobesTresLongue?: string | null
  // Torso continued (16-17)
  longueurTunique?: string | null
  ceinture?: string | null
  // Lower body (18-21)
  longueurPantalon?: string | null
  frappe?: string | null
  cuisse?: string | null
  genoux?: string | null
  // 22. LONGUEUR JUPE - 6 sub-fields
  longueurJupeAvantGenoux?: string | null
  longueurJupeNiveauGenoux?: string | null
  longueurJupeApresGenoux?: string | null
  longueurJupeMiMollets?: string | null
  longueurJupeChevilles?: string | null
  longueurJupeTresLongue?: string | null
  // Notes
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
    num: number | string
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

  const renderSubFieldInput = (
    field: keyof MeasurementsFormData,
    label: string
  ) => (
    <div className="flex items-center gap-2 py-1">
      <label className="flex-1 text-xs text-gray-600 dark:text-gray-400">
        {label}:
      </label>
      <input
        type="text"
        value={(formData[field] as string) ?? ''}
        onChange={(e) => updateField(field, e.target.value || null)}
        disabled={disabled}
        className="w-20 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
        placeholder={formData.unit || 'cm'}
      />
    </div>
  )

  const renderGroupField = (
    num: number,
    label: string,
    subFields: { field: keyof MeasurementsFormData; label: string }[]
  ) => (
    <div className="py-2 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-2">
        <span className="w-8 text-sm text-gray-500 dark:text-gray-400 pt-1">{num}</span>
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
            {label}
          </label>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-2 bg-gray-50 dark:bg-gray-800/50 rounded p-2">
            {subFields.map((sf) => (
              <div key={sf.field} className="flex items-center gap-2">
                <label className="flex-1 text-xs text-gray-600 dark:text-gray-400 truncate">
                  {sf.label}:
                </label>
                <input
                  type="text"
                  value={(formData[sf.field] as string) ?? ''}
                  onChange={(e) => updateField(sf.field, e.target.value || null)}
                  disabled={disabled}
                  className="w-16 px-1 py-0.5 text-xs border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
                  placeholder={formData.unit || 'cm'}
                />
              </div>
            ))}
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
                Unite
              </label>
              <select
                value={formData.unit || 'cm'}
                onChange={(e) => updateField('unit', e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50"
              >
                <option value="cm">Centimetres (cm)</option>
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

            {/* All measurements */}
            <div className="px-2">
              {/* Upper body (1-9) */}
              {renderTextInput('dos', 'DOS', 1)}
              {renderTextInput('carrureDevant', 'CARRURE DEVANT', 2)}
              {renderTextInput('carrureDerriere', 'CARRURE DERRIERE', 3)}
              {renderTextInput('epaule', 'EPAULE', 4)}
              {renderTextInput('epauleManche', 'EPAULE MANCHE', 5)}
              {renderTextInput('poitrine', 'POITRINE', 6)}
              {renderTextInput('tourDeTaille', 'TOUR DE TAILLE', 7)}
              {renderTextInput('longueurDetaille', 'LONGUEUR DETAILLE', 8)}
              {renderTextInput('bassin', 'BASSIN', 9)}

              {/* 10. LONGUEUR DES MANCHES - 4 sub-fields */}
              {renderGroupField(10, 'LONGUEUR DES MANCHES', [
                { field: 'longueurManchesCourtes', label: 'Manches courtes' },
                { field: 'longueurManchesNiveau34', label: 'Niveau 3/4' },
                { field: 'longueurManchesAvantCoudes', label: 'Avant les coudes' },
                { field: 'longueurManchesLongues', label: 'Manches longues' },
              ])}

              {/* Arms continued (11-12) */}
              {renderTextInput('tourDeManche', 'TOUR DE MANCHE', 11)}
              {renderTextInput('poignets', 'POIGNETS', 12)}

              {/* Torso (13-14) */}
              {renderTextInput('pinces', 'PINCES', 13)}
              {renderTextInput('longueurTotale', 'LONGUEUR TOTALE', 14)}

              {/* 15. LONGUEUR DES ROBES - 6 sub-fields */}
              {renderGroupField(15, 'LONGUEUR DES ROBES', [
                { field: 'longueurRobesAvantGenoux', label: 'Avant les genoux' },
                { field: 'longueurRobesMiMollets', label: 'Mi-mollets' },
                { field: 'longueurRobesNiveauGenoux', label: 'Au niveau des genoux' },
                { field: 'longueurRobesChevilles', label: 'Niveau des chevilles' },
                { field: 'longueurRobesApresGenoux', label: 'Apres les genoux (crayon)' },
                { field: 'longueurRobesTresLongue', label: 'Tres longue' },
              ])}

              {/* Torso continued (16-17) */}
              {renderTextInput('longueurTunique', 'LONGUEUR TUNIQUE', 16)}
              {renderTextInput('ceinture', 'CEINTURE', 17)}

              {/* Lower body (18-21) */}
              {renderTextInput('longueurPantalon', 'LONGUEUR PANTALON', 18)}
              {renderTextInput('frappe', 'FRAPPE', 19)}
              {renderTextInput('cuisse', 'CUISSE', 20)}
              {renderTextInput('genoux', 'GENOUX', 21)}

              {/* 22. LONGUEUR JUPE - 6 sub-fields */}
              {renderGroupField(22, 'LONGUEUR JUPE', [
                { field: 'longueurJupeAvantGenoux', label: 'Avant les genoux' },
                { field: 'longueurJupeMiMollets', label: 'Mi-mollets' },
                { field: 'longueurJupeNiveauGenoux', label: 'Au niveau des genoux' },
                { field: 'longueurJupeChevilles', label: 'Niveau des chevilles' },
                { field: 'longueurJupeApresGenoux', label: 'Apres les genoux (crayon)' },
                { field: 'longueurJupeTresLongue', label: 'Tres longue' },
              ])}
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
              placeholder="Notes supplementaires..."
            />
          </div>
        </div>
      )}
    </div>
  )
}
