'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Ruler, Download, Calendar, User } from 'lucide-react'

interface Measurement {
  id: string
  measurementDate: string | Date
  unit: string
  takenByStaffName?: string | null
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

interface MeasurementsDisplayProps {
  measurement: Measurement | null
  measurementHistory?: Measurement[]
  showHistory?: boolean
  onDownloadPDF?: (measurementId?: string) => void
  isDownloading?: boolean
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatValue(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '-'
  return value
}

export function MeasurementsDisplay({
  measurement,
  measurementHistory = [],
  showHistory = false,
  onDownloadPDF,
  isDownloading = false,
}: MeasurementsDisplayProps) {
  const [showHistoryList, setShowHistoryList] = useState(false)

  if (!measurement) {
    return (
      <div className="p-6 text-center border rounded-lg dark:border-gray-700">
        <Ruler className="w-12 h-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-500 dark:text-gray-400">
          Aucune mensuration enregistrée
        </p>
      </div>
    )
  }

  // Simple fields (single value)
  const simpleFields = [
    { num: 1, label: 'DOS', value: measurement.dos },
    { num: 2, label: 'CARRURE DEVANT', value: measurement.carrureDevant },
    { num: 3, label: 'CARRURE DERRIERE', value: measurement.carrureDerriere },
    { num: 4, label: 'EPAULE', value: measurement.epaule },
    { num: 5, label: 'EPAULE MANCHE', value: measurement.epauleManche },
    { num: 6, label: 'POITRINE', value: measurement.poitrine },
    { num: 7, label: 'TOUR DE TAILLE', value: measurement.tourDeTaille },
    { num: 8, label: 'LONGUEUR DETAILLE', value: measurement.longueurDetaille },
    { num: 9, label: 'BASSIN', value: measurement.bassin },
  ]

  const sleeveFields = [
    { label: 'Manches courtes', value: measurement.longueurManchesCourtes },
    { label: 'Niveau 3/4', value: measurement.longueurManchesNiveau34 },
    { label: 'Avant les coudes', value: measurement.longueurManchesAvantCoudes },
    { label: 'Manches longues', value: measurement.longueurManchesLongues },
  ]

  const simpleFields2 = [
    { num: 11, label: 'TOUR DE MANCHE', value: measurement.tourDeManche },
    { num: 12, label: 'POIGNETS', value: measurement.poignets },
    { num: 13, label: 'PINCES', value: measurement.pinces },
    { num: 14, label: 'LONGUEUR TOTALE', value: measurement.longueurTotale },
  ]

  const dressFields = [
    { label: 'Avant les genoux', value: measurement.longueurRobesAvantGenoux },
    { label: 'Mi-mollets', value: measurement.longueurRobesMiMollets },
    { label: 'Au niveau des genoux', value: measurement.longueurRobesNiveauGenoux },
    { label: 'Niveau des chevilles', value: measurement.longueurRobesChevilles },
    { label: 'Après les genoux (crayon)', value: measurement.longueurRobesApresGenoux },
    { label: 'Très longue', value: measurement.longueurRobesTresLongue },
  ]

  const simpleFields3 = [
    { num: 16, label: 'LONGUEUR TUNIQUE', value: measurement.longueurTunique },
    { num: 17, label: 'CEINTURE', value: measurement.ceinture },
    { num: 18, label: 'LONGUEUR PANTALON', value: measurement.longueurPantalon },
    { num: 19, label: 'FRAPPE', value: measurement.frappe },
    { num: 20, label: 'CUISSE', value: measurement.cuisse },
    { num: 21, label: 'GENOUX', value: measurement.genoux },
  ]

  const skirtFields = [
    { label: 'Avant les genoux', value: measurement.longueurJupeAvantGenoux },
    { label: 'Mi-mollets', value: measurement.longueurJupeMiMollets },
    { label: 'Au niveau des genoux', value: measurement.longueurJupeNiveauGenoux },
    { label: 'Niveau des chevilles', value: measurement.longueurJupeChevilles },
    { label: 'Après les genoux (crayon)', value: measurement.longueurJupeApresGenoux },
    { label: 'Très longue', value: measurement.longueurJupeTresLongue },
  ]

  const renderSimpleRow = (num: number, label: string, value: string | null | undefined) => (
    <div
      key={num}
      className={`flex items-center gap-2 px-3 py-2 ${
        num % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''
      }`}
    >
      <span className="w-8 text-sm text-gray-500 dark:text-gray-400">{num}</span>
      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{label}</span>
      <span className="w-32 text-sm font-medium text-gray-900 dark:text-white text-right">
        {formatValue(value)}
      </span>
    </div>
  )

  const renderGroupRow = (
    num: number,
    label: string,
    subFields: { label: string; value: string | null | undefined }[]
  ) => {
    const hasValues = subFields.some((f) => f.value)
    return (
      <div
        key={num}
        className={`px-3 py-2 ${num % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}
      >
        <div className="flex items-start gap-2">
          <span className="w-8 text-sm text-gray-500 dark:text-gray-400">{num}</span>
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
            {hasValues ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 pl-2 text-xs">
                {subFields.map((sf, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <span className="text-gray-500 dark:text-gray-400">{sf.label}:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatValue(sf.value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-sm text-gray-400 dark:text-gray-500 ml-4">-</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ruler className="w-5 h-5 text-primary-600" />
          <h3 className="font-medium text-gray-900 dark:text-white">
            Mes Mensurations
          </h3>
        </div>
        {onDownloadPDF && (
          <button
            onClick={() => onDownloadPDF(measurement.id)}
            disabled={isDownloading}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? 'Téléchargement...' : 'Télécharger PDF'}
          </button>
        )}
      </div>

      {/* Measurement Info */}
      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(measurement.measurementDate)}</span>
        </div>
        {measurement.takenByStaffName && (
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span>Par {measurement.takenByStaffName}</span>
          </div>
        )}
      </div>

      {/* Measurements Table */}
      <div className="border rounded-lg dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 p-3 bg-red-600 text-white">
          <span className="w-8 text-sm font-medium">N</span>
          <span className="flex-1 text-sm font-medium">PARTIES CONCERNÉES</span>
          <span className="w-32 text-sm font-medium text-right">MESURES</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {/* Simple fields 1-9 */}
          {simpleFields.map((field) => renderSimpleRow(field.num, field.label, field.value))}

          {/* 10. LONGUEUR DES MANCHES */}
          {renderGroupRow(10, 'LONGUEUR DES MANCHES', sleeveFields)}

          {/* Simple fields 11-14 */}
          {simpleFields2.map((field) => renderSimpleRow(field.num, field.label, field.value))}

          {/* 15. LONGUEUR DES ROBES */}
          {renderGroupRow(15, 'LONGUEUR DES ROBES', dressFields)}

          {/* Simple fields 16-21 */}
          {simpleFields3.map((field) => renderSimpleRow(field.num, field.label, field.value))}

          {/* 22. LONGUEUR JUPE */}
          {renderGroupRow(22, 'LONGUEUR JUPE', skirtFields)}
        </div>
      </div>

      {/* Notes */}
      {measurement.autresMesures && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            AUTRES MESURES OU OBSERVATIONS
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
            {measurement.autresMesures}
          </p>
        </div>
      )}

      {/* History Toggle */}
      {showHistory && measurementHistory.length > 1 && (
        <div className="border-t dark:border-gray-700 pt-4">
          <button
            onClick={() => setShowHistoryList(!showHistoryList)}
            className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
          >
            {showHistoryList ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            Voir l&apos;historique ({measurementHistory.length} enregistrements)
          </button>

          {showHistoryList && (
            <div className="mt-3 space-y-2">
              {measurementHistory.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-center justify-between p-3 rounded-lg border dark:border-gray-700 ${
                    m.id === measurement.id
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(m.measurementDate)}
                    </p>
                    {m.takenByStaffName && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Par {m.takenByStaffName}
                      </p>
                    )}
                  </div>
                  {onDownloadPDF && (
                    <button
                      onClick={() => onDownloadPDF(m.id)}
                      disabled={isDownloading}
                      className="p-2 text-gray-400 hover:text-primary-600 disabled:opacity-50"
                      title="Télécharger ce PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
