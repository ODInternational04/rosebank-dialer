'use client'

import React, { useState } from 'react'
import { 
  ArrowUpTrayIcon, 
  DocumentArrowUpIcon, 
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'
import * as XLSX from 'xlsx'

interface BulkUploadModalProps {
  onClose: () => void
  onSuccess: () => void
}

interface FieldMapping {
  csvField: string
  dbField: string
}

interface UploadResult {
  success: boolean
  inserted: number
  updated: number
  errors: Array<{ row: number; error: string; data: any }>
  details: {
    total: number
    processed: number
    skipped: number
  }
}

const VAULT_FIELDS = [
  { value: 'box_number', label: 'Box Number *', required: true },
  { value: 'size', label: 'Size', required: false },
  { value: 'contract_no', label: 'Contract Number *', required: true },
  { value: 'principal_key_holder', label: 'Name/Key Holder *', required: true },
  { value: 'principal_key_holder_id_number', label: 'ID Number', required: false },
  { value: 'principal_key_holder_email_address', label: 'Email *', required: true },
  { value: 'telephone_cell', label: 'Cell Phone *', required: true },
  { value: 'telephone_home', label: 'Home Phone', required: false },
  { value: 'contract_start_date', label: 'Contract Start Date', required: false },
  { value: 'contract_end_date', label: 'Contract End Date', required: false },
  { value: 'occupation', label: 'Occupation', required: false },
  { value: 'notes', label: 'Notes', required: false },
]

const GOLD_FIELDS = [
  { value: 'principal_key_holder', label: 'Name/Key Holder *', required: true },
  { value: 'principal_key_holder_email_address', label: 'Email *', required: true },
  { value: 'telephone_cell', label: 'Cell Phone *', required: true },
  { value: 'telephone_home', label: 'Home Phone', required: false },
  { value: 'notes', label: 'Notes', required: false },
]

export default function BulkUploadModal({ onClose, onSuccess }: BulkUploadModalProps) {
  const [step, setStep] = useState(1) // 1: Select type, 2: Match fields, 3: Upload file, 4: Map fields, 5: Results
  const [clientType, setClientType] = useState<'vault' | 'gold'>('vault')
  const [matchFields, setMatchFields] = useState<string[]>([]) // Fields to match on for updates
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<any[]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)

  const availableFields = clientType === 'vault' ? VAULT_FIELDS : GOLD_FIELDS
  
  // Get matchable fields (exclude notes and optional fields that aren't good for matching)
  const matchableFields = availableFields.filter(f => 
    !['notes', 'size', 'occupation', 'telephone_home', 'contract_start_date', 'contract_end_date'].includes(f.value)
  )

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = event.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        if (json.length > 0) {
          const headers = json[0] as string[]
          const rows = json.slice(1)
          
          setCsvHeaders(headers)
          setCsvData(rows.map((row: any) => {
            const obj: any = {}
            headers.forEach((header, index) => {
              obj[header] = row[index]
            })
            return obj
          }))

          // Auto-map fields based on header names
          const autoMappings = headers.map(header => {
            const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '_')
            const matchedField = availableFields.find(field => 
              field.value.toLowerCase().includes(normalizedHeader) ||
              normalizedHeader.includes(field.value.toLowerCase()) ||
              field.label.toLowerCase().replace(/[^a-z0-9]/g, '_').includes(normalizedHeader)
            )
            return {
              csvField: header,
              dbField: matchedField?.value || ''
            }
          })
          setFieldMappings(autoMappings)
          setStep(4)
        }
      } catch (error) {
        console.error('Error parsing file:', error)
        alert('Error parsing file. Please ensure it\'s a valid Excel or CSV file.')
      }
    }

    if (selectedFile.name.endsWith('.csv')) {
      reader.readAsText(selectedFile)
    } else {
      reader.readAsBinaryString(selectedFile)
    }
  }

  const handleMappingChange = (csvField: string, dbField: string) => {
    setFieldMappings(prev => 
      prev.map(mapping => 
        mapping.csvField === csvField 
          ? { ...mapping, dbField } 
          : mapping
      )
    )
  }

  const toggleMatchField = (field: string) => {
    setMatchFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    )
  }

  const handleUpload = async () => {
    setUploading(true)

    try {
      // Transform CSV data to match database schema
      const transformedData = csvData.map(row => {
        const transformed: any = { client_type: clientType }
        fieldMappings.forEach(mapping => {
          if (mapping.dbField && row[mapping.csvField]) {
            transformed[mapping.dbField] = row[mapping.csvField]
          }
        })
        return transformed
      })

      const token = localStorage.getItem('token')
      const response = await fetch('/api/clients/bulk-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          clients: transformedData,
          clientType,
          matchFields: matchFields.length > 0 ? matchFields : undefined
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        setUploadResult(result)
        setStep(5)
        if (result.details.processed > 0) {
          setTimeout(() => {
            onSuccess()
          }, 3000)
        }
      } else {
        alert(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Error uploading data')
    } finally {
      setUploading(false)
    }
  }

  const requiredFieldsMapped = () => {
    const requiredFields = availableFields.filter(f => f.required).map(f => f.value)
    const mappedFields = fieldMappings.filter(m => m.dbField).map(m => m.dbField)
    return requiredFields.every(field => mappedFields.includes(field))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <ArrowUpTrayIcon className="w-6 h-6 mr-2" />
              Bulk Upload Clients
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Step {step} of 5 - {
                step === 1 ? 'Select Client Type' :
                step === 2 ? 'Choose Match Fields' :
                step === 3 ? 'Upload File' :
                step === 4 ? 'Map Fields' :
                'Upload Results'
              }
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Select Client Type */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Select Client Type</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setClientType('vault')}
                    className={`p-6 border-2 rounded-lg transition-all ${
                      clientType === 'vault'
                        ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200'
                        : 'border-gray-300 hover:border-primary-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">🔐</div>
                      <h4 className="font-bold text-lg">Vault Clients</h4>
                      <p className="text-sm text-gray-600 mt-2">
                        Full details including box number, contract info, dates
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => setClientType('gold')}
                    className={`p-6 border-2 rounded-lg transition-all ${
                      clientType === 'gold'
                        ? 'border-yellow-600 bg-yellow-50 ring-2 ring-yellow-200'
                        : 'border-gray-300 hover:border-yellow-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">⭐</div>
                      <h4 className="font-bold text-lg">Gold Clients</h4>
                      <p className="text-sm text-gray-600 mt-2">
                        Simplified: name, email, phone, notes only
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Required Fields:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  {availableFields.filter(f => f.required).map(field => (
                    <li key={field.value}>• {field.label}</li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-end">
                <button onClick={() => setStep(2)} className="btn btn-primary">
                  Next: Choose Match Fields
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Choose Match Fields */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Choose Fields to Match On</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Select which field(s) to use for identifying existing clients. If a match is found, the client will be updated instead of creating a duplicate.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">Select Match Criteria:</h4>
                {matchableFields.map((field) => (
                  <label 
                    key={field.value}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={matchFields.includes(field.value)}
                      onChange={() => toggleMatchField(field.value)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">{field.label.replace(' *', '')}</span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {field.value === 'box_number' && 'Unique box identifier'}
                        {field.value === 'contract_no' && 'Unique contract number'}
                        {field.value === 'principal_key_holder' && 'Client name'}
                        {field.value === 'principal_key_holder_id_number' && 'ID/Passport number'}
                        {field.value === 'principal_key_holder_email_address' && 'Email address'}
                        {field.value === 'telephone_cell' && 'Mobile phone number'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {matchFields.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    ℹ️ <strong>No match fields selected:</strong> All records will be treated as new clients. 
                    Select one or more fields to enable updating existing clients.
                  </p>
                </div>
              )}

              {matchFields.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    ✓ <strong>Match criteria:</strong> Clients matching on <strong>{matchFields.length > 1 ? 'ALL' : ''}</strong> selected field{matchFields.length > 1 ? 's' : ''} will be updated:
                  </p>
                  <ul className="text-sm text-green-700 mt-2 ml-4 list-disc">
                    {matchFields.map(field => (
                      <li key={field}>{matchableFields.find(f => f.value === field)?.label.replace(' *', '')}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="btn btn-secondary">
                  Back
                </button>
                <button onClick={() => setStep(3)} className="btn btn-primary">
                  Next: Upload File
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Upload File */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Upload Excel or CSV File</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <DocumentArrowUpIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="btn btn-primary">
                      Choose File
                    </span>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                    />
                  </label>
                  <p className="text-sm text-gray-600 mt-4">
                    {file ? file.name : 'Supports Excel (.xlsx, .xls) and CSV (.csv) files'}
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">💡 Tips:</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• First row should contain column headers</li>
                  <li>• Use clear, descriptive header names for auto-mapping</li>
                  <li>• Dates should be in YYYY-MM-DD format</li>
                  <li>• Existing clients will be updated if found</li>
                </ul>
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="btn btn-secondary">
                  Back
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Map Fields */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Map Your Columns</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Match your file columns to database fields. Found {csvData.length} rows.
                </p>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {fieldMappings.map((mapping, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700">
                        Column: <span className="text-primary-600">{mapping.csvField}</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Sample: {csvData[0]?.[mapping.csvField] || 'N/A'}
                      </p>
                    </div>
                    <div className="flex-1">
                      <select
                        value={mapping.dbField}
                        onChange={(e) => handleMappingChange(mapping.csvField, e.target.value)}
                        className="input text-sm"
                      >
                        <option value="">-- Skip this column --</option>
                        {availableFields.map(field => (
                          <option key={field.value} value={field.value}>
                            {field.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {!requiredFieldsMapped() && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    ⚠️ Please map all required fields marked with *
                  </p>
                </div>
              )}

              <div className="flex justify-between">
                <button onClick={() => setStep(3)} className="btn btn-secondary">
                  Back
                </button>
                <button 
                  onClick={handleUpload} 
                  disabled={!requiredFieldsMapped() || uploading}
                  className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : `Upload ${csvData.length} Clients`}
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Results */}
          {step === 5 && uploadResult && (
            <div className="space-y-6">
              <div className="text-center">
                {uploadResult.success ? (
                  <CheckCircleIcon className="w-16 h-16 text-success-600 mx-auto mb-4" />
                ) : (
                  <ExclamationCircleIcon className="w-16 h-16 text-warning-600 mx-auto mb-4" />
                )}
                <h3 className="text-2xl font-bold mb-2">
                  {uploadResult.success ? 'Upload Complete!' : 'Upload Completed with Errors'}
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-success-50 border border-success-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-success-700">{uploadResult.inserted}</div>
                  <div className="text-sm text-success-600">New Clients</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-700">{uploadResult.updated}</div>
                  <div className="text-sm text-blue-600">Updated</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-gray-700">{uploadResult.details.skipped}</div>
                  <div className="text-sm text-gray-600">Skipped</div>
                </div>
              </div>

              {uploadResult.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-red-700">Errors ({uploadResult.errors.length}):</h4>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {uploadResult.errors.map((error, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded p-3 text-sm">
                        <p className="font-medium text-red-800">Row {error.row}: {error.error}</p>
                        <p className="text-red-600 text-xs mt-1">
                          {JSON.stringify(error.data).substring(0, 100)}...
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button onClick={onClose} className="btn btn-primary">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
